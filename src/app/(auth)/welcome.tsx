import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { listProfiles, type ProfileSummary } from '@/db/queries/profile';
import { countActiveWallets } from '@/db/queries/wallet';
import { PROFILE_NAME_MAX, validateProfileName } from '@/domain/profile';
import { hasPin } from '@/services/pinService';
import { createLocalProfile, ensureProfileSeeded } from '@/services/profileService';
import { useSessionStore } from '@/stores/sessionStore';
import { useThemeColors } from '@/stores/themeStore';

/**
 * First-run profile creation and profile switcher (reached after Logout or
 * "Use another profile").
 */
export default function WelcomeScreen() {
  const setActiveUser = useSessionStore((state) => state.setActiveUser);
  const themeColors = useThemeColors();

  const [existingProfiles, setExistingProfiles] = useState<ProfileSummary[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listProfiles()
      .then((rows) => {
        if (!cancelled) setExistingProfiles(rows);
      })
      .catch(() => {
        // Ignore if database isn't ready; welcome form still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSelectExisting(profile: ProfileSummary) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await ensureProfileSeeded(profile.id);
      const pinExists = await hasPin(profile.id);
      await setActiveUser(profile.id, { locked: pinExists });

      if (!pinExists) {
        router.replace('/(auth)/pin-setup');
        return;
      }

      const walletCount = await countActiveWallets(profile.id);
      router.replace(walletCount > 0 ? '/(tabs)' : '/(auth)/wallet-setup');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open this profile.');
      setBusy(false);
    }
  }

  async function handleCreate() {
    const validation = validateProfileName(name);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const userId = await createLocalProfile({ name: validation.name });
      await setActiveUser(userId);
      router.replace('/(auth)/pin-setup');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the profile.');
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand">
            <Ionicons name="heart" size={32} color="#FFFFFF" />
          </View>

          <Text className="mt-6 text-3xl font-bold text-ink">Welcome to MyBlessings</Text>
          <Text className="mt-2 text-base leading-6 text-ink-muted">
            Track income, expenses, and giving across your wallets — all stored on this device.
          </Text>

          {existingProfiles.length > 0 ? (
            <View className="mt-8">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Existing profiles
              </Text>
              <Card className="py-1">
                {existingProfiles.map((profile, index) => (
                  <Pressable
                    key={profile.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Sign in as ${profile.name}`}
                    disabled={busy}
                    onPress={() => void handleSelectExisting(profile)}
                    className={`flex-row items-center py-3 ${
                      index === existingProfiles.length - 1 ? '' : 'border-b border-line'
                    }`}
                  >
                    <Avatar uri={profile.avatarUri} name={profile.name} size="md" />
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                        {profile.name}
                      </Text>
                      <Text className="text-xs text-ink-muted">Tap to sign in</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={themeColors.inkFaint} />
                  </Pressable>
                ))}
              </Card>
            </View>
          ) : null}

          <View className={existingProfiles.length > 0 ? 'mt-8' : 'mt-10'}>
            <Text className="mb-1.5 text-sm font-medium text-ink-muted">
              {existingProfiles.length > 0 ? 'Or create a new profile' : 'Profile name'}
            </Text>
            <TextInput
              className="h-14 rounded-xl border border-line bg-surface px-4 text-base text-ink"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError(null);
              }}
              placeholder="e.g. Family, Grace Church"
              placeholderTextColor={themeColors.inkFaint}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              maxLength={PROFILE_NAME_MAX}
              accessibilityLabel="Profile name"
            />
            {error ? <Text className="mt-2 text-sm text-expense">{error}</Text> : null}
          </View>
        </View>

        <View className="mt-8">
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
      </ScrollView>
    </SafeAreaView>
  );
}
