import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Pressable, Text, View } from 'react-native';

import { useSidebarStore } from '@/stores/sidebarStore';
import { useThemeColors } from '@/stores/themeStore';

/**
 * Persistent Capiz Window brand bar: sidebar trigger, 26px heart mark on a
 * lamplight tile, "MyBlessings" at 15px, and the current month badge.
 */
export function AppHeader() {
  const openSidebar = useSidebarStore((state) => state.open);
  const themeColors = useThemeColors();
  const monthLabel = format(new Date(), 'MMM yyyy').toUpperCase();

  return (
    <View className="flex-row items-center justify-between border-b border-line bg-canvas px-3 py-2">
      <View className="flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          hitSlop={8}
          onPress={openSidebar}
          className="mr-1 h-11 w-11 items-center justify-center rounded-pane"
        >
          <Ionicons name="menu-outline" size={22} color={themeColors.ink} />
        </Pressable>

        <View className="h-[26px] w-[26px] items-center justify-center rounded-md bg-brand">
          <Ionicons name="heart" size={14} color={themeColors.brandInk} />
        </View>
        <Text className="ml-2 font-body-bold text-[15px] tracking-tight text-ink">
          MyBlessings
        </Text>
      </View>

      <Text className="mr-1.5 font-body-semibold text-[10px] tracking-label text-ink-faint">
        {monthLabel}
      </Text>
    </View>
  );
}
