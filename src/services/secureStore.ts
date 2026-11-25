/**
 * Device-scoped key/value storage for small secrets (PIN verifier, last active
 * profile id).
 *
 * Native implementation: `expo-secure-store`, i.e. Android Keystore / iOS
 * Keychain, so the values are encrypted at rest and excluded from database
 * exports and backups.
 *
 * Web has its own implementation in `secureStore.web.ts` because
 * `expo-secure-store` ships an empty stub for web (`ExpoSecureStore.web.js`
 * exports `{}`), which makes every call throw `... is not a function`.
 */
export { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';
