import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/constants/theme';
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
  return (
    <View>
      {label ? <Text className="mb-1.5 text-sm font-medium text-ink-muted">{label}</Text> : null}
      <View
        className={`h-14 flex-row items-center rounded-xl border bg-surface px-4 ${
          error ? 'border-expense' : 'border-line'
        }`}
      >
        {icon ? (
          <View className="mr-2.5">
            <Ionicons name={icon} size={20} color={colors.inkFaint} />
          </View>
        ) : null}
        <TextInput
          className="flex-1 text-base text-ink"
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel={label}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <Text className="mt-1.5 text-sm text-expense">{error}</Text>
      ) : hint ? (
        <Text className="mt-1.5 text-xs text-ink-faint">{hint}</Text>
      ) : null}
    </View>
  );
}
