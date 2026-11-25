import { getDb } from '@/db/client';
import { user } from '@/db/schema';
import { seedProfile } from '@/db/seed';
import { newId } from '@/utils/id';

export type NewProfileInput = {
  name: string;
  email?: string | null;
};

/**
 * Creates a local profile and seeds its system categories + default wallet.
 * Phase 2 wraps this in a transaction.
 */
export async function createLocalProfile({ name, email }: NewProfileInput): Promise<string> {
  const db = getDb();
  const id = newId();

  await db.insert(user).values({
    id,
    name: name.trim(),
    email: email?.trim() || null,
  });

  // Idempotent, so a partially seeded profile self-heals on the next launch.
  await seedProfile(db, id);

  return id;
}

/** Re-runs seeding for an existing profile; harmless when everything exists. */
export async function ensureProfileSeeded(userId: string): Promise<void> {
  await seedProfile(getDb(), userId);
}
