import {
  formatPeso,
  formatSignedPeso,
  fromDecimalString,
  parsePesoInput,
  sanitizeAmountInput,
  sumCentavos,
  toDecimalString,
} from '@/domain/money';

describe('parsePesoInput', () => {
  it.each([
    ['1234.56', 123456],
    ['1,234.56', 123456],
    ['₱ 1,234.56', 123456],
    ['1234', 123400],
    ['1.5', 150],
    ['.75', 75],
    ['0.05', 5],
    ['12,345,678.90', 1234567890],
  ])('parses %p as %p centavos', (input, expected) => {
    const result = parsePesoInput(input);
    expect(result).toEqual({ ok: true, centavos: expected });
  });

  it('accepts zero only when explicitly allowed', () => {
    expect(parsePesoInput('0')).toMatchObject({ ok: false, error: 'negative-not-allowed' });
    expect(parsePesoInput('0', { allowZero: true })).toEqual({ ok: true, centavos: 0 });
  });

  it('rejects negatives unless allowed', () => {
    expect(parsePesoInput('-5')).toMatchObject({ ok: false, error: 'negative-not-allowed' });
    expect(parsePesoInput('-5', { allowNegative: true })).toEqual({ ok: true, centavos: -500 });
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['abc', 'invalid'],
    ['1.2.3', 'invalid'],
    ['.', 'invalid'],
    ['1.555', 'too-many-decimals'],
    ['10000000000', 'too-large'],
  ])('rejects %p with %p', (input, error) => {
    const result = parsePesoInput(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(error);
  });
});

describe('formatPeso', () => {
  it.each([
    [0, '₱0.00'],
    [5, '₱0.05'],
    [50, '₱0.50'],
    [123456, '₱1,234.56'],
    [-123456, '-₱1,234.56'],
    [999_999_999_999, '₱9,999,999,999.99'],
  ])('formats %p as %p', (centavos, expected) => {
    expect(formatPeso(centavos)).toBe(expected);
  });

  it('can omit the symbol and grouping', () => {
    expect(formatPeso(123456, { symbol: false, grouping: false })).toBe('1234.56');
  });
});

describe('toDecimalString / fromDecimalString', () => {
  it('round-trips through a decimal string', () => {
    for (const centavos of [0, 1, 99, 100, 123456, -123456, 999_999_999_999]) {
      expect(fromDecimalString(toDecimalString(centavos))).toBe(centavos);
    }
  });

  it('returns null for unparseable values', () => {
    expect(fromDecimalString('not money')).toBeNull();
  });
});

describe('sumCentavos', () => {
  it('adds without floating point drift', () => {
    // 0.1 + 0.2 in floats is 0.30000000000000004
    expect(sumCentavos([10, 20])).toBe(30);
    expect(sumCentavos([1234, -234, 0])).toBe(1000);
    expect(sumCentavos([])).toBe(0);
  });
});

describe('sanitizeAmountInput', () => {
  it.each([
    ['12a3', '123'],
    ['1,234.5', '1234.5'],
    ['1.2345', '1.23'],
    ['.5', '0.5'],
    ['1.2.3', '1.23'],
    ['', ''],
    ['99999999999999', '9999999999'],
  ])('sanitizes %p to %p', (input, expected) => {
    expect(sanitizeAmountInput(input)).toBe(expected);
  });

  it('produces input that parsePesoInput accepts', () => {
    for (const raw of ['1234.56', '0.5', '99', '1,000']) {
      const sanitized = sanitizeAmountInput(raw);
      expect(parsePesoInput(sanitized).ok).toBe(true);
    }
  });
});

describe('formatSignedPeso', () => {
  it('prefixes the sign for non-zero values', () => {
    expect(formatSignedPeso(50000)).toBe('+₱500.00');
    expect(formatSignedPeso(-50000)).toBe('-₱500.00');
    expect(formatSignedPeso(0)).toBe('₱0.00');
  });
});
