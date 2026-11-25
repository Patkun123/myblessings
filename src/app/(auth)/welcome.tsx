import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { createLocalProfile } from '@/services/profileService';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * First-run profile creation.
 * The next step is always PIN setup — see `pin-setup.tsx`.
 */
export default function WelcomeScreen() {
  const setActiveUser = useSessionStore((state) => state.setActiveUser);

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('Enter a name for this profile.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const userId = await createLocalProfile({ name: trimmed });
      await setActiveUser(userId);
      router.replace('/(auth)/pin-setup');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the profile.');
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-1 justify-between px-6 pb-10 pt-16">
        <View>
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand">
            <Ionicons name="heart" size={32} color="#FFFFFF" />
          </View>

          <Text className="mt-6 text-3xl font-bold text-ink">Welcome to MyBlessings</Text>
          <Text className="mt-2 text-base leading-6 text-ink-muted">
            Track income, expenses, and giving across your wallets — all stored on this device.
          </Text>

          <View className="mt-10">
            <Text className="mb-1.5 text-sm font-medium text-ink-muted">Profile name</Text>
            <TextInput
              className="h-14 rounded-xl border border-line bg-surface px-4 text-base text-ink"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError(null);
              }}
              placeholder="e.g. Family, Grace Church"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              maxLength={60}
              accessibilityLabel="Profile name"
            />
            {error ? <Text className="mt-2 text-sm text-expense">{error}</Text> : null}
          </View>
        </View>

        <View>
          <Button
            label="Create profile"
            size="lg"
            loading={busy}
            onPress={handleCreate}
            testID="create-profile"
          />
          <Text className="mt-3 text-center text-xs leading-5 text-ink-faint">
            Data never leaves this device. Export a backup regularly once you start recording.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
