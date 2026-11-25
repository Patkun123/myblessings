import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { userProfileQuery } from '@/db/queries/profile';
import { useSessionStore } from '@/stores/sessionStore';

export function useUserProfile() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { data, error } = useLiveQuery(userProfileQuery(activeUserId ?? ''), [activeUserId]);

  return { profile: data?.[0] ?? null, error };
}
