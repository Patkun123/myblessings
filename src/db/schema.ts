import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Schema conventions (see plan §4.2):
 * - Money is INTEGER centavos, never REAL.
 * - IDs are UUIDv4 TEXT (future Cloud Sync).
 * - Calendar dates are TEXT 'YYYY-MM-DD' in local time.
 * - Timestamps are TEXT UTC ISO-8601.
 * - User-authored rows are soft-deleted via `deleted_at`; every query must filter it.
 * - Every table is profile-scoped with `user_id`.
 */

const utcNow = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const CATEGORY_TYPES = ['income', 'expense'] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const TRANSACTION_TYPES = ['income', 'expense', 'transfer_out', 'transfer_in'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const RECURRENCE_FREQUENCIES = ['weekly', 'biweekly', 'monthly'] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export const BUDGET_PERIODS = ['weekly', 'monthly'] as const;
export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];

/** Non-money ledger sign for a transaction type. */
export function isInflow(type: TransactionType): boolean {
  return type === 'income' || type === 'transfer_in';
}

// ---------------------------------------------------------------------------
// user
// ---------------------------------------------------------------------------
export const user = sqliteTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    avatarUri: text('avatar_uri'),
    createdAt: text('created_at').notNull().default(utcNow),
    updatedAt: text('updated_at').notNull().default(utcNow),
    deletedAt: text('deleted_at'),
  },
  (t) => [uniqueIndex('ux_user_email').on(t.email)]
);

// ---------------------------------------------------------------------------
// settings (one row per profile)
// ---------------------------------------------------------------------------
export const settings = sqliteTable('settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  biometricEnabled: integer('biometric_enabled', { mode: 'boolean' }).notNull().default(false),
  theme: text('theme').notNull().default('light'),
  locale: text('locale').notNull().default('en-PH'),
  lastBackupAt: text('last_backup_at'),
  createdAt: text('created_at').notNull().default(utcNow),
  updatedAt: text('updated_at').notNull().default(utcNow),
});

// ---------------------------------------------------------------------------
// wallet — balance is derived: opening_balance + Σ ledger, never stored
// ---------------------------------------------------------------------------
export const wallet = sqliteTable(
  'wallet',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon').notNull().default('wallet'),
    color: text('color').notNull().default('#0E6B57'),
    openingBalanceCentavos: integer('opening_balance_centavos').notNull().default(0),
    isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at').notNull().default(utcNow),
    updatedAt: text('updated_at').notNull().default(utcNow),
    deletedAt: text('deleted_at'),
  },
  (t) => [index('ix_wallet_user').on(t.userId)]
);

// ---------------------------------------------------------------------------
// category
// ---------------------------------------------------------------------------
export const category = sqliteTable(
  'category',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon').notNull().default('pricetag'),
    color: text('color').notNull().default('#5F736C'),
    type: text('type', { enum: CATEGORY_TYPES }).notNull(),
    isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
    isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at').notNull().default(utcNow),
    updatedAt: text('updated_at').notNull().default(utcNow),
    deletedAt: text('deleted_at'),
  },
  (t) => [
    index('ix_category_user_type').on(t.userId, t.type),
    // Category names are unique per profile + type, but only among live rows.
    uniqueIndex('ux_category_name')
      .on(t.userId, t.type, t.name)
      .where(sql`${t.deletedAt} IS NULL`),
  ]
);

// ---------------------------------------------------------------------------
// transfer — one row, materialised as two linked ledger legs
// ---------------------------------------------------------------------------
export const transfer = sqliteTable(
  'transfer',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    fromWalletId: text('from_wallet_id')
      .notNull()
      .references(() => wallet.id),
    toWalletId: text('to_wallet_id')
      .notNull()
      .references(() => wallet.id),
    amountCentavos: integer('amount_centavos').notNull(),
    occurredOn: text('occurred_on').notNull(),
    note: text('note'),
    createdAt: text('created_at').notNull().default(utcNow),
    updatedAt: text('updated_at').notNull().default(utcNow),
    deletedAt: text('deleted_at'),
  },
  (t) => [
    check('ck_transfer_amount_positive', sql`${t.amountCentavos} > 0`),
    check('ck_transfer_distinct_wallets', sql`${t.fromWalletId} <> ${t.toWalletId}`),
    index('ix_transfer_user_date').on(t.userId, t.occurredOn),
  ]
);

// ---------------------------------------------------------------------------
// recurring_rule — template; occurrences are generated into `transaction`
// ---------------------------------------------------------------------------
export const recurringRule = sqliteTable(
  'recurring_rule',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    walletId: text('wallet_id')
      .notNull()
      .references(() => wallet.id),
    categoryId: text('category_id').references(() => category.id),
    type: text('type', { enum: CATEGORY_TYPES }).notNull(),
    amountCentavos: integer('amount_centavos').notNull(),
    description: text('description'),
    note: text('note'),
    frequency: text('frequency', { enum: RECURRENCE_FREQUENCIES }).notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date'),
    nextOccurrence: text('next_occurrence').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull().default(utcNow),
    updatedAt: text('updated_at').notNull().default(utcNow),
    deletedAt: text('deleted_at'),
  },
  (t) => [
    check('ck_recurring_amount_positive', sql`${t.amountCentavos} > 0`),
    index('ix_recurring_user_active').on(t.userId, t.isActive),
  ]
);

// ---------------------------------------------------------------------------
// pledge — fulfilled amount and status are derived from linked transactions
// ---------------------------------------------------------------------------
export const pledge = sqliteTable(
  'pledge',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    walletId: text('wallet_id')
      .notNull()
      .references(() => wallet.id),
    donorName: text('donor_name').notNull(),
    purpose: text('purpose'),
    pledgedCentavos: integer('pledged_centavos').notNull(),
    dueDate: text('due_date'),
    note: text('note'),
    createdAt: text('created_at').notNull().default(utcNow),
    updatedAt: text('updated_at').notNull().default(utcNow),
    deletedAt: text('deleted_at'),
  },
  (t) => [
    check('ck_pledge_amount_positive', sql`${t.pledgedCentavos} > 0`),
    index('ix_pledge_user').on(t.userId),
  ]
);

