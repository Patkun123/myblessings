import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useSessionStore } from '@/stores/sessionStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useThemeColors } from '@/stores/themeStore';

/**
 * Persistent app bar: sidebar menu trigger, brand mark + app name, and quick
 * settings/lock actions. Sits outside the screen's scroll view, so it never scrolls away.
 *
 * It is rendered by `Screen` (see `components/ui/Screen.tsx`) rather than by the
 * tab navigator, so the safe-area inset is applied once, above it.
 */
export function AppHeader() {
  const lock = useSessionStore((state) => state.lock);
  const openSidebar = useSidebarStore((state) => state.open);
  const themeColors = useThemeColors();

  return (
    <View className="flex-row items-center justify-between border-b border-line bg-surface px-3 py-2.5">
      <View className="flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          hitSlop={8}
          onPress={openSidebar}
          className="mr-1 h-11 w-11 items-center justify-center rounded-full"
        >
          <Ionicons name="menu-outline" size={24} color={themeColors.ink} />
        </Pressable>

        <View className="h-8 w-8 items-center justify-center rounded-lg bg-brand">
          <Ionicons name="heart" size={17} color="#FFFFFF" />
        </View>
        <Text className="ml-2.5 text-base font-bold tracking-tight text-ink">MyBlessings</Text>
      </View>

      <View className="flex-row items-center gap-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          hitSlop={8}
          onPress={() => router.push('/settings')}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <Ionicons name="settings-outline" size={20} color={themeColors.inkMuted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lock MyBlessings"
          hitSlop={8}
          onPress={lock}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <Ionicons name="lock-closed-outline" size={20} color={themeColors.inkMuted} />
        </Pressable>
      </View>
    </View>
  );
}
