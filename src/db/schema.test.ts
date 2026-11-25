import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * Applies the generated Drizzle migration to a real SQLite engine (Node's
 * built-in) and asserts the invariants that the whole app relies on:
 * foreign keys, money checks, date format, and the partial unique indexes.
 *
 * This is the "migrations apply on a fresh install" gate for Phase 1.
 */

const DRIZZLE_DIR = path.resolve(__dirname, '../../drizzle');
const STATEMENT_BREAKPOINT = '--> statement-breakpoint';

function migrationSql(): string {
  const files = fs
    .readdirSync(DRIZZLE_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
  if (files.length === 0) throw new Error('No migration files found in /drizzle');
  return files
    .map((file) => fs.readFileSync(path.join(DRIZZLE_DIR, file), 'utf8'))
    .join(`\n${STATEMENT_BREAKPOINT}\n`);
}

function freshDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  for (const statement of migrationSql().split(STATEMENT_BREAKPOINT)) {
    const sql = statement.trim();
    if (sql) database.exec(sql);
  }
  return database;
}

function seedUserAndWallet(database: DatabaseSync): { userId: string; walletId: string } {
  const userId = 'user-1';
  const walletId = 'wallet-1';
  database
    .prepare('INSERT INTO user (id, name) VALUES (?, ?)')
    .run(userId, 'Test User');
  database
    .prepare('INSERT INTO wallet (id, user_id, name) VALUES (?, ?, ?)')
    .run(walletId, userId, 'Cash');
  return { userId, walletId };
}

