import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import { transactionsQuery } from '@/db/queries/transaction';
import type { TransactionKind } from '@/domain/transaction';
import { useSessionStore } from '@/stores/sessionStore';

export const TRANSACTIONS_PAGE_SIZE = 50;

export type TransactionFilterState = {
  search: string;
  type: TransactionKind | null;
  walletId: string | null;
};

/**
 * The Transactions tab's live list.
 *
 * Paging grows `limit` instead of using an offset cursor: the database is local
 * and one live query means an edited or deleted row refreshes without merging
 * pages. Swap in a keyset cursor if a profile ever reaches tens of thousands of
 * rows.
 */
export function useTransactions(filters: TransactionFilterState) {
  const activeUserId = useSessionStore((state) => state.activeUserId);

  // The page count is stored with the filter it belongs to. A new filter simply
  // starts from page one during render — no effect, no cascading update.
  const filterKey = `${filters.search}\u0000${filters.type ?? ''}\u0000${filters.walletId ?? ''}`;
  const [page, setPage] = useState({ key: filterKey, limit: TRANSACTIONS_PAGE_SIZE });

  const limit = page.key === filterKey ? page.limit : TRANSACTIONS_PAGE_SIZE;

  const { data, error } = useLiveQuery(
    transactionsQuery(activeUserId ?? '', { ...filters, limit }),
    [activeUserId, filters.search, filters.type, filters.walletId, limit]
  );

  const transactions = data ?? [];

  return {
    transactions,
    error,
    hasMore: transactions.length >= limit,
    loadMore: () => setPage({ key: filterKey, limit: limit + TRANSACTIONS_PAGE_SIZE }),
  };
}
