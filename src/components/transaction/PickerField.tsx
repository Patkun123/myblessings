import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/stores/themeStore';
import type { IconName } from '@/types/icons';

type PickerFieldProps = {
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  icon?: IconName;
  iconColor?: string;
  error?: string | null;
};

/**
 * A tappable field that opens a sheet. Mirrors `Input`'s height and border so a
 * form mixing typed fields and pickers lines up.
 */
export function PickerField({
  label,
  value,
  placeholder,
  onPress,
  icon,
  iconColor,
  error,
}: PickerFieldProps) {
  const themeColors = useThemeColors();
  const resolvedIconColor = iconColor ?? themeColors.inkFaint;

  return (
    <View>
      <Text className="mb-1.5 font-body-medium text-sm text-ink-muted">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className={`h-14 flex-row items-center rounded-pane border bg-surface px-4 ${
          error ? 'border-expense' : 'border-line'
        }`}
      >
        {icon ? (
          <View
            className="mr-2.5 h-8 w-8 items-center justify-center rounded-lg border border-line bg-pane"
            style={{ borderColor: `${resolvedIconColor}55` }}
          >
            <Ionicons name={icon} size={16} color={resolvedIconColor} />
          </View>
        ) : null}
        <Text
          className={`flex-1 font-body text-base ${value ? 'text-ink' : 'text-ink-faint'}`}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={themeColors.inkFaint} />
      </Pressable>
      {error ? <Text className="mt-1.5 font-body text-sm text-expense">{error}</Text> : null}
    </View>
  );
}
