import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal as RNModal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useUserProfile } from '@/hooks/useUserProfile';
import { uploadProfileAvatar } from '@/services/avatarService';
import { useSessionStore } from '@/stores/sessionStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { snackbar } from '@/stores/snackbarStore';
import { useThemeColors } from '@/stores/themeStore';
import type { IconName } from '@/types/icons';

type NavItem = {
  id: string;
  label: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
};

/**
 * Slide-out navigation drawer containing the user's profile (avatar + name),
 * History, Settings, and Logout.
 */
export function Sidebar() {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const close = useSidebarStore((state) => state.close);
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const clearActiveUser = useSessionStore((state) => state.clearActiveUser);

  const { profile } = useUserProfile();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();

  const drawerWidth = Math.min(Math.round(Dimensions.get('window').width * 0.8), 312);
  const [rendered, setRendered] = useState(isOpen);
  const [uploading, setUploading] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const pendingLogoutRef = useRef(false);

  // Lazy state keeps one Animated.Value per component without reading a ref during render.
  const [translateX] = useState(() => new Animated.Value(-drawerWidth));
  const [backdropOpacity] = useState(() => new Animated.Value(0));

  if (isOpen && !rendered) {
    setRendered(true);
  }

  useEffect(() => {
    if (isOpen) {
      pendingLogoutRef.current = false;
      translateX.setValue(-drawerWidth);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -drawerWidth,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setRendered(false);
          if (pendingLogoutRef.current) {
            pendingLogoutRef.current = false;
            setLogoutConfirmOpen(true);
          }
        }
      });
    }
  }, [backdropOpacity, drawerWidth, isOpen, rendered, translateX]);

  if (!rendered && !logoutConfirmOpen) return null;

  const displayName = profile?.name ?? 'Profile';

  async function handleUploadAvatar() {
    if (!activeUserId || uploading) return;
    setUploading(true);
    try {
      const updated = await uploadProfileAvatar(activeUserId, profile?.avatarUri);
      if (updated) {
        snackbar.show('Profile photo updated.');
      }
    } catch (cause) {
      snackbar.show(cause instanceof Error ? cause.message : 'Could not update profile photo.');
    } finally {
      setUploading(false);
    }
  }

  function navigateTo(path: '/(tabs)/transactions' | '/settings') {
    close();
    router.push(path);
  }

  const navItems: NavItem[] = [
    {
      id: 'history',
      label: 'History',
      subtitle: 'View all recorded transactions',
      icon: 'time-outline',
      onPress: () => navigateTo('/(tabs)/transactions'),
    },
    {
      id: 'settings',
      label: 'Settings',
      subtitle: 'Name, theme, photo & PIN',
      icon: 'settings-outline',
      onPress: () => navigateTo('/settings'),
    },
  ];

  return (
    <>
      <RNModal
        visible={rendered}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View className="flex-1 flex-row">
          <Animated.View
            style={{ opacity: backdropOpacity }}
            className="absolute inset-0 bg-black/45 dark:bg-black/65"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sidebar"
              className="flex-1"
              onPress={close}
            />
          </Animated.View>

          <Animated.View
            style={{
              width: drawerWidth,
              transform: [{ translateX }],
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            }}
            className="h-full border-r border-line bg-surface"
          >
            {/* Profile Header */}
            <View className="border-b border-line px-5 pb-5 pt-2">
              <View className="flex-row items-start justify-between">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Upload profile photo"
                  disabled={uploading}
                  onPress={() => void handleUploadAvatar()}
                  className="relative"
                >
                  <Avatar uri={profile?.avatarUri} name={displayName} size="lg" />
                  <View className="absolute -bottom-0.5 -right-0.5 h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-brand">
                    {uploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="camera" size={12} color="#FFFFFF" />
                    )}
                  </View>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                  hitSlop={8}
                  onPress={close}
                  className="h-10 w-10 items-center justify-center rounded-full"
                >
                  <Ionicons name="close" size={20} color={themeColors.inkMuted} />
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile settings"
                onPress={() => navigateTo('/settings')}
                className="mt-3"
              >
                <Text className="text-lg font-bold text-ink" numberOfLines={1}>
                  {displayName}
                </Text>
                <Text className="mt-0.5 text-xs text-ink-muted">
                  Tap photo to upload · Local profile
                </Text>
              </Pressable>
            </View>

            {/* Navigation Items */}
            <ScrollView className="flex-1 px-3 py-4" showsVerticalScrollIndicator={false}>
              {navItems.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={item.onPress}
                  className="mb-1 flex-row items-center rounded-xl px-3 py-3"
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? themeColors.brandLight : 'transparent',
                  })}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
                    <Ionicons name={item.icon} size={20} color={themeColors.brand} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-semibold text-ink">{item.label}</Text>
                    <Text className="text-xs text-ink-muted">{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={themeColors.inkFaint} />
                </Pressable>
              ))}
            </ScrollView>

            {/* Logout */}
            <View className="border-t border-line px-3 pt-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Logout"
                onPress={() => {
                  pendingLogoutRef.current = true;
                  close();
                }}
                className="flex-row items-center rounded-xl px-3 py-3"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
                  <Ionicons name="log-out-outline" size={20} color={themeColors.expense} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-expense">Logout</Text>
                  <Text className="text-xs text-ink-muted">Sign out of this profile</Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </RNModal>

      <Modal
        visible={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="Log out?"
        message="Your records stay safely stored on this device. You can select this profile again anytime."
        footer={
          <>
            <Button
              label="Log out"
              variant="danger"
              onPress={() => {
                setLogoutConfirmOpen(false);
                void clearActiveUser();
              }}
            />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => setLogoutConfirmOpen(false)}
            />
          </>
        }
      />
    </>
  );
}
