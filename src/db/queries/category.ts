import { and, eq, isNull } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { category, type CategoryType } from '@/db/schema';

export type CategoryOption = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
};

/**
 * Live categories for a profile, optionally narrowed to income or expense.
 * Archived and soft-deleted rows never appear in a picker.
 */
export function categoriesQuery(userId: string, type?: CategoryType) {
  const filters = [
    eq(category.userId, userId),
    eq(category.isArchived, false),
    isNull(category.deletedAt),
  ];
  if (type) filters.push(eq(category.type, type));

  return getDb()
    .select({
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
    })
    .from(category)
    .where(and(...filters))
    .orderBy(category.sortOrder, category.name);
}
