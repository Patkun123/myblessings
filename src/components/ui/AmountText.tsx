import { Text } from 'react-native';

import { formatPeso } from '@/domain/money';

type Tone = 'neutral' | 'income' | 'expense' | 'muted' | 'inverse' | 'plate';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const TONE: Record<Tone, string> = {
  neutral: 'text-ink',
  income: 'text-income',
  expense: 'text-expense',
  muted: 'text-ink-muted',
  inverse: 'text-brand-ink',
  plate: 'text-plate-ink',
};

const SIZE: Record<Size, string> = {
  xs: 'text-[13px]',
  sm: 'text-sm',
  md: 'text-[15px]',
  lg: 'text-xl',
  xl: 'text-[34px] leading-[40px]',
};

type AmountTextProps = {
  centavos: number;
  tone?: Tone;
  size?: Size;
  className?: string;
};

/** Renders integer centavos as ₱1,234.56 using tabular Archivo figures. */
export function AmountText({ centavos, tone = 'neutral', size = 'md', className }: AmountTextProps) {
  return (
    <Text
      numberOfLines={1}
      style={{ fontVariant: ['tabular-nums'] }}
      className={`font-body-bold tabular-nums ${TONE[tone]} ${SIZE[size]} ${className ?? ''}`}
    >
      {formatPeso(centavos)}
    </Text>
  );
}
