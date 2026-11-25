import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { useThemeColors } from '@/stores/themeStore';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-brand',
  secondary: 'border border-line bg-surface',
  ghost: 'bg-transparent',
  danger: 'bg-[#B42318] dark:bg-[#C82B22]',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-brand',
  danger: 'text-white',
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
    variant === 'secondary' || variant === 'ghost' ? themeColors.brand : '#FFFFFF';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 rounded-xl ${
        size === 'lg' ? 'h-14 px-6' : 'h-12 px-5'
      } ${CONTAINER[variant]} ${fullWidth ? 'w-full' : ''}`}
      style={({ pressed }) => ({ opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 })}
    >
      {loading ? <ActivityIndicator size="small" color={spinnerColor} /> : icon}
      <Text className={`text-base font-semibold ${LABEL[variant]}`}>{label}</Text>
    </Pressable>
  );
}
