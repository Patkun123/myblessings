import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Persistent app bar: brand mark + app name, and the one action worth having on
 * every tab. Sits outside the screen's scroll view, so it never scrolls away.
 *
 * It is rendered by `Screen` (see `components/ui/Screen.tsx`) rather than by the
 * tab navigator, so the safe-area inset is applied once, above it.
 */
export function AppHeader() {
  const lock = useSessionStore((state) => state.lock);

  return (
    <View className="flex-row items-center justify-between border-b border-line bg-surface px-5 py-3">
      <View className="flex-row items-center">
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-brand">
          <Ionicons name="heart" size={17} color="#FFFFFF" />
        </View>
        <Text className="ml-2.5 text-base font-bold tracking-tight text-ink">MyBlessings</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Lock MyBlessings"
        hitSlop={8}
        onPress={lock}
        className="h-11 w-11 items-center justify-center rounded-full"
      >
        <Ionicons name="lock-closed-outline" size={20} color={colors.inkMuted} />
      </Pressable>
    </View>
  );
}
