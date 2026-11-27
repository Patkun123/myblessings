import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

import { useThemeColors } from '@/stores/themeStore';
import type { IconName } from '@/types/icons';

type FABProps = {
  icon: IconName;
  /** Accessible name; also the visible text when `extended` is true. */
  label: string;
  onPress: () => void;
  extended?: boolean;
};

/**
 * Floating action button. Position it by wrapping in a relatively-positioned
 * container; screens with a tab bar should add bottom padding so it clears it.
 */
export function FAB({ icon, label, onPress, extended = false }: FABProps) {
  const themeColors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`absolute bottom-6 right-5 flex-row items-center justify-center rounded-full border border-brand-dark/25 bg-brand ${
        extended ? 'h-14 gap-2 px-5' : 'h-[52px] w-[52px]'
      }`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        shadowColor: themeColors.canvas,
        shadowOpacity: 0.32,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
      })}
    >
      <Ionicons name={icon} size={23} color={themeColors.brandInk} />
      {extended ? (
        <Text className="font-body-semibold text-sm text-brand-ink">{label}</Text>
      ) : null}
    </Pressable>
  );
}
