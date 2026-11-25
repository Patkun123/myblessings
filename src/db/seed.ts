import { and, eq, isNull } from 'drizzle-orm';

import { DEFAULT_CATEGORIES, DEFAULT_WALLET } from '@/constants/categories';
import type { AppDatabase } from '@/db/client';
import { category, settings, wallet } from '@/db/schema';
import { newId } from '@/utils/id';

/**
 * Idempotently seeds a profile: settings row, system categories, and a default
 * wallet. Safe to call on every launch — unique indexes + ON CONFLICT DO NOTHING
 * make it a no-op after the first run.
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

  const existingWallet = await database
    .select({ id: wallet.id })
    .from(wallet)
    .where(and(eq(wallet.userId, userId), isNull(wallet.deletedAt)))
    .limit(1);

  if (existingWallet.length === 0) {
    await database.insert(wallet).values({
      id: newId(),
      userId,
      name: DEFAULT_WALLET.name,
      icon: DEFAULT_WALLET.icon,
      color: DEFAULT_WALLET.color,
      openingBalanceCentavos: 0,
      sortOrder: 0,
    });
  }
}
