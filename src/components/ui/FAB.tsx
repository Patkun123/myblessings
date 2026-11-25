import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

import { colors } from '@/constants/theme';
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`absolute bottom-6 right-5 flex-row items-center justify-center rounded-full bg-brand ${
        extended ? 'h-14 gap-2 px-5' : 'h-14 w-14'
      }`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        shadowColor: colors.brandDark,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      })}
    >
      <Ionicons name={icon} size={24} color="#FFFFFF" />
      {extended ? <Text className="text-base font-semibold text-white">{label}</Text> : null}
    </Pressable>
  );
}
