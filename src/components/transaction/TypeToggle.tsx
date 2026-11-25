import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { TransactionKind } from '@/domain/transaction';

const OPTIONS: readonly { value: TransactionKind; label: string; tint: string }[] = [
  { value: 'expense', label: 'Expense', tint: colors.expense },
  { value: 'income', label: 'Income', tint: colors.income },
];

type TypeToggleProps = {
  value: TransactionKind;
  onChange: (value: TransactionKind) => void;
};

/** Expense / income switch. The selected side takes its semantic colour. */
export function TypeToggle({ value, onChange }: TypeToggleProps) {
  return (
    <View className="flex-row rounded-xl bg-canvas p-1">
      {OPTIONS.map((option) => {
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
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: option.tint,
                  }
                : undefined
            }
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: selected ? option.tint : colors.inkMuted }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
