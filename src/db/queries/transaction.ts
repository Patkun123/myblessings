import { and, asc, desc, eq, gte, isNull, like, lt, lte, or, sql, type SQL } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { expenseSumSql, incomeSumSql, signedAmountSql } from '@/db/queries/ledger';
import {
  category,
  transaction,
  wallet,
  type CategoryType,
  type TransactionType,
} from '@/db/schema';
import type { TransactionKind } from '@/domain/transaction';
import { newId } from '@/utils/id';
import { utcTimestamp } from '@/utils/date';

/** A ledger row plus the wallet and category labels a list row needs. */
export type TransactionWithMeta = {
  id: string;
  type: TransactionType;
  amountCentavos: number;
  occurredOn: string;
  description: string | null;
  note: string | null;
  walletId: string;
  walletName: string | null;
  walletColor: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
};

const transactionFields = {
  id: transaction.id,
  type: transaction.type,
  amountCentavos: transaction.amountCentavos,
  occurredOn: transaction.occurredOn,
  description: transaction.description,
  note: transaction.note,
  walletId: transaction.walletId,
  walletName: wallet.name,
  walletColor: wallet.color,
  categoryId: transaction.categoryId,
  categoryName: category.name,
  categoryIcon: category.icon,
  categoryColor: category.color,
};

/** Every list query shares the same joins, ordering inputs and soft-delete rule. */
function transactionRows(userId: string, extra?: SQL) {
  const live = and(eq(transaction.userId, userId), isNull(transaction.deletedAt));

  return getDb()
    .select(transactionFields)
    .from(transaction)
    .leftJoin(wallet, eq(wallet.id, transaction.walletId))
    .leftJoin(category, eq(category.id, transaction.categoryId))
    .where(extra ? and(live, extra) : live);
}

/** Newest first. Same-day rows fall back to creation order, then id. */
function newestFirst() {
  return [desc(transaction.occurredOn), desc(transaction.createdAt), desc(transaction.id)];
}

export function recentTransactionsQuery(userId: string, limit = 5) {
  return transactionRows(userId).orderBy(...newestFirst()).limit(limit);
}

export type TransactionFilters = {
  search?: string;
  type?: TransactionKind | null;
  walletId?: string | null;
  limit?: number;
};

/**
 * Filtered list for the Transactions tab.
 *
 * `limit` grows as the user taps "Load more". A keyset cursor would avoid
 * re-reading the first page, but the whole database is local and the list is
 * small, so one live query is simpler and keeps updates instant.
 */
export function transactionsQuery(userId: string, filters: TransactionFilters = {}) {
  const { search = '', type = null, walletId = null, limit = 50 } = filters;

  const conditions: SQL[] = [];
  if (type) conditions.push(eq(transaction.type, type));
  if (walletId) conditions.push(eq(transaction.walletId, walletId));

  // LIKE treats % and _ as wildcards; strip them so a search for "50%" is literal.
  const term = search.trim().replace(/[%_\\]/g, '');
  if (term) {
    const pattern = `%${term}%`;
    const match = or(
      like(transaction.description, pattern),
      like(transaction.note, pattern),
      like(category.name, pattern)
    );
    if (match) conditions.push(match);
  }

  const extra = conditions.length > 0 ? and(...conditions) : undefined;
  return transactionRows(userId, extra).orderBy(...newestFirst()).limit(limit);
}

export function transactionByIdQuery(userId: string, id: string) {
  return transactionRows(userId, eq(transaction.id, id)).limit(1);
}

export type RangeTotalsRow = {
  incomeCentavos: number;
  expenseCentavos: number;
};

/**
 * Income and expense sums for an inclusive date range.
 * Transfer legs are intentionally excluded: moving money between wallets is
 * neither income nor an expense.
 */
export function rangeTotalsQuery(userId: string, start: string, end: string) {
  return getDb()
    .select({
      incomeCentavos: incomeSumSql,
      expenseCentavos: expenseSumSql,
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, userId),
        isNull(transaction.deletedAt),
        gte(transaction.occurredOn, start),
        lte(transaction.occurredOn, end)
      )
    );
}

/**
 * Per-wallet balance strictly before `beforeDate` (`occurred_on < beforeDate`),
 * grouped by wallet so `opening_balance_centavos` is never multiplied across joins.
 */
export function walletBalancesBeforeDateQuery(userId: string, beforeDate: string) {
  return getDb()
    .select({
      walletId: wallet.id,
      balanceCentavos: sql<number>`${wallet.openingBalanceCentavos} + ${signedAmountSql}`,
    })
    .from(wallet)
    .leftJoin(
      transaction,
      and(
        eq(transaction.walletId, wallet.id),
        isNull(transaction.deletedAt),
        lt(transaction.occurredOn, beforeDate)
      )
    )
    .where(and(eq(wallet.userId, userId), eq(wallet.isArchived, false), isNull(wallet.deletedAt)))
    .groupBy(wallet.id);
}

/**
 * Daily income, expense, and net ledger movement across active wallets in `[start, end]`.
 * Transfers between active wallets net to 0 in `netLedgerCentavos` and are excluded
 * from `incomeCentavos` / `expenseCentavos`.
 */
