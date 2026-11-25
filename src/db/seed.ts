import { DEFAULT_CATEGORIES } from '@/constants/categories';
import type { AppDatabase } from '@/db/client';
import { category, settings } from '@/db/schema';
import { newId } from '@/utils/id';

/**
 * Idempotently seeds a profile: settings row and system categories.
 *
 * Wallets are deliberately **not** seeded — the user creates every wallet and
 * enters its opening balance themselves, so a fresh profile starts with no
 * wallets and is taken through wallet setup before the tabs open.
 *
 * Safe to call on every launch: unique indexes + ON CONFLICT DO NOTHING make it
 * a no-op after the first run.
 */
export async function seedProfile(database: AppDatabase, userId: string): Promise<void> {
  await database.insert(settings).values({ userId }).onConflictDoNothing();

  await database
    .insert(category)
    .values(
      DEFAULT_CATEGORIES.map((defaultCategory, index) => ({
        id: newId(),
        userId,
        name: defaultCategory.name,
        icon: defaultCategory.icon,
        color: defaultCategory.color,
        type: defaultCategory.type,
        isSystem: true,
        sortOrder: index,
      }))
    )
    .onConflictDoNothing();
}
