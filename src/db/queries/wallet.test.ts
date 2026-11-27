import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DRIZZLE_DIR = path.resolve(__dirname, '../../../drizzle');
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

function seededDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  for (const statement of migrationSql().split(STATEMENT_BREAKPOINT)) {
    const query = statement.trim();
    if (query) database.exec(query);
  }

  database.exec(`
    INSERT INTO user (id, name) VALUES ('u1', 'Test');
    INSERT INTO wallet (id, user_id, name, icon, color, opening_balance_centavos, sort_order)
      VALUES ('w1', 'u1', 'Cash', 'cash', '#8A5410', 50000, 0),
             ('w2', 'u1', 'Bank', 'business', '#5F5449', 100000, 1);
    INSERT INTO category (id, user_id, name, type) VALUES ('c-out', 'u1', 'Food', 'expense');
    INSERT INTO "transaction"
      (id, user_id, wallet_id, category_id, type, amount_centavos, occurred_on, deleted_at)
      VALUES ('tx-live', 'u1', 'w2', 'c-out', 'expense', 25000, '2026-11-27', NULL),
             ('tx-old-deleted', 'u1', 'w2', 'c-out', 'expense', 10000, '2026-11-26', '2026-11-26T00:00:00.000Z');
  `);

  return database;
}

describe('wallet edit and soft-delete contract', () => {
  it('updates wallet fields without losing existing balance math', () => {
    const database = seededDatabase();
    database
      .prepare(
        `UPDATE wallet SET name = ?, opening_balance_centavos = ?, icon = ?, color = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
      )
      .run('GCash', 75000, 'phone-portrait', '#8A5410', 'w1', 'u1');

    const row = database
      .prepare(`SELECT name, opening_balance_centavos, icon FROM wallet WHERE id = 'w1'`)
      .get() as { name: string; opening_balance_centavos: number; icon: string };

    expect(row).toEqual({
      name: 'GCash',
      opening_balance_centavos: 75000,
      icon: 'phone-portrait',
    });
    database.close();
  });

  it('soft-deletes a wallet and only its live transactions, and restores only those on undo', () => {
    const database = seededDatabase();

    // Capture live transactions for w2 before deleting (mirrors softDeleteWalletWithTransactions).
    const liveIds = (
      database
        .prepare(
          `SELECT id FROM "transaction" WHERE user_id = ? AND wallet_id = ? AND deleted_at IS NULL`
        )
        .all('u1', 'w2') as { id: string }[]
    ).map((r) => r.id);

    expect(liveIds).toEqual(['tx-live']);

    const now = '2026-11-27T01:00:00.000Z';
    database
      .prepare(`UPDATE "transaction" SET deleted_at = ? WHERE user_id = ? AND id = ?`)
      .run(now, 'u1', 'tx-live');
    database
      .prepare(`UPDATE wallet SET deleted_at = ? WHERE user_id = ? AND id = ? AND deleted_at IS NULL`)
      .run(now, 'u1', 'w2');

    const activeAfterDelete = database
      .prepare(`SELECT COUNT(*) AS count FROM wallet WHERE user_id = 'u1' AND is_archived = 0 AND deleted_at IS NULL`)
      .get() as { count: number };
    expect(activeAfterDelete.count).toBe(1);

    // Undo restores w2 and tx-live, while tx-old-deleted stays deleted.
    database.prepare(`UPDATE wallet SET deleted_at = NULL WHERE user_id = ? AND id = ?`).run('u1', 'w2');
    database
      .prepare(`UPDATE "transaction" SET deleted_at = NULL WHERE user_id = ? AND id = ?`)
      .run('u1', 'tx-live');

    const txRows = database
      .prepare(`SELECT id, deleted_at FROM "transaction" WHERE wallet_id = 'w2' ORDER BY id`)
      .all() as { id: string; deleted_at: string | null }[];

    expect(txRows).toEqual([
      { id: 'tx-live', deleted_at: null },
      { id: 'tx-old-deleted', deleted_at: '2026-11-26T00:00:00.000Z' },
    ]);
    database.close();
  });
});
