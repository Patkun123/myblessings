import * as SecureStore from 'expo-secure-store';

/**
 * Remembers which profile was last active so a re-launch lands on the lock
 * screen instead of onboarding. Deliberately stored in SecureStore next to the
 * PIN verifier: it is device state, not ledger data, so it must not be exported
 * with a backup.
 */
const ACTIVE_USER_KEY = 'myblessings.activeUserId';

export async function loadActiveUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(ACTIVE_USER_KEY);
}

export async function saveActiveUserId(userId: string): Promise<void> {
  await SecureStore.setItemAsync(ACTIVE_USER_KEY, userId);
}

export async function forgetActiveUserId(): Promise<void> {
  await SecureStore.deleteItemAsync(ACTIVE_USER_KEY);
}
