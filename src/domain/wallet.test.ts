import { validateWalletDraft, WALLET_NAME_MAX } from '@/domain/wallet';

describe('validateWalletDraft', () => {
  it('accepts a name with no opening balance', () => {
    expect(validateWalletDraft({ name: '  Cash  ', openingBalance: '' })).toEqual({
      ok: true,
      name: 'Cash',
      openingBalanceCentavos: 0,
    });
  });

  it('collapses inner whitespace in the name', () => {
    expect(validateWalletDraft({ name: 'Cash   on hand', openingBalance: '' })).toEqual({
      ok: true,
      name: 'Cash on hand',
      openingBalanceCentavos: 0,
    });
  });

  it('parses the opening balance into centavos', () => {
    expect(validateWalletDraft({ name: 'Cash', openingBalance: '1,234.5' })).toEqual({
      ok: true,
      name: 'Cash',
      openingBalanceCentavos: 123450,
    });
  });

  it('accepts a zero opening balance', () => {
    expect(validateWalletDraft({ name: 'Cash', openingBalance: '0' })).toEqual({
      ok: true,
      name: 'Cash',
      openingBalanceCentavos: 0,
    });
  });

  it('rejects an empty name', () => {
    const result = validateWalletDraft({ name: '   ', openingBalance: '' });
    expect(result).toEqual({ ok: false, error: 'Give this wallet a name.' });
  });

  it('rejects a name that is too long', () => {
    const result = validateWalletDraft({
      name: 'x'.repeat(WALLET_NAME_MAX + 1),
      openingBalance: '',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a malformed amount', () => {
    const result = validateWalletDraft({ name: 'Cash', openingBalance: '12.345' });
    expect(result).toEqual({ ok: false, error: 'Use at most 2 decimal places.' });
  });
});
