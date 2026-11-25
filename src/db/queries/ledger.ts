import { sql } from 'drizzle-orm';

import { transaction } from '@/db/schema';

/**
 * Signed contribution of a ledger row to a wallet balance.
 *
 * `income` and `transfer_in` add money; `expense` and `transfer_out` remove it.
 * This fragment is the single source of truth for that rule — wallet balances,
 * report totals and dashboard summaries all build on it, so they can never
 * disagree about which direction an entry moves.
 */
export const signedAmountSql = sql<number>`COALESCE(SUM(CASE
  WHEN ${transaction.type} IN ('income', 'transfer_in') THEN ${transaction.amountCentavos}
  WHEN ${transaction.type} IN ('expense', 'transfer_out') THEN -${transaction.amountCentavos}
  ELSE 0 END), 0)`;

/** Live (not soft-deleted) rows joined to a wallet, for the "N entries" label. */
export const liveTransactionCountSql = sql<number>`COUNT(${transaction.id})`;

/**
 * Income and expense sums. Transfer legs fall into neither bucket: moving money
 * between wallets changes balances but is not income or an expense.
 */
export const incomeSumSql = sql<number>`COALESCE(SUM(CASE
  WHEN ${transaction.type} = 'income' THEN ${transaction.amountCentavos}
  ELSE 0 END), 0)`;

export const expenseSumSql = sql<number>`COALESCE(SUM(CASE
  WHEN ${transaction.type} = 'expense' THEN ${transaction.amountCentavos}
  ELSE 0 END), 0)`;
