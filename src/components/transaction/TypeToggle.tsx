import { Pressable, Text, View } from 'react-native';

import type { TransactionKind } from '@/domain/transaction';
import { useThemeColors } from '@/stores/themeStore';

type TypeToggleProps = {
  value: TransactionKind;
  onChange: (value: TransactionKind) => void;
};

/** Expense / income switch. The selected side takes its semantic colour. */
export function TypeToggle({ value, onChange }: TypeToggleProps) {
  const themeColors = useThemeColors();
  const options: readonly { value: TransactionKind; label: string; tint: string }[] = [
    { value: 'expense', label: 'Expense', tint: themeColors.expense },
    { value: 'income', label: 'Income', tint: themeColors.income },
  ];

  return (
    <View className="flex-row rounded-xl bg-canvas p-1">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className="flex-1 items-center justify-center rounded-lg py-2.5"
            style={
              selected
                ? {
                    backgroundColor: themeColors.surface,
                    borderWidth: 1,
                    borderColor: option.tint,
                  }
                : undefined
            }
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: selected ? option.tint : themeColors.inkMuted }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
