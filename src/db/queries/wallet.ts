import { and, eq, isNull, sql } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { liveTransactionCountSql, signedAmountSql } from '@/db/queries/ledger';
import { transaction, wallet } from '@/db/schema';
import { newId } from '@/utils/id';

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
export function walletBalancesQuery(userId: string) {
  return getDb()
    .select({
      id: wallet.id,
      name: wallet.name,
      icon: wallet.icon,
      color: wallet.color,
      openingBalanceCentavos: wallet.openingBalanceCentavos,
      balanceCentavos: sql<number>`${wallet.openingBalanceCentavos} + ${signedAmountSql}`,
      transactionCount: liveTransactionCountSql,
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
      totalCentavos: sql<number>`COALESCE(SUM(${wallet.openingBalanceCentavos}), 0) + ${signedAmountSql}`,
    })
    .from(wallet)
    .leftJoin(
      transaction,
      and(eq(transaction.walletId, wallet.id), isNull(transaction.deletedAt))
    )
    .where(and(eq(wallet.userId, userId), eq(wallet.isArchived, false), isNull(wallet.deletedAt)));
}

export type NewWalletInput = {
  userId: string;
  name: string;
  icon: string;
  color: string;
  openingBalanceCentavos: number;
};

/**
 * Creates a wallet. Nothing is created automatically — every wallet comes from
 * this call, including the first one, so the user always names it and states
 * the opening balance themselves.
 *
 * `sortOrder` appends to the end of the user's list; the balance is not stored,
 * it is derived from `opening_balance + Σ ledger` (see `walletBalancesQuery`).
 */
export async function createWallet(input: NewWalletInput): Promise<string> {
  const database = getDb();
  const id = newId();

  const [order] = await database
    .select({ next: sql<number>`COALESCE(MAX(${wallet.sortOrder}), -1) + 1` })
    .from(wallet)
    .where(eq(wallet.userId, input.userId));

  await database.insert(wallet).values({
    id,
    userId: input.userId,
    name: input.name,
    icon: input.icon,
    color: input.color,
    openingBalanceCentavos: input.openingBalanceCentavos,
    sortOrder: order?.next ?? 0,
  });

  return id;
}

/** Non-archived wallets, used to decide whether onboarding is finished. */
export async function countActiveWallets(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`COUNT(*)` })
    .from(wallet)
    .where(and(eq(wallet.userId, userId), eq(wallet.isArchived, false), isNull(wallet.deletedAt)));

  return row?.count ?? 0;
}
