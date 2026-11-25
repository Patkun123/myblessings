import { router, Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinPad } from '@/components/auth/PinPad';
import { PIN_LENGTH, setPin } from '@/services/pinService';
import { useSessionStore } from '@/stores/sessionStore';

type Step = 'create' | 'confirm';

/**
 * PIN setup, reached straight after profile creation.
 * The PIN protects the app shell, so it is required before the tabs open.
 */
export default function PinSetupScreen() {
  const activeUserId = useSessionStore((state) => state.activeUserId);

  const [step, setStep] = useState<Step>('create');
  const [firstPin, setFirstPin] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!activeUserId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Local const so the narrowed type survives into the handler closure.
  const userId = activeUserId;

  async function handleChange(next: string) {
    setError(null);
    setValue(next);
    if (next.length !== PIN_LENGTH) return;

    if (step === 'create') {
      setFirstPin(next);
      setValue('');
      setStep('confirm');
      return;
    }

    if (next !== firstPin) {
      setValue('');
      setFirstPin('');
      setStep('create');
      setError('Those PINs did not match. Start again.');
      return;
    }

    setBusy(true);
    try {
      await setPin(userId, next);
      // Wallets are never seeded, so the first one is part of onboarding.
      router.replace('/(auth)/wallet-setup');
    } catch (cause) {
      setBusy(false);
      setValue('');
      setFirstPin('');
      setStep('create');
      setError(cause instanceof Error ? cause.message : 'Could not save the PIN.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-1 justify-between px-6 pb-8 pt-14">
        <View className="items-center">
          <Text className="text-2xl font-bold text-ink">
            {step === 'create' ? 'Create a PIN' : 'Confirm your PIN'}
          </Text>
          <Text className="mt-1.5 px-4 text-center text-sm leading-5 text-ink-muted">
            {step === 'create'
              ? `Choose ${PIN_LENGTH} digits. You will need them every time the app opens.`
              : 'Enter the same PIN once more.'}
          </Text>
        </View>

        <PinPad
          value={value}
          onChange={(next) => void handleChange(next)}
          maxLength={PIN_LENGTH}
          disabled={busy}
        />

        <View className="items-center">
          <Text
            className={`min-h-6 text-center text-sm ${error ? 'text-expense' : 'text-transparent'}`}
            accessibilityLiveRegion="polite"
          >
            {error ?? ' '}
          </Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            disabled={busy}
            onPress={() => {
              if (step === 'confirm') {
                setStep('create');
                setFirstPin('');
                setValue('');
                setError(null);
              } else {
                router.replace('/(auth)/welcome');
              }
            }}
            className="mt-3 px-4 py-2"
          >
            <Text className="text-sm text-ink-muted">
              {step === 'confirm' ? 'Start over' : 'Back'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
