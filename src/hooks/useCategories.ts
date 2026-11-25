import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { categoriesQuery } from '@/db/queries/category';
import type { CategoryType } from '@/db/schema';
import { useSessionStore } from '@/stores/sessionStore';

/** Live categories, filtered to income or expense when a type is given. */
export function useCategories(type?: CategoryType) {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { data, error } = useLiveQuery(categoriesQuery(activeUserId ?? '', type), [
    activeUserId,
    type,
  ]);

  return { categories: data ?? [], error };
}
