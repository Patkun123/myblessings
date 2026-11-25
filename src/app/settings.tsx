import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { updateUserName, updateUserTheme } from '@/db/queries/profile';
import {
  PROFILE_NAME_MAX,
  validateProfileName,
  type ThemePreference,
} from '@/domain/profile';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserSettings } from '@/hooks/useUserSettings';
import { removeProfileAvatar, uploadProfileAvatar } from '@/services/avatarService';
import { hasPin } from '@/services/pinService';
import { useSessionStore } from '@/stores/sessionStore';
import { snackbar } from '@/stores/snackbarStore';
import { useThemeColors, useThemeStore } from '@/stores/themeStore';
import type { IconName } from '@/types/icons';
import { useColorScheme } from 'nativewind';

const THEME_OPTIONS: readonly { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

/** Profile, appearance (dark mode), and security (PIN / password) settings. */
export default function SettingsScreen() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const lock = useSessionStore((state) => state.lock);
  const { profile } = useUserProfile();
  const { theme: savedTheme } = useUserSettings();

  const themePreference = useThemeStore((state) => state.preference);
  const setThemePreference = useThemeStore((state) => state.setPreference);
  const { colorScheme } = useColorScheme();
  const themeColors = useThemeColors();

  const [pinConfigured, setPinConfigured] = useState<boolean>(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!activeUserId) return;
      let cancelled = false;
      hasPin(activeUserId).then((exists) => {
        if (!cancelled) setPinConfigured(exists);
      });
      return () => {
        cancelled = true;
      };
    }, [activeUserId])
  );

  if (!activeUserId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const userId = activeUserId;
  const activeTheme = themePreference ?? savedTheme;
  const isDarkActive = colorScheme === 'dark';

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  function openNameModal() {
    setDraftName(profile?.name ?? '');
    setNameError(null);
    setNameModalOpen(true);
  }

  async function handleSaveName() {
    const validation = validateProfileName(draftName);
    if (!validation.ok) {
      setNameError(validation.error);
      return;
    }

    setSavingName(true);
    setNameError(null);
    try {
      await updateUserName(userId, validation.name);
      setNameModalOpen(false);
      snackbar.show('Profile name updated.');
    } catch (cause) {
      setNameError(cause instanceof Error ? cause.message : 'Could not update your name.');
    } finally {
      setSavingName(false);
    }
  }

  async function handleSelectTheme(next: ThemePreference) {
    setThemePreference(next);
    try {
      await updateUserTheme(userId, next);
    } catch (cause) {
      snackbar.show(cause instanceof Error ? cause.message : 'Could not save theme setting.');
    }
  }

  async function handleUploadPhoto() {
    if (uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      const updated = await uploadProfileAvatar(userId, profile?.avatarUri);
      if (updated) {
        snackbar.show('Profile photo updated.');
      }
    } catch (cause) {
      snackbar.show(cause instanceof Error ? cause.message : 'Could not update profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleRemovePhoto() {
    if (uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      await removeProfileAvatar(userId, profile?.avatarUri);
      snackbar.show('Profile photo removed.');
    } catch (cause) {
      snackbar.show(cause instanceof Error ? cause.message : 'Could not remove profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  const displayName = profile?.name ?? 'Profile';

  return (
    <Screen appHeader={false}>
      <View className="flex-row items-center justify-between pb-4 pt-3">
        <Text className="text-2xl font-bold text-ink">Settings</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <Ionicons name="close" size={22} color={themeColors.inkMuted} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile */}
        <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Profile
        </Text>
        <Card>
          <View className="flex-row items-center pb-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upload profile photo"
              disabled={uploadingPhoto}
              onPress={() => void handleUploadPhoto()}
              className="relative"
            >
              <Avatar uri={profile?.avatarUri} name={displayName} size="lg" />
              <View className="absolute -bottom-0.5 -right-0.5 h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-brand">
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={12} color="#FFFFFF" />
                )}
              </View>
            </Pressable>
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                {displayName}
              </Text>
              <Text className="text-xs text-ink-muted">Stored locally on this device</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={profile?.avatarUri ? 'Change profile photo' : 'Upload profile photo'}
            disabled={uploadingPhoto}
            onPress={() => void handleUploadPhoto()}
            className="flex-row items-center border-t border-line py-3"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
              <Ionicons name="image-outline" size={18} color={themeColors.inkMuted} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium text-ink">Profile photo</Text>
              <Text className="text-xs text-ink-muted">
                {profile?.avatarUri ? 'Tap to choose a different photo' : 'Upload a photo from your device'}
              </Text>
            </View>
            <Text className="mr-1 text-sm font-medium text-brand">
              {profile?.avatarUri ? 'Change' : 'Upload'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={themeColors.inkFaint} />
          </Pressable>

          {profile?.avatarUri ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove profile photo"
              disabled={uploadingPhoto}
              onPress={() => void handleRemovePhoto()}
              className="flex-row items-center border-t border-line py-3"
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
                <Ionicons name="trash-outline" size={18} color={themeColors.expense} />
              </View>
              <Text className="ml-3 flex-1 text-base font-medium text-expense">
                Remove profile photo
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile name"
            onPress={openNameModal}
            className="flex-row items-center border-t border-line pt-3"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
              <Ionicons name="create-outline" size={18} color={themeColors.inkMuted} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium text-ink">Name</Text>
              <Text className="text-xs text-ink-muted" numberOfLines={1}>
                {displayName}
              </Text>
            </View>
            <Text className="mr-1 text-sm font-medium text-brand">Edit</Text>
            <Ionicons name="chevron-forward" size={18} color={themeColors.inkFaint} />
          </Pressable>
        </Card>

        {/* Appearance */}
        <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Appearance
        </Text>
        <Card>
          <View className="flex-row items-center justify-between pb-3">
            <View className="flex-1 pr-3">
              <Text className="text-base font-medium text-ink">Dark mode</Text>
              <Text className="mt-0.5 text-xs text-ink-muted">
                Easier on the eyes in low light
              </Text>
            </View>
            <Switch
              accessibilityLabel="Toggle dark mode"
              value={isDarkActive}
              onValueChange={(enabled) => void handleSelectTheme(enabled ? 'dark' : 'light')}
              trackColor={{ false: themeColors.line, true: themeColors.brand }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="border-t border-line pt-3">
            <Text className="mb-2 text-xs font-medium text-ink-muted">Theme preference</Text>
            <View className="flex-row gap-2">
              {THEME_OPTIONS.map((option) => {
                const selected = activeTheme === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.label} theme`}
                    accessibilityState={{ selected }}
                    onPress={() => void handleSelectTheme(option.value)}
                    className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 ${
                      selected ? 'border-brand bg-brand-light' : 'border-line bg-canvas'
                    }`}
                  >
                    <Ionicons
                      name={option.icon}
                      size={16}
                      color={selected ? themeColors.brand : themeColors.inkMuted}
                    />
                    <Text
                      className={`text-xs font-semibold ${
                        selected ? 'text-brand' : 'text-ink-muted'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Security */}
        <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Security
        </Text>
        <Card className="py-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change PIN or password"
            onPress={() => router.push('/change-pin')}
            className="flex-row items-center py-3"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
              <Ionicons name="key-outline" size={18} color={themeColors.inkMuted} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium text-ink">
                {pinConfigured ? 'Change PIN / Password' : 'Set PIN / Password'}
              </Text>
              <Text className="text-xs text-ink-muted">
                {pinConfigured
                  ? 'Update the 4-digit PIN used to unlock MyBlessings'
                  : 'Protect MyBlessings with a 4-digit PIN'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.inkFaint} />
          </Pressable>

          {pinConfigured ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lock app now"
              onPress={lock}
              className="flex-row items-center border-t border-line py-3"
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
                <Ionicons name="lock-closed-outline" size={18} color={themeColors.inkMuted} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-medium text-ink">Lock app now</Text>
                <Text className="text-xs text-ink-muted">Require PIN on next view</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.inkFaint} />
            </Pressable>
          ) : null}
        </Card>
      </ScrollView>

      <Modal
        visible={nameModalOpen}
        onClose={() => {
          if (!savingName) setNameModalOpen(false);
        }}
        title="Change profile name"
        message="This name appears for your local profile on this device."
        dismissable={!savingName}
        footer={
          <>
            <Button
              label="Save name"
              loading={savingName}
              onPress={() => void handleSaveName()}
            />
            <Button
              label="Cancel"
              variant="secondary"
              disabled={savingName}
              onPress={() => setNameModalOpen(false)}
            />
          </>
        }
      >
        <Input
          label="Profile name"
          value={draftName}
          onChangeText={(text) => {
            setDraftName(text);
            if (nameError) setNameError(null);
          }}
          placeholder="e.g. Family, Grace Church"
          autoCapitalize="words"
          autoFocus
          maxLength={PROFILE_NAME_MAX}
          returnKeyType="done"
          onSubmitEditing={() => void handleSaveName()}
          error={nameError}
        />
      </Modal>
    </Screen>
  );
}
