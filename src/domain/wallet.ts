import { parsePesoInput } from '@/domain/money';

export const WALLET_NAME_MAX = 40;

export type WalletDraft = {
  name: string;
  /** Raw text from the money field; empty means "start at zero". */
  openingBalance: string;
};

export type WalletValidation =
  | { ok: true; name: string; openingBalanceCentavos: number }
  | { ok: false; error: string };

/**
 * Validates a wallet the user is creating.
 *
 * The opening balance is the money already in the wallet today (cash on hand,
 * bank balance). It is stored on the wallet row and added to the ledger by the
 * balance query — it is never written as a fake income transaction.
 */
export function validateWalletDraft({ name, openingBalance }: WalletDraft): WalletValidation {
  const trimmed = name.trim().replace(/\s+/g, ' ');

  if (trimmed.length === 0) return { ok: false, error: 'Give this wallet a name.' };
  if (trimmed.length > WALLET_NAME_MAX) {
    return { ok: false, error: `Keep the name under ${WALLET_NAME_MAX} characters.` };
  }

  if (openingBalance.trim() === '') {
    return { ok: true, name: trimmed, openingBalanceCentavos: 0 };
  }

  const parsed = parsePesoInput(openingBalance, { allowZero: true });
  if (!parsed.ok) return { ok: false, error: parsed.message };

  return { ok: true, name: trimmed, openingBalanceCentavos: parsed.centavos };
}
