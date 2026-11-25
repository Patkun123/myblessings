import {
  signedCentavos,
  TRANSACTION_DESCRIPTION_MAX,
  TRANSACTION_NOTE_MAX,
  validateTransactionDraft,
  type TransactionDraft,
} from '@/domain/transaction';
import {
  shiftCalendarDate,
  todayCalendarDate,
  yesterdayCalendarDate,
} from '@/utils/date';

const TODAY = todayCalendarDate();

function draft(overrides: Partial<TransactionDraft> = {}): TransactionDraft {
  return {
    type: 'expense',
    amount: '250.50',
    walletId: 'wallet-1',
    categoryId: 'category-1',
    categoryType: 'expense',
    occurredOn: TODAY,
    description: '',
    note: '',
    ...overrides,
  };
}

describe('validateTransactionDraft', () => {
  it('accepts an expense and converts the amount to centavos', () => {
    expect(validateTransactionDraft(draft({ description: '  Market  ', note: '   ' }))).toEqual({
      ok: true,
      values: {
        type: 'expense',
        amountCentavos: 25050,
        walletId: 'wallet-1',
        categoryId: 'category-1',
        occurredOn: TODAY,
        description: 'Market',
        note: null,
      },
    });
  });

  it('accepts income and collapses inner whitespace in the description', () => {
    const result = validateTransactionDraft(
      draft({
        type: 'income',
        categoryType: 'income',
        amount: '1,500',
        description: 'November   salary',
        note: '  payslip  ',
      })
    );

    expect(result).toEqual({
      ok: true,
      values: {
        type: 'income',
        amountCentavos: 150000,
        walletId: 'wallet-1',
        categoryId: 'category-1',
        occurredOn: TODAY,
        description: 'November salary',
        note: 'payslip',
      },
    });
  });

  it('accepts yesterday', () => {
    const result = validateTransactionDraft(draft({ occurredOn: yesterdayCalendarDate() }));
    expect(result.ok).toBe(true);
  });

  it('rejects an empty amount', () => {
    expect(validateTransactionDraft(draft({ amount: '' }))).toEqual({
      ok: false,
      error: 'Enter an amount.',
    });
  });

  it('rejects zero', () => {
    expect(validateTransactionDraft(draft({ amount: '0' }))).toEqual({
      ok: false,
      error: 'Amount must be greater than zero.',
    });
  });

  it('rejects a missing wallet', () => {
    expect(validateTransactionDraft(draft({ walletId: null }))).toEqual({
      ok: false,
      error: 'Choose a wallet.',
    });
  });

  it('asks where income arrived when the wallet is missing', () => {
    expect(
      validateTransactionDraft(draft({ type: 'income', categoryType: 'income', walletId: null }))
    ).toEqual({ ok: false, error: 'Choose the wallet that received the money.' });
  });

  it('rejects a missing category', () => {
    expect(validateTransactionDraft(draft({ categoryId: null }))).toEqual({
      ok: false,
      error: 'Choose a category.',
    });
  });

  it('rejects a category from the other type', () => {
    expect(validateTransactionDraft(draft({ categoryType: 'income' }))).toEqual({
      ok: false,
      error: 'Pick a category that matches an expense.',
    });
  });

  it('rejects a malformed date', () => {
    expect(validateTransactionDraft(draft({ occurredOn: '26-11-2026' }))).toEqual({
      ok: false,
      error: 'Enter the date as YYYY-MM-DD.',
    });
  });

  it('rejects a future date', () => {
    expect(
      validateTransactionDraft(draft({ occurredOn: shiftCalendarDate(TODAY, 1) }))
    ).toEqual({ ok: false, error: 'That date is in the future.' });
  });

  it('rejects an over-long description', () => {
    const result = validateTransactionDraft(
      draft({ description: 'x'.repeat(TRANSACTION_DESCRIPTION_MAX + 1) })
    );
    expect(result.ok).toBe(false);
  });

  it('rejects an over-long note', () => {
    const result = validateTransactionDraft(
      draft({ note: 'x'.repeat(TRANSACTION_NOTE_MAX + 1) })
    );
    expect(result.ok).toBe(false);
  });
});

describe('signedCentavos', () => {
  it('adds income and subtracts expenses', () => {
    expect(signedCentavos('income', 150000)).toBe(150000);
    expect(signedCentavos('expense', 25050)).toBe(-25050);
  });
});
