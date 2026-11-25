import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { walletBalancesQuery } from '@/db/queries/wallet';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Live wallet balances. `useLiveQuery` re-runs whenever the ledger changes,
 * so writes anywhere in the app refresh the dashboard automatically.
 */
export function useWalletBalances() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { data, error } = useLiveQuery(walletBalancesQuery(activeUserId ?? ''), [activeUserId]);

  return { wallets: data ?? [], error };
}
