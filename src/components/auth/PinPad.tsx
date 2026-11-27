import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { HIT_SLOP } from '@/constants/theme';
import { useThemeColors } from '@/stores/themeStore';

type PinPadProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  disabled?: boolean;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/** Digits-only keypad. No native keyboard, so no autofill or clipboard leak. */
export function PinPad({ value, onChange, maxLength, disabled = false }: PinPadProps) {
  const themeColors = useThemeColors();

  function append(digit: string) {
    if (disabled || value.length >= maxLength) return;
    onChange(value + digit);
  }

  function backspace() {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  }

  return (
    <View>
      <View className="mb-8 flex-row justify-center gap-3">
        {Array.from({ length: maxLength }, (_, index) => {
          const filled = index < value.length;
          return (
            <View
              key={index}
              className={`h-3.5 w-3.5 rounded-full ${
                filled ? 'bg-brand' : 'border border-line bg-surface'
              }`}
            />
          );
        })}
      </View>

      <View className="gap-3">
        {[0, 3, 6].map((rowStart) => (
          <View key={rowStart} className="flex-row justify-center gap-3">
            {KEYS.slice(rowStart, rowStart + 3).map((digit) => (
              <PinKey
                key={digit}
                label={digit}
                disabled={disabled}
                onPress={() => append(digit)}
              />
            ))}
          </View>
        ))}

        <View className="flex-row justify-center gap-3">
          <View className="h-16 w-16" />
          <PinKey label="0" disabled={disabled} onPress={() => append('0')} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete last digit"
            hitSlop={HIT_SLOP}
            disabled={disabled || value.length === 0}
            onPress={backspace}
            className="h-16 w-16 items-center justify-center rounded-full"
            style={({ pressed }) => ({ opacity: disabled ? 0.3 : pressed ? 0.6 : 1 })}
          >
            <Ionicons name="backspace-outline" size={24} color={themeColors.inkMuted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PinKey({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className="h-16 w-16 items-center justify-center rounded-full border border-line bg-pane"
      style={({ pressed }) => ({
        opacity: disabled ? 0.4 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <Text
        style={{ fontVariant: ['tabular-nums'] }}
        className="font-body-semibold text-2xl tabular-nums text-ink"
      >
        {label}
      </Text>
    </Pressable>
  );
}
