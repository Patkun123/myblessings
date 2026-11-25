import { Text, TextInput, View } from 'react-native';

import { sanitizeAmountInput } from '@/domain/money';
import { useThemeColors } from '@/stores/themeStore';

type MoneyInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  error?: string | null;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  testID?: string;
};

/**
 * Currency field. Keeps the raw text in the caller's state and normalises
 * keystrokes to digits + one decimal point (max 2 decimals, 10 whole digits).
 * Convert with `parsePesoInput` on submit — never store the text.
 */
export function MoneyInput({
  value,
  onChangeText,
  label,
  error,
  placeholder = '0.00',
  autoFocus = false,
  onSubmitEditing,
  testID,
}: MoneyInputProps) {
  const themeColors = useThemeColors();

  return (
    <View>
      {label ? <Text className="mb-1.5 text-sm font-medium text-ink-muted">{label}</Text> : null}
      <View
        className={`h-14 flex-row items-center rounded-xl border bg-surface px-4 ${
          error ? 'border-expense' : 'border-line'
        }`}
      >
        <Text className="mr-2 text-xl font-semibold text-ink-faint">₱</Text>
        <TextInput
          className="flex-1 text-xl font-semibold text-ink"
          value={value}
          onChangeText={(text) => onChangeText(sanitizeAmountInput(text))}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder={placeholder}
          placeholderTextColor={themeColors.inkFaint}
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="done"
          testID={testID}
          accessibilityLabel={label ?? 'Amount in pesos'}
          maxLength={13}
        />
      </View>
      {error ? <Text className="mt-1.5 text-sm text-expense">{error}</Text> : null}
    </View>
  );
}
