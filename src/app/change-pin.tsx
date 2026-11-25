import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinPad } from '@/components/auth/PinPad';
import {
  hasPin,
  lockoutRemainingMs,
  PIN_LENGTH,
  setPin,
  verifyPin,
} from '@/services/pinService';
import { useSessionStore } from '@/stores/sessionStore';
import { snackbar } from '@/stores/snackbarStore';
import { useThemeColors } from '@/stores/themeStore';

type Step = 'loading' | 'verify' | 'create' | 'confirm';

/**
 * Updates the active profile's 4-digit app lock PIN.
 * Requires verifying the current PIN first whenever one is already set.
 */
export default function ChangePinScreen() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const themeColors = useThemeColors();

  const [step, setStep] = useState<Step>('loading');
  const [newPin, setNewPin] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activeUserId) return;
    let cancelled = false;

    (async () => {
      const [pinExists, remaining] = await Promise.all([
        hasPin(activeUserId),
        lockoutRemainingMs(activeUserId),
      ]);
      if (cancelled) return;

      if (remaining > 0) {
        const current = Date.now();
        setNow(current);
        setLockedUntil(current + remaining);
      }
      setStep(pinExists ? 'verify' : 'create');
    })();

    return () => {
      cancelled = true;
    };
  }, [activeUserId]);

  useEffect(() => {
    if (lockedUntil === 0) return;

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) clearInterval(timer);
    }, 500);

    return () => clearInterval(timer);
  }, [lockedUntil]);

  if (!activeUserId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const userId = activeUserId;
  const isLockedOut = step === 'verify' && lockedUntil > now;
  const remainingSeconds = isLockedOut ? Math.ceil((lockedUntil - now) / 1000) : 0;

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/settings');
  }

  async function handleChange(next: string) {
    if (isLockedOut || busy) return;

    setError(null);
    setValue(next);
    if (next.length !== PIN_LENGTH) return;

    if (step === 'verify') {
      setBusy(true);
      try {
        const result = await verifyPin(userId, next);
        setValue('');
        if (result.ok || result.reason === 'no-pin') {
          setStep('create');
          return;
        }
        if (result.reason === 'locked') {
          const current = Date.now();
          setNow(current);
          setLockedUntil(current + result.retryAfterMs);
          setError(null);
          return;
        }
        setError(
          result.attemptsLeft === 1
            ? 'Incorrect PIN. 1 attempt left.'
            : `Incorrect PIN. ${result.attemptsLeft} attempts left.`
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    if (step === 'create') {
      setNewPin(next);
      setValue('');
      setStep('confirm');
      return;
    }

    if (next !== newPin) {
      setValue('');
      setNewPin('');
      setStep('create');
      setError('Those PINs did not match. Start again.');
      return;
    }

    setBusy(true);
    try {
      await setPin(userId, next);
      snackbar.show('PIN updated.');
      close();
    } catch (cause) {
      setBusy(false);
      setValue('');
      setNewPin('');
      setStep('create');
      setError(cause instanceof Error ? cause.message : 'Could not update the PIN.');
    }
  }

  if (step === 'loading') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={themeColors.brand} />
      </SafeAreaView>
    );
  }

  const title =
    step === 'verify'
      ? 'Enter current PIN'
      : step === 'create'
        ? 'Enter new PIN'
        : 'Confirm new PIN';

  const subtitle =
    step === 'verify'
      ? isLockedOut
        ? `Locked for ${remainingSeconds}s`
        : 'Verify your current 4-digit PIN before setting a new one.'
      : step === 'create'
        ? `Choose ${PIN_LENGTH} digits for your new app lock PIN.`
        : 'Enter the new PIN once more.';

  const visibleError = isLockedOut ? 'Too many attempts. Try again shortly.' : error;

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-end px-5 pt-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          disabled={busy}
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <Ionicons name="close" size={22} color={themeColors.inkMuted} />
        </Pressable>
      </View>

      <View className="flex-1 justify-between px-6 pb-8 pt-6">
        <View className="items-center">
          <Text className="text-2xl font-bold text-ink">{title}</Text>
          <Text className="mt-1.5 px-4 text-center text-sm leading-5 text-ink-muted">
            {subtitle}
          </Text>
        </View>

        <PinPad
          value={value}
          onChange={(next) => void handleChange(next)}
          maxLength={PIN_LENGTH}
          disabled={busy || isLockedOut}
        />

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
            disabled={busy}
            onPress={() => {
              if (step === 'confirm') {
                setStep('create');
                setNewPin('');
                setValue('');
                setError(null);
              } else {
                close();
              }
            }}
            className="mt-3 px-4 py-2"
          >
            <Text className="text-sm text-ink-muted">
              {step === 'confirm' ? 'Start over' : 'Cancel'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
