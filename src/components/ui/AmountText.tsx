import { Text } from 'react-native';

import { formatPeso } from '@/domain/money';

type Tone = 'neutral' | 'income' | 'expense' | 'muted' | 'inverse';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const TONE: Record<Tone, string> = {
  neutral: 'text-ink',
  income: 'text-income',
  expense: 'text-expense',
  muted: 'text-ink-muted',
  inverse: 'text-white',
};

const SIZE: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
};

type AmountTextProps = {
  centavos: number;
  tone?: Tone;
  size?: Size;
  className?: string;
};

/** Renders integer centavos as ₱1,234.56. */
export function AmountText({ centavos, tone = 'neutral', size = 'md', className }: AmountTextProps) {
  return (
    <Text
      numberOfLines={1}
      className={`font-semibold tabular-nums ${TONE[tone]} ${SIZE[size]} ${className ?? ''}`}
    >
      {formatPeso(centavos)}
    </Text>
  );
}
