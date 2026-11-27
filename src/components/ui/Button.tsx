import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { useThemeColors } from '@/stores/themeStore';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-brand border border-brand',
  secondary: 'border border-line bg-surface',
  ghost: 'bg-transparent',
  danger: 'bg-expense border border-expense',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-brand-ink',
  secondary: 'text-ink',
  ghost: 'text-brand',
  danger: 'text-brand-ink',
};

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  icon,
  disabled,
  ...rest
}: ButtonProps) {
  const themeColors = useThemeColors();
  const isDisabled = disabled === true || loading;
  const spinnerColor =
    variant === 'secondary' || variant === 'ghost' ? themeColors.brand : themeColors.brandInk;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 rounded-pane ${
        size === 'lg' ? 'h-14 px-6' : 'h-12 px-5'
      } ${CONTAINER[variant]} ${isDisabled ? 'border-dashed' : ''} ${fullWidth ? 'w-full' : ''}`}
      style={({ pressed }) => ({ opacity: isDisabled ? 0.48 : pressed ? 0.86 : 1 })}
    >
      {loading ? <ActivityIndicator size="small" color={spinnerColor} /> : icon}
      <Text className={`font-body-semibold text-base ${LABEL[variant]}`}>{label}</Text>
    </Pressable>
  );
}