export function dailyTrendTotalsQuery(userId: string, start: string, end: string) {
  return getDb()
    .select({
      occurredOn: transaction.occurredOn,
      incomeCentavos: incomeSumSql,
      expenseCentavos: expenseSumSql,
      netLedgerCentavos: signedAmountSql,
    })
    .from(transaction)
    .innerJoin(wallet, eq(wallet.id, transaction.walletId))
    .where(
      and(
        eq(transaction.userId, userId),
        isNull(transaction.deletedAt),
        eq(wallet.isArchived, false),
        isNull(wallet.deletedAt),
        gte(transaction.occurredOn, start),
        lte(transaction.occurredOn, end)
      )
    )
    .groupBy(transaction.occurredOn)
    .orderBy(asc(transaction.occurredOn));
}

/**
 * Category totals for an inclusive date range and type (`income` or `expense`),
 * scoped to active wallets and ignoring soft-deleted rows and transfers.
 */
export function categoryTotalsQuery(
  userId: string,
  start: string,
  end: string,
  type: CategoryType
) {
  const totalExpr = sql<number>`COALESCE(SUM(${transaction.amountCentavos}), 0)`;

  return getDb()
    .select({
      categoryId: transaction.categoryId,
      categoryName: category.name,
      categoryColor: category.color,
      totalCentavos: totalExpr,
    })
    .from(transaction)
    .innerJoin(wallet, eq(wallet.id, transaction.walletId))
    .leftJoin(category, eq(category.id, transaction.categoryId))
    .where(
      and(
        eq(transaction.userId, userId),
        isNull(transaction.deletedAt),
        eq(wallet.isArchived, false),
        isNull(wallet.deletedAt),
        eq(transaction.type, type),
        gte(transaction.occurredOn, start),
        lte(transaction.occurredOn, end)
      )
    )
    .groupBy(transaction.categoryId)
    .orderBy(desc(totalExpr));
}

export type TransactionWriteInput = {
  userId: string;
  walletId: string;
  categoryId: string;
  type: TransactionKind;
  amountCentavos: number;
  occurredOn: string;
  description: string | null;
  note: string | null;
};

/**
 * Guards the two links before writing: the wallet must belong to this profile,
 * and the category must belong to it too and match the entry type. The schema
 * only enforces the foreign keys, not the profile scope or the type match.
 */
async function assertLinks(input: TransactionWriteInput): Promise<void> {
  const database = getDb();

  const [walletRow] = await database
    .select({ id: wallet.id })
    .from(wallet)
    .where(
      and(
        eq(wallet.id, input.walletId),
        eq(wallet.userId, input.userId),
        isNull(wallet.deletedAt)
      )
    )
    .limit(1);
  if (!walletRow) throw new Error('That wallet is no longer available.');

  const [categoryRow] = await database
    .select({ id: category.id, type: category.type })
    .from(category)
    .where(
      and(
        eq(category.id, input.categoryId),
        eq(category.userId, input.userId),
        isNull(category.deletedAt)
      )
    )
    .limit(1);
  if (!categoryRow) throw new Error('That category is no longer available.');
  if (categoryRow.type !== input.type) {
    throw new Error('Pick a category that matches the entry type.');
  }
}

export async function createTransaction(input: TransactionWriteInput): Promise<string> {
  await assertLinks(input);

  const id = newId();
  await getDb()
    .insert(transaction)
    .values({
      id,
      userId: input.userId,
      walletId: input.walletId,
      categoryId: input.categoryId,
      type: input.type,
      amountCentavos: input.amountCentavos,
      occurredOn: input.occurredOn,
      description: input.description,
      note: input.note,
    });

  return id;
}

export async function updateTransaction(
  id: string,
  input: TransactionWriteInput
): Promise<void> {
  await assertLinks(input);

  await getDb()
    .update(transaction)
    .set({
      walletId: input.walletId,
      categoryId: input.categoryId,
      type: input.type,
      amountCentavos: input.amountCentavos,
      occurredOn: input.occurredOn,
      description: input.description,
      note: input.note,
      updatedAt: utcTimestamp(),
    })
    .where(
      and(
        eq(transaction.id, id),
        eq(transaction.userId, input.userId),
        isNull(transaction.deletedAt)
      )
    );
}

/**
 * Soft delete. The row stays for the undo window and for future sync, but every
 * read filters `deleted_at IS NULL`, so balances drop immediately.
 */
export async function softDeleteTransaction(userId: string, id: string): Promise<void> {
  const now = utcTimestamp();
  await getDb()
    .update(transaction)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(transaction.id, id), eq(transaction.userId, userId)));
}

/** Undo for the snackbar action: same row, `deleted_at` back to NULL. */
export async function restoreTransaction(userId: string, id: string): Promise<void> {
  await getDb()
    .update(transaction)
    .set({ deletedAt: null, updatedAt: utcTimestamp() })
    .where(and(eq(transaction.id, id), eq(transaction.userId, userId)));
}
