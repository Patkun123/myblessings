import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { useThemeColors } from '@/stores/themeStore';
import type { IconName } from '@/types/icons';

type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string | null;
  hint?: string;
  icon?: IconName;
  right?: ReactNode;
};

/** Single-line text field with label, icon slot, hint and error text. */
export function Input({ label, error, hint, icon, right, ...rest }: InputProps) {
  const themeColors = useThemeColors();

  return (
    <View>
      {label ? (
        <Text className="mb-1.5 font-body-medium text-sm text-ink-muted">{label}</Text>
      ) : null}
      <View
        className={`h-14 flex-row items-center rounded-pane border bg-surface px-4 ${
          error ? 'border-expense' : 'border-line'
        }`}
      >
        {icon ? (
          <View className="mr-2.5">
            <Ionicons name={icon} size={20} color={themeColors.inkFaint} />
          </View>
        ) : null}
        <TextInput
          className="flex-1 font-body text-base text-ink"
          placeholderTextColor={themeColors.inkFaint}
          accessibilityLabel={label}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <Text className="mt-1.5 font-body text-sm text-expense">{error}</Text>
      ) : hint ? (
        <Text className="mt-1.5 font-body text-xs text-ink-faint">{hint}</Text>
      ) : null}
    </View>
  );
}
