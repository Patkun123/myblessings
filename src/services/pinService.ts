import * as Crypto from 'expo-crypto';
import { deleteItemAsync, getItemAsync, setItemAsync } from '@/services/secureStore';

/**
 * PIN storage.
 *
 * The verifier never touches SQLite: it lives in SecureStore (Android Keystore /
 * iOS Keychain), so it is excluded from database exports and backups.
 *
 * A 4–6 digit PIN has a tiny keyspace, so hashing alone cannot stop an attacker
 * who can read the verifier. The real defences are:
 *   1. SecureStore's hardware-backed encryption at rest, and
 *   2. the attempt lockout below (Phase 2 adds escalation + biometrics).
 *
 * The record carries `iterations` so a future release can raise the cost without
 * invalidating existing PINs.
 */

const KEY_PREFIX = 'myblessings.pin';
const ATTEMPTS_PREFIX = 'myblessings.pin_attempts';

/**
 * A fixed 4-digit PIN keeps the keypad self-submitting: there is no "confirm"
 * key to forget, and the keyspace matches what users already expect from a
 * phone lock. Phase 2 can widen this if 6 digits are wanted.
 */
export const PIN_LENGTH = 4;

/** 1,000 chained SHA-256 rounds ≈ a few hundred ms on a mid-range device. */
const DEFAULT_ITERATIONS = 1_000;

export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 30_000;

type PinRecord = {
  version: 1;
  salt: string;
  iterations: number;
  hash: string;
};

type AttemptRecord = {
  failed: number;
  lockedUntil: number | null;
};

function pinKey(userId: string): string {
  return `${KEY_PREFIX}.${userId}`;
}

function attemptsKey(userId: string): string {
  return `${ATTEMPTS_PREFIX}.${userId}`;
}

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPin(pin: string, salt: string, iterations: number): Promise<string> {
  let digest = `${salt}:${pin}`;
  for (let round = 0; round < iterations; round += 1) {
    digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, digest);
  }
  return digest;
}

/** Length-independent comparison; the timing leak here is negligible for a PIN. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

async function readRecord(userId: string): Promise<PinRecord | null> {
  const raw = await getItemAsync(pinKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PinRecord;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

async function readAttempts(userId: string): Promise<AttemptRecord> {
  const raw = await getItemAsync(attemptsKey(userId));
  if (!raw) return { failed: 0, lockedUntil: null };
  try {
    const parsed = JSON.parse(raw) as AttemptRecord;
    return { failed: parsed.failed ?? 0, lockedUntil: parsed.lockedUntil ?? null };
  } catch {
    return { failed: 0, lockedUntil: null };
  }
}

async function writeAttempts(userId: string, attempts: AttemptRecord): Promise<void> {
  await setItemAsync(attemptsKey(userId), JSON.stringify(attempts));
}

export async function hasPin(userId: string): Promise<boolean> {
  return (await readRecord(userId)) !== null;
}

/** Creates or replaces the PIN for a profile and clears any lockout. */
export async function setPin(userId: string, pin: string): Promise<void> {
  if (!isValidPin(pin)) {
    throw new Error(`PIN must be exactly ${PIN_LENGTH} digits.`);
  }

  const salt = toHex(Crypto.getRandomBytes(16));
  const record: PinRecord = {
    version: 1,
    salt,
    iterations: DEFAULT_ITERATIONS,
    hash: await hashPin(pin, salt, DEFAULT_ITERATIONS),
  };

  await setItemAsync(pinKey(userId), JSON.stringify(record));
  await deleteItemAsync(attemptsKey(userId));
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'incorrect'; attemptsLeft: number }
  | { ok: false; reason: 'locked'; retryAfterMs: number }
  | { ok: false; reason: 'no-pin' };

export async function verifyPin(userId: string, pin: string): Promise<VerifyResult> {
  const record = await readRecord(userId);
  if (!record) return { ok: false, reason: 'no-pin' };

  const attempts = await readAttempts(userId);
  if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    return { ok: false, reason: 'locked', retryAfterMs: attempts.lockedUntil - Date.now() };
  }

  const candidate = await hashPin(pin, record.salt, record.iterations);
  if (safeEqual(candidate, record.hash)) {
    await writeAttempts(userId, { failed: 0, lockedUntil: null });
    return { ok: true };
  }

  const failed = attempts.failed + 1;
  if (failed >= MAX_ATTEMPTS) {
    await writeAttempts(userId, { failed: 0, lockedUntil: Date.now() + LOCKOUT_MS });
    return { ok: false, reason: 'locked', retryAfterMs: LOCKOUT_MS };
  }

  await writeAttempts(userId, { failed, lockedUntil: null });
  return { ok: false, reason: 'incorrect', attemptsLeft: MAX_ATTEMPTS - failed };
}

/** Remaining lockout, if any. Used by the lock screen when it regains focus. */
export async function lockoutRemainingMs(userId: string): Promise<number> {
  const attempts = await readAttempts(userId);
  if (!attempts.lockedUntil) return 0;
  return Math.max(0, attempts.lockedUntil - Date.now());
}

/** Removes the PIN entirely (Phase 2 "turn off app lock" flow). */
export async function clearPin(userId: string): Promise<void> {
  await deleteItemAsync(pinKey(userId));
  await deleteItemAsync(attemptsKey(userId));
}
