import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { recentTransactionsQuery } from '@/db/queries/transaction';
import { useSessionStore } from '@/stores/sessionStore';

/** Newest entries for the dashboard. Refreshes on any ledger write. */
export function useRecentTransactions(limit = 5) {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { data } = useLiveQuery(recentTransactionsQuery(activeUserId ?? '', limit), [
    activeUserId,
    limit,
  ]);

  return data ?? [];
}
