import { Pressable, Text, View } from 'react-native';

import { CameMark } from '@/components/ui/CameMark';
import type { TransactionKind } from '@/domain/transaction';
import { useThemeColors } from '@/stores/themeStore';

type TypeToggleProps = {
  value: TransactionKind;
  onChange: (value: TransactionKind) => void;
};

/** Expense / income switch. Selected option carries both its semantic tint and a came mark. */
export function TypeToggle({ value, onChange }: TypeToggleProps) {
  const themeColors = useThemeColors();
  const options: readonly { value: TransactionKind; label: string; tint: string }[] = [
    { value: 'expense', label: 'Expense', tint: themeColors.expense },
    { value: 'income', label: 'Income', tint: themeColors.income },
  ];

  return (
    <View className="flex-row gap-1 rounded-pane border border-line bg-pane p-1">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className="relative min-h-[44px] flex-1 items-center justify-center overflow-hidden rounded-lg py-2.5"
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
            <CameMark active={selected} color={option.tint} />
            <Text
              className="font-body-semibold text-sm"
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
