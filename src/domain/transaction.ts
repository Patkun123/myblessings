import type { CategoryType } from '@/db/schema';
import { parsePesoInput } from '@/domain/money';
import { isCalendarDate, isFutureCalendarDate } from '@/utils/date';

export const TRANSACTION_DESCRIPTION_MAX = 120;
export const TRANSACTION_NOTE_MAX = 500;

/** Only real money movements are recordable by hand; transfers get their own flow. */
export type TransactionKind = Extract<CategoryType, 'income' | 'expense'>;

export type TransactionDraft = {
  type: TransactionKind;
  /** Raw text from the amount field. */
  amount: string;
  walletId: string | null;
  categoryId: string | null;
  /** Type of the selected category, used to reject mismatches. */
  categoryType?: CategoryType | null;
  occurredOn: string;
  description: string;
  note: string;
};

export type ValidTransaction = {
  type: TransactionKind;
  amountCentavos: number;
  walletId: string;
  categoryId: string;
  occurredOn: string;
  description: string | null;
  note: string | null;
};

export type TransactionValidation =
  | { ok: true; values: ValidTransaction }
  | { ok: false; error: string };

/**
 * Validates an income/expense entry before it reaches SQLite.
 *
 * The schema enforces a positive amount and a `YYYY-MM-DD` date; everything
 * else (wallet present, category present and type-matched, not in the future)
 * is a product rule and lives here so the form and the query layer share it.
 */
export function validateTransactionDraft(draft: TransactionDraft): TransactionValidation {
  const amount = parsePesoInput(draft.amount);
  if (!amount.ok) return { ok: false, error: amount.message };

  if (!draft.walletId) {
    return {
      ok: false,
      error:
        draft.type === 'income' ? 'Choose the wallet that received the money.' : 'Choose a wallet.',
    };
  }

  if (!draft.categoryId) {
    return { ok: false, error: 'Choose a category.' };
  }

  if (draft.categoryType && draft.categoryType !== draft.type) {
    return {
      ok: false,
      error: `Pick a category that matches ${draft.type === 'income' ? 'income' : 'an expense'}.`,
    };
  }

  if (!isCalendarDate(draft.occurredOn)) {
    return { ok: false, error: 'Enter the date as YYYY-MM-DD.' };
  }

  if (isFutureCalendarDate(draft.occurredOn)) {
    return { ok: false, error: 'That date is in the future.' };
  }

  const description = draft.description.trim().replace(/\s+/g, ' ');
  if (description.length > TRANSACTION_DESCRIPTION_MAX) {
    return {
      ok: false,
      error: `Keep the description under ${TRANSACTION_DESCRIPTION_MAX} characters.`,
    };
  }

  const note = draft.note.trim();
  if (note.length > TRANSACTION_NOTE_MAX) {
    return { ok: false, error: `Keep the note under ${TRANSACTION_NOTE_MAX} characters.` };
  }

  return {
    ok: true,
    values: {
      type: draft.type,
      amountCentavos: amount.centavos,
      walletId: draft.walletId,
      categoryId: draft.categoryId,
      occurredOn: draft.occurredOn,
      description: description.length > 0 ? description : null,
      note: note.length > 0 ? note : null,
    },
  };
}

/**
 * The amount as it affects a balance: income adds, expense subtracts.
 * Display and tests use this so the sign rule is written down once.
 */
export function signedCentavos(type: TransactionKind, amountCentavos: number): number {
  return type === 'income' ? amountCentavos : -amountCentavos;
}
