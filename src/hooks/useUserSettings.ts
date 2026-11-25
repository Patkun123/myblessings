import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { userSettingsQuery } from '@/db/queries/profile';
import { normalizeThemePreference } from '@/domain/profile';
import { useSessionStore } from '@/stores/sessionStore';

export function useUserSettings() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { data, error } = useLiveQuery(userSettingsQuery(activeUserId ?? ''), [activeUserId]);
  const row = data?.[0] ?? null;

  return {
    settings: row,
    theme: normalizeThemePreference(row?.theme),
    error,
  };
}
