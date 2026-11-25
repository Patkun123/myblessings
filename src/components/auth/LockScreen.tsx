import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinPad } from '@/components/auth/PinPad';
import { lockoutRemainingMs, PIN_LENGTH, verifyPin } from '@/services/pinService';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Full-screen gate. Rendered *instead of* the navigator while locked, so no
 * screen underneath can be reached with the back button or a deep link.
 */
export function LockScreen() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const unlock = useSessionStore((state) => state.unlock);
  const clearActiveUser = useSessionStore((state) => state.clearActiveUser);

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // One ticking clock for the countdown; the lockout itself is derived, so
  // expiry needs no extra state transition.
  useEffect(() => {
    if (lockedUntil === 0) return;

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) clearInterval(timer);
    }, 500);

    return () => clearInterval(timer);
  }, [lockedUntil]);

  // Pick up a lockout left over from a previous session.
  useEffect(() => {
    if (!activeUserId) return;
    let cancelled = false;

    lockoutRemainingMs(activeUserId).then((ms) => {
      if (!cancelled && ms > 0) {
        const current = Date.now();
        setNow(current);
        setLockedUntil(current + ms);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeUserId]);

  const isLockedOut = lockedUntil > now;
  const remainingSeconds = isLockedOut ? Math.ceil((lockedUntil - now) / 1000) : 0;

  const submit = useCallback(
    async (candidate: string) => {
      if (!activeUserId) return;

      setBusy(true);
      setError(null);
      try {
        const result = await verifyPin(activeUserId, candidate);

        if (result.ok) {
          unlock();
          return;
        }

        setPin('');
        if (result.reason === 'locked') {
          const current = Date.now();
          setNow(current);
          setLockedUntil(current + result.retryAfterMs);
          setError(null);
        } else if (result.reason === 'incorrect') {
          setError(
            result.attemptsLeft === 1
              ? 'Incorrect PIN. 1 attempt left.'
              : `Incorrect PIN. ${result.attemptsLeft} attempts left.`
          );
        } else {
          setError('No PIN is set for this profile.');
        }
      } finally {
        setBusy(false);
      }
    },
    [activeUserId, unlock]
  );

  function handleChange(value: string) {
    if (isLockedOut) return;
    setError(null);
    setPin(value);
    if (value.length === PIN_LENGTH) {
      void submit(value);
    }
  }

  const disabled = busy || isLockedOut;
  const visibleError = isLockedOut ? 'Too many attempts. Try again shortly.' : error;

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-1 justify-between px-6 pb-8 pt-14">
        <View className="items-center">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand">
            <Text className="text-2xl font-bold text-white">₱</Text>
          </View>
          <Text className="mt-5 text-2xl font-bold text-ink">Enter your PIN</Text>
          <Text className="mt-1.5 text-sm text-ink-muted">
            {isLockedOut
              ? `Locked for ${remainingSeconds}s`
              : 'Unlock MyBlessings to continue.'}
          </Text>
        </View>

        <PinPad value={pin} onChange={handleChange} maxLength={PIN_LENGTH} disabled={disabled} />

        <View className="items-center">
          <Text
            className={`min-h-6 text-center text-sm ${
              visibleError ? 'text-expense' : 'text-transparent'
            }`}
            accessibilityLiveRegion="polite"
          >
            {visibleError ?? ' '}
          </Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => void clearActiveUser()}
            className="mt-3 px-4 py-2"
          >
            <Text className="text-sm text-ink-muted">Use another profile</Text>
          </Pressable>
          <Text className="mt-1 text-center text-xs text-ink-faint">
            A forgotten PIN cannot be recovered. Keep it somewhere safe.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
