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

function freshDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  for (const statement of migrationSql().split(STATEMENT_BREAKPOINT)) {
    const query = statement.trim();
    if (query) database.exec(query);
  }
  return database;
}

describe('profile & settings persistence contract', () => {
  it('updates user name, avatar_uri, and persists theme preference on settings', () => {
    const database = freshDatabase();

    database.prepare('INSERT INTO user (id, name) VALUES (?, ?)').run('u1', 'Initial Name');
    database.prepare('INSERT INTO settings (user_id) VALUES (?)').run('u1');

    const initialSettings = database
      .prepare('SELECT theme FROM settings WHERE user_id = ?')
      .get('u1') as { theme: string };
    expect(initialSettings.theme).toBe('light');

    database
      .prepare('UPDATE user SET name = ?, avatar_uri = ? WHERE id = ? AND deleted_at IS NULL')
      .run('Grace Church', 'file:///avatars/u1.jpg', 'u1');
    database
      .prepare(
        `INSERT INTO settings (user_id, theme) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET theme = excluded.theme`
      )
      .run('u1', 'dark');

    const updatedUser = database
      .prepare('SELECT name, avatar_uri FROM user WHERE id = ?')
      .get('u1') as { name: string; avatar_uri: string | null };
    const updatedSettings = database
      .prepare('SELECT theme FROM settings WHERE user_id = ?')
      .get('u1') as { theme: string };

    expect(updatedUser.name).toBe('Grace Church');
    expect(updatedUser.avatar_uri).toBe('file:///avatars/u1.jpg');
    expect(updatedSettings.theme).toBe('dark');

    database
      .prepare('UPDATE user SET avatar_uri = NULL WHERE id = ? AND deleted_at IS NULL')
      .run('u1');

    const clearedUser = database
      .prepare('SELECT avatar_uri FROM user WHERE id = ?')
      .get('u1') as { avatar_uri: string | null };
    expect(clearedUser.avatar_uri).toBeNull();

    database.close();
  });
});