function insertTransaction(
  database: DatabaseSync,
  values: {
    id?: string;
    userId: string;
    walletId: string;
    type?: string;
    amount?: number;
    occurredOn?: string;
    transferId?: string | null;
    recurringId?: string | null;
    recurrenceOccurrence?: string | null;
    categoryId?: string | null;
  }
): void {
  database
    .prepare(
      `INSERT INTO "transaction"
        (id, user_id, wallet_id, category_id, type, amount_centavos, occurred_on,
         transfer_id, recurring_id, recurrence_occurrence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      values.id ?? `txn-${Math.random()}`,
      values.userId,
      values.walletId,
      values.categoryId ?? null,
      values.type ?? 'expense',
      values.amount ?? 1000,
      values.occurredOn ?? '2026-11-26',
      values.transferId ?? null,
      values.recurringId ?? null,
      values.recurrenceOccurrence ?? null
    );
}

describe('schema migration', () => {
  it('creates every table', () => {
    const database = freshDatabase();
    const rows = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];
    const names = rows.map((row) => row.name).sort();

    expect(names).toEqual([
      'budget',
      'category',
      'pledge',
      'recurring_rule',
      'settings',
      'transaction',
      'transfer',
      'user',
      'wallet',
    ]);
    database.close();
  });

  it('enforces foreign keys', () => {
    const database = freshDatabase();
    const { userId } = seedUserAndWallet(database);

    expect(() =>
      insertTransaction(database, { userId, walletId: 'missing-wallet' })
    ).toThrow(/FOREIGN KEY/i);
    database.close();
  });

  it('rejects non-positive amounts', () => {
    const database = freshDatabase();
    const { userId, walletId } = seedUserAndWallet(database);

    expect(() => insertTransaction(database, { userId, walletId, amount: 0 })).toThrow(/CHECK/i);
    expect(() => insertTransaction(database, { userId, walletId, amount: -1 })).toThrow(/CHECK/i);
    database.close();
  });

  it('rejects malformed calendar dates', () => {
    const database = freshDatabase();
    const { userId, walletId } = seedUserAndWallet(database);

    expect(() =>
      insertTransaction(database, { userId, walletId, occurredOn: '2026-1-1' })
    ).toThrow(/CHECK/i);
    expect(() =>
      insertTransaction(database, { userId, walletId, occurredOn: '11/26/2026' })
    ).toThrow(/CHECK/i);
    database.close();
  });

  it('keeps one transfer leg of each direction', () => {
    const database = freshDatabase();
    const { userId, walletId } = seedUserAndWallet(database);
    database
      .prepare('INSERT INTO wallet (id, user_id, name) VALUES (?, ?, ?)')
      .run('wallet-2', userId, 'Savings');
    database
      .prepare(
        `INSERT INTO transfer (id, user_id, from_wallet_id, to_wallet_id, amount_centavos, occurred_on)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run('transfer-1', userId, walletId, 'wallet-2', 5000, '2026-11-26');

    insertTransaction(database, {
      userId,
      walletId,
      type: 'transfer_out',
      transferId: 'transfer-1',
    });
    insertTransaction(database, {
      userId,
      walletId: 'wallet-2',
      type: 'transfer_in',
      transferId: 'transfer-1',
    });

    expect(() =>
      insertTransaction(database, {
        userId,
        walletId,
        type: 'transfer_out',
        transferId: 'transfer-1',
      })
    ).toThrow(/UNIQUE/i);

    // A transfer cannot move money to itself.
    expect(() =>
      database
        .prepare(
          `INSERT INTO transfer (id, user_id, from_wallet_id, to_wallet_id, amount_centavos, occurred_on)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run('transfer-2', userId, walletId, walletId, 100, '2026-11-26')
    ).toThrow(/CHECK/i);

    database.close();
  });

  it('guards against duplicate recurring occurrences', () => {
    const database = freshDatabase();
    const { userId, walletId } = seedUserAndWallet(database);
    database
      .prepare(
        `INSERT INTO recurring_rule
          (id, user_id, wallet_id, type, amount_centavos, frequency, start_date, next_occurrence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run('rule-1', userId, walletId, 'income', 500000, 'monthly', '2026-11-01', '2026-11-01');

    const generate = () =>
      insertTransaction(database, {
        userId,
        walletId,
        type: 'income',
        recurringId: 'rule-1',
        recurrenceOccurrence: '2026-11-01',
      });

    generate();
    expect(generate).toThrow(/UNIQUE/i);

    // A different occurrence is allowed.
    insertTransaction(database, {
      userId,
      walletId,
      type: 'income',
      recurringId: 'rule-1',
      recurrenceOccurrence: '2026-12-01',
    });

    database.close();
  });

  it('scopes category names per profile, type, and only while live', () => {
    const database = freshDatabase();
    const { userId } = seedUserAndWallet(database);
    const insertCategory = (id: string, name: string, deletedAt: string | null = null) =>
      database
        .prepare(
          `INSERT INTO category (id, user_id, name, type, deleted_at)
           VALUES (?, ?, ?, 'expense', ?)`
        )
        .run(id, userId, name, deletedAt);

    insertCategory('c1', 'Food');
    expect(() => insertCategory('c2', 'Food')).toThrow(/UNIQUE/i);

    // A soft-deleted row does not occupy the name.
    insertCategory('c3', 'Food', '2026-11-01T00:00:00.000Z');

    // Soft-deleting the live row frees the name for reuse.
    database.prepare('UPDATE category SET deleted_at = ? WHERE id = ?').run('2026-11-02T00:00:00.000Z', 'c1');
    insertCategory('c4', 'Food');

    // ...but only one live row may hold it.
    expect(() => insertCategory('c5', 'Food')).toThrow(/UNIQUE/i);
    database.close();
  });

  it('prevents duplicate budgets in every scope shape', () => {
    const database = freshDatabase();
    const { userId } = seedUserAndWallet(database);
    database
      .prepare('INSERT INTO category (id, user_id, name, type) VALUES (?, ?, ?, ?)')
      .run('cat-1', userId, 'Food', 'expense');

    const insertBudget = (id: string, walletId: string | null, categoryId: string | null) =>
      database
        .prepare(
          `INSERT INTO budget (id, user_id, wallet_id, category_id, limit_centavos, period, start_date)
           VALUES (?, ?, ?, ?, ?, 'monthly', '2026-11-01')`
        )
        .run(id, userId, walletId, categoryId, 100000);

    // Global budget (all wallets, all categories).
    insertBudget('b1', null, null);
    expect(() => insertBudget('b2', null, null)).toThrow(/UNIQUE/i);

    // Wallet only.
    insertBudget('b3', 'wallet-1', null);
    expect(() => insertBudget('b4', 'wallet-1', null)).toThrow(/UNIQUE/i);

    // Category only.
    insertBudget('b5', null, 'cat-1');
    expect(() => insertBudget('b6', null, 'cat-1')).toThrow(/UNIQUE/i);

    // Wallet + category.
    insertBudget('b7', 'wallet-1', 'cat-1');
    expect(() => insertBudget('b8', 'wallet-1', 'cat-1')).toThrow(/UNIQUE/i);

    database.close();
  });
});