// ---------------------------------------------------------------------------
// transaction — the single ledger
// ---------------------------------------------------------------------------
export const transaction = sqliteTable(
  'transaction',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    walletId: text('wallet_id')
      .notNull()
      .references(() => wallet.id),
    categoryId: text('category_id').references(() => category.id),
    type: text('type', { enum: TRANSACTION_TYPES }).notNull(),
    amountCentavos: integer('amount_centavos').notNull(),
    occurredOn: text('occurred_on').notNull(),
    description: text('description'),
    note: text('note'),
    transferId: text('transfer_id').references(() => transfer.id, { onDelete: 'cascade' }),
    recurringId: text('recurring_id').references(() => recurringRule.id, {
      onDelete: 'set null',
    }),
    recurrenceOccurrence: text('recurrence_occurrence'),
    pledgeId: text('pledge_id').references(() => pledge.id, { onDelete: 'set null' }),
    donorName: text('donor_name'),
    createdAt: text('created_at').notNull().default(utcNow),
    updatedAt: text('updated_at').notNull().default(utcNow),
    deletedAt: text('deleted_at'),
  },
  (t) => [
    check('ck_txn_amount_positive', sql`${t.amountCentavos} > 0`),
    check(
      'ck_txn_occurred_on_format',
      sql`${t.occurredOn} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`
    ),
    index('ix_txn_user_date').on(t.userId, t.occurredOn),
    index('ix_txn_wallet_date').on(t.userId, t.walletId, t.occurredOn),
    index('ix_txn_category_date').on(t.userId, t.categoryId, t.occurredOn),
    // One generated entry per rule per occurrence — the recurrence dup guard.
    uniqueIndex('ux_txn_recurrence_occurrence')
      .on(t.recurringId, t.recurrenceOccurrence)
      .where(sql`${t.recurringId} IS NOT NULL`),
    // Exactly one in leg and one out leg per transfer.
    uniqueIndex('ux_txn_transfer_leg')
      .on(t.transferId, t.type)
      .where(sql`${t.transferId} IS NOT NULL`),
    index('ix_txn_pledge')
      .on(t.pledgeId)
      .where(sql`${t.pledgeId} IS NOT NULL`),
  ]
);

// ---------------------------------------------------------------------------
// budget
// ---------------------------------------------------------------------------
export const budget = sqliteTable(
  'budget',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** NULL means "all categories" only when `walletId` is also NULL. */
    categoryId: text('category_id').references(() => category.id),
    walletId: text('wallet_id').references(() => wallet.id),
    limitCentavos: integer('limit_centavos').notNull(),
    period: text('period', { enum: BUDGET_PERIODS }).notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date'),
    carryOver: integer('carry_over', { mode: 'boolean' }).notNull().default(false),
    /** Highest threshold (0/75/90/100) already notified this period. */
    lastNotifiedThreshold: integer('last_notified_threshold').notNull().default(0),
    createdAt: text('created_at').notNull().default(utcNow),
    updatedAt: text('updated_at').notNull().default(utcNow),
    deletedAt: text('deleted_at'),
  },
  (t) => [
    check('ck_budget_limit_positive', sql`${t.limitCentavos} > 0`),
    check(
      'ck_budget_threshold',
      sql`${t.lastNotifiedThreshold} IN (0, 75, 90, 100)`
    ),
    index('ix_budget_user').on(t.userId),
    // SQLite treats NULLs as distinct inside a unique index, so each of the four
    // budget shapes needs its own partial index or duplicates slip through.
    // 1. wallet + category
    uniqueIndex('ux_budget_wallet_category')
      .on(t.userId, t.categoryId, t.walletId, t.period)
      .where(sql`${t.walletId} IS NOT NULL AND ${t.categoryId} IS NOT NULL AND ${t.deletedAt} IS NULL`),
    // 2. wallet only (all categories)
    uniqueIndex('ux_budget_wallet')
      .on(t.userId, t.walletId, t.period)
      .where(sql`${t.walletId} IS NOT NULL AND ${t.categoryId} IS NULL AND ${t.deletedAt} IS NULL`),
    // 3. category only (all wallets)
    uniqueIndex('ux_budget_category')
      .on(t.userId, t.categoryId, t.period)
      .where(sql`${t.walletId} IS NULL AND ${t.categoryId} IS NOT NULL AND ${t.deletedAt} IS NULL`),
    // 4. global (all wallets, all categories)
    uniqueIndex('ux_budget_global')
      .on(t.userId, t.period)
      .where(sql`${t.walletId} IS NULL AND ${t.categoryId} IS NULL AND ${t.deletedAt} IS NULL`),
  ]
);

// ---------------------------------------------------------------------------
// Inferred row types
// ---------------------------------------------------------------------------
export type User = typeof user.$inferSelect;
export type AppSettings = typeof settings.$inferSelect;
export type Wallet = typeof wallet.$inferSelect;
export type Category = typeof category.$inferSelect;
export type Transfer = typeof transfer.$inferSelect;
export type RecurringRule = typeof recurringRule.$inferSelect;
export type Pledge = typeof pledge.$inferSelect;
export type LedgerTransaction = typeof transaction.$inferSelect;
export type Budget = typeof budget.$inferSelect;

export const schema = {
  user,
  settings,
  wallet,
  category,
  transfer,
  recurringRule,
  pledge,
  transaction,
  budget,
};
