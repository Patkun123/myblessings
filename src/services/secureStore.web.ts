/**
 * Web preview implementation of `secureStore`.
 *
 * There is no Keychain/Keystore in a browser, so values live in `localStorage`.
 * That is **not** encrypted at rest: anything stored here is readable by any
 * script on the origin. It is acceptable only because web is a preview target
 * for UI work — the app itself ships to Android and iOS.
 *
 * What is stored is a salted, 1,000-round hash of the PIN (never the PIN) plus
 * non-sensitive device state, so a compromise of localStorage does not hand
 * over a usable PIN.
 */

const PREFIX = 'myblessings:';

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Access can throw when storage is disabled (private mode, blocked cookies).
    return null;
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  return storage()?.getItem(PREFIX + key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  storage()?.setItem(PREFIX + key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  storage()?.removeItem(PREFIX + key);
}
