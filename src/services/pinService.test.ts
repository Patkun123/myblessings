import {
  clearPin,
  hasPin,
  isValidPin,
  lockoutRemainingMs,
  MAX_ATTEMPTS,
  PIN_LENGTH,
  setPin,
  verifyPin,
} from '@/services/pinService';

/**
 * The PIN service talks to SecureStore and expo-crypto, neither of which exists
 * in a Node test process. Both are replaced with in-memory stand-ins so the
 * verifier and lockout logic can be tested for real.
 */

const mockSecureStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStore.delete(key);
  }),
}));

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  getRandomBytes: (byteCount: number) => new Uint8Array(byteCount).fill(7),
  // Deterministic 64-char stand-in that never echoes its input, so the "no
  // plaintext PIN in storage" assertion is meaningful.
  digestStringAsync: async (_algorithm: string, data: string) => {
    let hash = 0x811c9dc5;
    for (let index = 0; index < data.length; index += 1) {
      hash ^= data.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0').repeat(8);
  },
}));

const USER = 'profile-1';
const PIN = '1234';

describe('isValidPin', () => {
  it('accepts exactly four digits', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('0000')).toBe(true);
  });

  it.each(['123', '12345', '12a4', '', ' 1234'])('rejects %p', (value) => {
    expect(isValidPin(value)).toBe(false);
  });
});

describe('pin verifier', () => {
  beforeEach(() => {
    mockSecureStore.clear();
  });

  it('stores a hashed verifier, never the PIN itself', async () => {
    await setPin(USER, PIN);

    const raw = mockSecureStore.get(`myblessings.pin.${USER}`);
    expect(raw).toBeTruthy();
    expect(raw).not.toContain(PIN);
    expect(JSON.parse(raw as string)).toMatchObject({
      version: 1,
      iterations: expect.any(Number),
      hash: expect.any(String),
      salt: expect.any(String),
    });
  });

  it('accepts the correct PIN and rejects a wrong one', async () => {
    await setPin(USER, PIN);

    await expect(verifyPin(USER, PIN)).resolves.toEqual({ ok: true });
    await expect(verifyPin(USER, '9999')).resolves.toEqual({
      ok: false,
      reason: 'incorrect',
      attemptsLeft: MAX_ATTEMPTS - 1,
    });
  });

  it('reports no-pin for an unknown profile', async () => {
    await expect(verifyPin('nobody', PIN)).resolves.toEqual({ ok: false, reason: 'no-pin' });
    await expect(hasPin('nobody')).resolves.toBe(false);
  });

  it('locks out after repeated failures and ignores the correct PIN', async () => {
    await setPin(USER, PIN);

    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt += 1) {
      const result = await verifyPin(USER, '0000');
      expect(result).toMatchObject({ ok: false, reason: 'incorrect' });
    }

    await expect(verifyPin(USER, '0000')).resolves.toMatchObject({
      ok: false,
      reason: 'locked',
    });
    await expect(verifyPin(USER, PIN)).resolves.toMatchObject({ ok: false, reason: 'locked' });
    await expect(lockoutRemainingMs(USER)).resolves.toBeGreaterThan(0);
  });

  it('releases the lockout once the window passes', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    try {
      nowSpy.mockReturnValue(1_000_000);
      await setPin(USER, PIN);

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        await verifyPin(USER, '0000');
      }
      await expect(lockoutRemainingMs(USER)).resolves.toBeGreaterThan(0);

      nowSpy.mockReturnValue(1_000_000 + 60_000);
      await expect(lockoutRemainingMs(USER)).resolves.toBe(0);
      await expect(verifyPin(USER, PIN)).resolves.toEqual({ ok: true });
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('clears a lockout when the PIN is replaced', async () => {
    await setPin(USER, PIN);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      await verifyPin(USER, '0000');
    }
    await expect(verifyPin(USER, PIN)).resolves.toMatchObject({ reason: 'locked' });

    await setPin(USER, '4321');
    await expect(verifyPin(USER, '4321')).resolves.toEqual({ ok: true });
  });

  it('refuses to store a malformed PIN', async () => {
    await expect(setPin(USER, '12')).rejects.toThrow(/exactly 4 digits/);
    await expect(hasPin(USER)).resolves.toBe(false);
  });

  it('removes both the verifier and the attempt counter', async () => {
    await setPin(USER, PIN);
    await verifyPin(USER, '0000');

    await clearPin(USER);

    expect(mockSecureStore.size).toBe(0);
    await expect(hasPin(USER)).resolves.toBe(false);
  });

  it(`uses a ${PIN_LENGTH}-digit keypad length`, () => {
    expect(PIN_LENGTH).toBe(4);
  });
});
