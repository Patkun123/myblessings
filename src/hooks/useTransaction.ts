import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionByIdQuery } from '@/db/queries/transaction';
import { useSessionStore } from '@/stores/sessionStore';

/** One entry for the detail screen. `null` when it does not exist (or was deleted). */
export function useTransaction(id: string | undefined) {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { data } = useLiveQuery(transactionByIdQuery(activeUserId ?? '', id ?? ''), [
    activeUserId,
    id,
  ]);

  return data?.[0] ?? null;
}
