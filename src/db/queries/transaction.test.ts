import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { sql, type SQL } from 'drizzle-orm';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';

import { expenseSumSql, incomeSumSql, signedAmountSql } from '@/db/queries/ledger';
import { transaction, wallet } from '@/db/schema';

/**
 * Ledger contract tests.
 *
 * These run the *same* SQL fragments the app uses (`signedAmountSql`,
 * `incomeSumSql`, `expenseSumSql`) against a real SQLite engine, so a change to
 * the sign rule or the soft-delete filter breaks a test instead of silently
 * moving balances. List filters mirror `transactionsQuery` with plain SQL
 * because building that query needs the Expo driver.
 */

const DRIZZLE_DIR = path.resolve(__dirname, '../../../drizzle');
const STATEMENT_BREAKPOINT = '--> statement-breakpoint';
const dialect = new SQLiteSyncDialect();

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
    const query = statement.trim();
    if (query) database.exec(query);
  }
  return database;
}

/**
 * Fixture: ₱500 opening cash plus
 *   income ₱1,000 · expense ₱250.50 · a deleted ₱100 expense ·
 *   a ₱50 transfer to a second wallet (both legs).
 *
 * `created_at` is explicit so same-day ordering is deterministic.
 */
function seededDatabase(): DatabaseSync {
  const database = freshDatabase();

  database.exec(`
    INSERT INTO user (id, name) VALUES ('u1', 'Test');
    INSERT INTO wallet (id, user_id, name, opening_balance_centavos)
      VALUES ('w1', 'u1', 'Cash', 50000);
    INSERT INTO wallet (id, user_id, name) VALUES ('w2', 'u1', 'Bank');
    INSERT INTO category (id, user_id, name, type) VALUES ('c-in', 'u1', 'Salary', 'income');
    INSERT INTO category (id, user_id, name, type) VALUES ('c-out', 'u1', 'Food', 'expense');
    INSERT INTO transfer (id, user_id, from_wallet_id, to_wallet_id, amount_centavos, occurred_on)
      VALUES ('t1', 'u1', 'w1', 'w2', 5000, '2026-11-07');
  `);

  const insert = database.prepare(
    `INSERT INTO "transaction"
       (id, wallet_id, category_id, type, amount_centavos, occurred_on,
        description, transfer_id, deleted_at, created_at, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  type Row = [
    string, // id
    string, // wallet_id
    string | null, // category_id
    string, // type
    number, // amount_centavos
    string, // occurred_on
    string | null, // description
    string | null, // transfer_id
    string | null, // deleted_at
    string, // created_at
  ];

  const rows: Row[] = [
    ['tx-in', 'w1', 'c-in', 'income', 100000, '2026-11-05', 'November salary', null, null, '2026-11-26T00:00:01.000Z'],
    ['tx-food', 'w1', 'c-out', 'expense', 25050, '2026-11-06', 'Market run', null, null, '2026-11-26T00:00:02.000Z'],
    ['tx-gone', 'w1', 'c-out', 'expense', 10000, '2026-11-20', 'Deleted expense', null, '2026-11-21T00:00:00.000Z', '2026-11-26T00:00:03.000Z'],
    ['tx-leg-out', 'w1', null, 'transfer_out', 5000, '2026-11-07', null, 't1', null, '2026-11-26T00:00:04.000Z'],
    ['tx-leg-in', 'w2', null, 'transfer_in', 5000, '2026-11-07', null, 't1', null, '2026-11-26T00:00:05.000Z'],
  ];

  for (const row of rows) {
    insert.run(...row, 'u1');
  }

  return database;
}

/** Renders a Drizzle fragment with the app's dialect and binds its params. */
function run(database: DatabaseSync, query: SQL): Record<string, unknown> | undefined {
  const compiled = dialect.sqlToQuery(query);
  return database
    .prepare(compiled.sql)
    .get(...(compiled.params as (string | number | null)[])) as
    | Record<string, unknown>
    | undefined;
}

function walletBalance(database: DatabaseSync, walletId: string): number {
  const row = run(
    database,
    sql`
      SELECT ${wallet.openingBalanceCentavos} + ${signedAmountSql} AS balance
      FROM ${wallet}
      LEFT JOIN ${transaction}
        ON ${transaction.walletId} = ${wallet.id}
       AND ${transaction.deletedAt} IS NULL
      WHERE ${wallet.id} = ${walletId}
      GROUP BY ${wallet.id}
    `
  );

  return Number(row?.balance ?? 0);
}

describe('ledger balance rule', () => {
  it('adds income and subtracts expenses from the opening balance', () => {
    const database = seededDatabase();
    // ₱500.00 opening + ₱1,000.00 income − ₱250.50 expense − ₱50.00 transferred out
    // (the deleted row is ignored)
    expect(walletBalance(database, 'w1')).toBe(119950);
    database.close();
  });

  it('moves money between wallets without changing the total', () => {
    const database = seededDatabase();
    expect(walletBalance(database, 'w2')).toBe(5000);
    // ₱1,199.50 in cash + ₱50.00 in the bank = opening + income − expense.
    expect(walletBalance(database, 'w1') + walletBalance(database, 'w2')).toBe(124950);
    database.close();
  });

  it('ignores a soft-deleted row immediately', () => {
    const database = seededDatabase();
    database
      .prepare(
        `UPDATE "transaction" SET deleted_at = '2026-11-26T00:00:00.000Z' WHERE id = 'tx-food'`
      )
      .run();

    expect(walletBalance(database, 'w1')).toBe(145000);
    database.close();
  });
});

describe('income and expense totals', () => {
  it('sums each type for an inclusive range, excluding deleted rows and transfers', () => {
    const database = seededDatabase();
    const row = run(
      database,
      sql`
        SELECT ${incomeSumSql} AS income, ${expenseSumSql} AS expense
        FROM ${transaction}
        WHERE ${transaction.userId} = ${'u1'}
          AND ${transaction.deletedAt} IS NULL
          AND ${transaction.occurredOn} >= ${'2026-11-01'}
          AND ${transaction.occurredOn} <= ${'2026-11-30'}
      `
    );

    expect(Number(row?.income)).toBe(100000);
    expect(Number(row?.expense)).toBe(25050);
    database.close();
  });

  it('respects the range boundaries', () => {
    const database = seededDatabase();
    const row = run(
      database,
      sql`
        SELECT ${incomeSumSql} AS income, ${expenseSumSql} AS expense
        FROM ${transaction}
        WHERE ${transaction.userId} = ${'u1'}
          AND ${transaction.deletedAt} IS NULL
          AND ${transaction.occurredOn} >= ${'2026-11-06'}
          AND ${transaction.occurredOn} <= ${'2026-11-06'}
      `
    );

    expect(Number(row?.income)).toBe(0);
    expect(Number(row?.expense)).toBe(25050);
    database.close();
  });
});

describe('list filters (mirrors transactionsQuery)', () => {
  const listSql = `
    SELECT t.id
    FROM "transaction" t
    LEFT JOIN category c ON c.id = t.category_id
    WHERE t.user_id = ?
      AND t.deleted_at IS NULL
      AND (? IS NULL OR t.type = ?)
      AND (? IS NULL OR t.wallet_id = ?)
      AND (? = '' OR t.description LIKE ? OR t.note LIKE ? OR c.name LIKE ?)
    ORDER BY t.occurred_on DESC, t.created_at DESC, t.id DESC
  `;

  function list(
    database: DatabaseSync,
    filters: { type?: string | null; walletId?: string | null; search?: string }
  ): string[] {
    const type = filters.type ?? null;
    const walletId = filters.walletId ?? null;
    const search = filters.search?.trim() ?? '';
    const pattern = `%${search}%`;

    return (
      database
        .prepare(listSql)
        .all('u1', type, type, walletId, walletId, search, pattern, pattern, pattern) as {
        id: string;
      }[]
    ).map((row) => row.id);
  }

  it('lists live rows newest first', () => {
    const database = seededDatabase();
    expect(list(database, {})).toEqual(['tx-leg-in', 'tx-leg-out', 'tx-food', 'tx-in']);
    database.close();
  });

  it('filters by type', () => {
    const database = seededDatabase();
    expect(list(database, { type: 'expense' })).toEqual(['tx-food']);
    database.close();
  });

  it('filters by wallet', () => {
    const database = seededDatabase();
    expect(list(database, { walletId: 'w2' })).toEqual(['tx-leg-in']);
    database.close();
  });

  it('searches descriptions and category names', () => {
    const database = seededDatabase();
    expect(list(database, { search: 'market' })).toEqual(['tx-food']);
    expect(list(database, { search: 'food' })).toEqual(['tx-food']);
    expect(list(database, { search: 'salary' })).toEqual(['tx-in']);
    expect(list(database, { search: 'nothing' })).toEqual([]);
    database.close();
  });
});
