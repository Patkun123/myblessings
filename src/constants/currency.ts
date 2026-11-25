/**
 * Currency is fixed to Philippine Peso for v1.0.
 * All amounts are stored and computed as integer minor units (centavos).
 */
export const CURRENCY = {
  code: 'PHP',
  symbol: '₱',
  /** Decimal places for the minor unit. 1 peso = 100 centavos. */
  minorUnitExponent: 2,
  /** Display locale hint for any Intl-based formatting (reports, PDFs). */
  locale: 'en-PH',
} as const;

/** 1 peso expressed in centavos. */
export const CENTAVOS_PER_PESO = 100;

/** Largest supported amount: ₱9,999,999,999.99. */
export const MAX_CENTAVOS = 999_999_999_999;
