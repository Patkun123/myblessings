import { and, eq, isNull, sql } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { transaction, wallet } from '@/db/schema';

export type WalletBalanceRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  openingBalanceCentavos: number;
  balanceCentavos: number;
  transactionCount: number;
};

/**
 * Balance is always derived from the ledger:
 *   opening_balance + Σ(inflow) − Σ(outflow), ignoring soft-deleted rows.
 * There is no stored balance column, so it can never disagree with history.
 */
const signedAmount = sql<number>`COALESCE(SUM(CASE
  WHEN ${transaction.type} IN ('income', 'transfer_in') THEN ${transaction.amountCentavos}
  WHEN ${transaction.type} IN ('expense', 'transfer_out') THEN -${transaction.amountCentavos}
  ELSE 0 END), 0)`;

const liveTransactionCount = sql<number>`COUNT(${transaction.id})`;

export function walletBalancesQuery(userId: string) {
  return getDb()
    .select({
      id: wallet.id,
      name: wallet.name,
      icon: wallet.icon,
      color: wallet.color,
      openingBalanceCentavos: wallet.openingBalanceCentavos,
      balanceCentavos: sql<number>`${wallet.openingBalanceCentavos} + ${signedAmount}`,
      transactionCount: liveTransactionCount,
    })
    .from(wallet)
    .leftJoin(
      transaction,
      and(eq(transaction.walletId, wallet.id), isNull(transaction.deletedAt))
    )
    .where(and(eq(wallet.userId, userId), eq(wallet.isArchived, false), isNull(wallet.deletedAt)))
    .groupBy(wallet.id)
    .orderBy(wallet.sortOrder, wallet.name);
}

export function totalBalanceQuery(userId: string) {
  return getDb()
    .select({
      totalCentavos: sql<number>`COALESCE(SUM(${wallet.openingBalanceCentavos}), 0) + COALESCE(SUM(${signedAmount}), 0)`,
    })
    .from(wallet)
    .leftJoin(
      transaction,
      and(eq(transaction.walletId, wallet.id), isNull(transaction.deletedAt))
    )
    .where(and(eq(wallet.userId, userId), eq(wallet.isArchived, false), isNull(wallet.deletedAt)));
}
