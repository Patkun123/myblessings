import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { getDb } from '@/db/client';
import {
  expenseSumSql,
  incomeSumSql,
  liveTransactionCountSql,
  signedAmountSql,
} from '@/db/queries/ledger';
import { transaction, wallet } from '@/db/schema';
import { utcTimestamp } from '@/utils/date';
import { newId } from '@/utils/id';

export type WalletBalanceRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  openingBalanceCentavos: number;
  incomeCentavos: number;
  expenseCentavos: number;
  balanceCentavos: number;
  transactionCount: number;
  lastOccurredOn: string | null;
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
      incomeCentavos: incomeSumSql,
      expenseCentavos: expenseSumSql,
      balanceCentavos: sql<number>`${wallet.openingBalanceCentavos} + ${signedAmountSql}`,
      transactionCount: liveTransactionCountSql,
      lastOccurredOn: sql<string | null>`MAX(${transaction.occurredOn})`,
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

export type WalletUpdateInput = {
  userId: string;
  name: string;
  icon: string;
  color: string;
  openingBalanceCentavos: number;
};

/** Updates an active wallet's metadata and opening balance. */
export async function updateWallet(id: string, input: WalletUpdateInput): Promise<void> {
  await getDb()
    .update(wallet)
    .set({
      name: input.name,
      icon: input.icon,
      color: input.color,
      openingBalanceCentavos: input.openingBalanceCentavos,
      updatedAt: utcTimestamp(),
    })
    .where(
      and(
        eq(wallet.id, id),
        eq(wallet.userId, input.userId),
        isNull(wallet.deletedAt)
      )
    );
}

/**
 * Soft-deletes a wallet and its currently live transactions in one atomic batch.
 * Blocks deletion when it is the user's sole active wallet so the ledger is
 * never stranded without a destination. Returns deleted transaction IDs so
 * Undo restores only rows deleted by this action.
 */
export async function softDeleteWalletWithTransactions(
  userId: string,
  id: string
): Promise<{ deletedTransactionIds: string[] }> {
  const activeCount = await countActiveWallets(userId);
  if (activeCount <= 1) {
    throw new Error('Keep at least one wallet to record transactions.');
  }

  const database = getDb();
  const now = utcTimestamp();

  return database.transaction(async (tx) => {
    const liveTxRows = await tx
      .select({ id: transaction.id })
      .from(transaction)
      .where(
        and(
          eq(transaction.userId, userId),
          eq(transaction.walletId, id),
          isNull(transaction.deletedAt)
        )
      );

    const deletedTransactionIds = liveTxRows.map((row) => row.id);

    if (deletedTransactionIds.length > 0) {
      await tx
        .update(transaction)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(eq(transaction.userId, userId), inArray(transaction.id, deletedTransactionIds)));
    }

    await tx
      .update(wallet)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(wallet.id, id), eq(wallet.userId, userId), isNull(wallet.deletedAt)));

    return { deletedTransactionIds };
  });
}

/** Restores a soft-deleted wallet and the exact transactions deleted with it. */
export async function restoreWalletWithTransactions(
  userId: string,
  id: string,
  transactionIds: readonly string[]
): Promise<void> {
  const database = getDb();
  const now = utcTimestamp();

  await database.transaction(async (tx) => {
    await tx
      .update(wallet)
      .set({ deletedAt: null, updatedAt: now })
      .where(and(eq(wallet.id, id), eq(wallet.userId, userId)));

    if (transactionIds.length > 0) {
      await tx
        .update(transaction)
        .set({ deletedAt: null, updatedAt: now })
        .where(and(eq(transaction.userId, userId), inArray(transaction.id, [...transactionIds])));
    }
  });
}
