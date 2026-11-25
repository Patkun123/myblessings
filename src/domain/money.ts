import { CENTAVOS_PER_PESO, CURRENCY, MAX_CENTAVOS } from '@/constants/currency';

/**
 * Money is always an integer number of centavos.
 * Never use floats for arithmetic — see `docs` in the plan §4.2.
 */
export type Centavos = number;

export type ParseError =
  | 'empty'
  | 'invalid'
  | 'too-many-decimals'
  | 'too-large'
  | 'negative-not-allowed';

export type ParseResult =
  | { ok: true; centavos: Centavos }
  | { ok: false; error: ParseError; message: string };

const MESSAGES: Record<ParseError, string> = {
  empty: 'Enter an amount.',
  invalid: 'Enter a valid amount.',
  'too-many-decimals': 'Use at most 2 decimal places.',
  'too-large': 'That amount is too large.',
  'negative-not-allowed': 'Amount must be greater than zero.',
};

const SEPARATOR_PATTERN = /[,\s\u00a0]/g;
const SYMBOL_PATTERN = new RegExp(CURRENCY.symbol, 'g');
const NUMERIC_PATTERN = /^\d*\.?\d*$/;

export function isCentavos(value: unknown): value is Centavos {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

/**
 * Parses free-form user input ("1,234.5", "₱ 1234", ".75") into centavos.
 * Commas and spaces are treated as grouping noise and ignored.
 */
export function parsePesoInput(
  raw: string,
  options: { allowNegative?: boolean; allowZero?: boolean } = {}
): ParseResult {
  const { allowNegative = false, allowZero = false } = options;

  if (raw == null) return fail('empty');

  const cleaned = raw.replace(SYMBOL_PATTERN, '').replace(SEPARATOR_PATTERN, '');
  if (cleaned === '') return fail('empty');

  const negative = cleaned.startsWith('-');
  const body = negative || cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  if (body === '' || !NUMERIC_PATTERN.test(body)) return fail('invalid');

  const dotIndex = body.indexOf('.');
  if (dotIndex !== -1 && body.indexOf('.', dotIndex + 1) !== -1) return fail('invalid');

  const [wholePart = '', fractionPart = ''] = body.split('.');
  if (wholePart === '' && fractionPart === '') return fail('invalid');
  if (fractionPart.length > CURRENCY.minorUnitExponent) return fail('too-many-decimals');

  const pesos = wholePart === '' ? 0 : Number(wholePart);
  const fraction = Number(fractionPart.padEnd(CURRENCY.minorUnitExponent, '0'));
  if (!Number.isFinite(pesos) || !Number.isFinite(fraction)) return fail('invalid');

  const magnitude = pesos * CENTAVOS_PER_PESO + fraction;
  if (!Number.isSafeInteger(magnitude) || magnitude > MAX_CENTAVOS) return fail('too-large');

  if (negative && !allowNegative) return fail('negative-not-allowed');
  if (!negative && magnitude === 0 && !allowZero) return fail('negative-not-allowed');

  return { ok: true, centavos: negative ? -magnitude : magnitude };
}

function fail(error: ParseError): ParseResult {
  return { ok: false, error, message: MESSAGES[error] };
}

/**
 * Formats centavos for display: 123456 -> "₱1,234.56".
 * Negative values render as "-₱1,234.56" (debits in a running balance).
 */
export function formatPeso(
  centavos: Centavos,
  options: { symbol?: boolean; grouping?: boolean } = {}
): string {
  const { symbol = true, grouping = true } = options;
  const rounded = Math.round(centavos);
  const absolute = Math.abs(rounded);
  const whole = Math.trunc(absolute / CENTAVOS_PER_PESO);
  const fraction = absolute % CENTAVOS_PER_PESO;

  const wholeText = grouping ? groupThousands(whole) : String(whole);
  const fractionText = String(fraction).padStart(CURRENCY.minorUnitExponent, '0');
  const sign = rounded < 0 ? '-' : '';

  return `${sign}${symbol ? CURRENCY.symbol : ''}${wholeText}.${fractionText}`;
}

/** Machine-readable decimal string for CSV/JSON exports: 123456 -> "1234.56". */
export function toDecimalString(centavos: Centavos): string {
  return formatPeso(centavos, { symbol: false, grouping: false });
}

/** Rebuilds centavos from a stored decimal string, for import/restore. */
export function fromDecimalString(value: string): Centavos | null {
  const parsed = parsePesoInput(value.trim(), { allowNegative: true, allowZero: true });
  return parsed.ok ? parsed.centavos : null;
}

/**
 * Normalises raw keystrokes for a currency field:
 * digits and a single decimal point, at most 2 decimals, at most 10 whole digits.
 * Rejects a leading '.' by turning it into '0.'.
 */
export function sanitizeAmountInput(raw: string): string {
  const digitsAndDot = raw.replace(/[^\d.]/g, '');
  const firstDot = digitsAndDot.indexOf('.');

  if (firstDot === -1) {
    return digitsAndDot.slice(0, 10);
  }

  const whole = digitsAndDot.slice(0, firstDot).slice(0, 10);
  const fraction = digitsAndDot
    .slice(firstDot + 1)
    .replace(/\./g, '')
    .slice(0, CURRENCY.minorUnitExponent);

  return `${whole === '' ? '0' : whole}.${fraction}`;
}

export function sumCentavos(values: readonly Centavos[]): Centavos {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

/** Signed display for a running balance, e.g. "+₱500.00" / "-₱500.00". */
export function formatSignedPeso(centavos: Centavos): string {
  if (centavos === 0) return formatPeso(0);
  return `${centavos > 0 ? '+' : ''}${formatPeso(centavos)}`;
}

function groupThousands(whole: number): string {
  return String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
