import { and, asc, eq, isNull } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { settings, user } from '@/db/schema';
import {
  normalizeThemePreference,
  validateProfileName,
  type ThemePreference,
} from '@/domain/profile';

export type ProfileSummary = {
  id: string;
  name: string;
  avatarUri: string | null;
};

export function userProfileQuery(userId: string) {
  return getDb()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUri: user.avatarUri,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(and(eq(user.id, userId), isNull(user.deletedAt)));
}

export async function listProfiles(): Promise<ProfileSummary[]> {
  return getDb()
    .select({
      id: user.id,
      name: user.name,
      avatarUri: user.avatarUri,
    })
    .from(user)
    .where(isNull(user.deletedAt))
    .orderBy(asc(user.createdAt));
}

export function userSettingsQuery(userId: string) {
  return getDb()
    .select({
      userId: settings.userId,
      theme: settings.theme,
      biometricEnabled: settings.biometricEnabled,
      locale: settings.locale,
      updatedAt: settings.updatedAt,
    })
    .from(settings)
    .where(eq(settings.userId, userId));
}

export async function loadUserTheme(userId: string): Promise<ThemePreference> {
  const rows = await userSettingsQuery(userId);
  return normalizeThemePreference(rows[0]?.theme);
}

/** Updates the active profile's display name after validation. */
export async function updateUserName(userId: string, rawName: string): Promise<string> {
  const result = validateProfileName(rawName);
  if (!result.ok) {
    throw new Error(result.error);
  }

  await getDb()
    .update(user)
    .set({
      name: result.name,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(user.id, userId), isNull(user.deletedAt)));

  return result.name;
}

/** Updates or clears the active profile's avatar URI. */
export async function updateUserAvatar(userId: string, avatarUri: string | null): Promise<void> {
  await getDb()
    .update(user)
    .set({
      avatarUri,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(user.id, userId), isNull(user.deletedAt)));
}

/** Persists the active profile's theme preference (`light`, `dark`, or `system`). */
export async function updateUserTheme(userId: string, theme: ThemePreference): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .insert(settings)
    .values({
      userId,
      theme,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: settings.userId,
      set: {
        theme,
        updatedAt: now,
      },
    });
}
