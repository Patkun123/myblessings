import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import { schema } from './schema';

export const DATABASE_NAME = 'myblessings.db';

function createDatabase(expoDatabase: SQLite.SQLiteDatabase) {
  return drizzle(expoDatabase, { schema });
}

export type AppDatabase = ReturnType<typeof createDatabase>;

let instance: AppDatabase | null = null;
let expoInstance: SQLite.SQLiteDatabase | null = null;
let opening: Promise<AppDatabase> | null = null;

/**
 * Opens the database once and configures the connection.
 *
 * Deliberately async on every platform. On web, SQLite lives in a Web Worker
 * that only starts on the next tick, and Drizzle's Expo driver is synchronous
 * (`prepareSync`/`executeSync`), so opening at module scope throws
 * "The SQLite web worker has not finished loading". Awaiting
 * `openDatabaseAsync()` is the documented way to make the worker ready.
 *
 * PRAGMAs must run on this connection: `foreign_keys` is per-connection and is
 * a no-op inside a transaction, and `withExclusiveTransactionAsync()` would
 * open a second connection that loses it. Use `withTransactionAsync()` for
 * transfers.
 */
export function openAppDatabase(): Promise<AppDatabase> {
  if (instance) return Promise.resolve(instance);
  if (opening) return opening;

  const pending = (async () => {
    const expoDatabase = await SQLite.openDatabaseAsync(DATABASE_NAME, {
      enableChangeListener: true,
    });

    await expoDatabase.execAsync('PRAGMA journal_mode = WAL');
    await expoDatabase.execAsync('PRAGMA foreign_keys = ON');

    expoInstance = expoDatabase;
    instance = createDatabase(expoDatabase);
    return instance;
  })();

  opening = pending;
  // Let a failed open be retried instead of caching the rejection forever.
  pending.catch(() => {
    if (opening === pending) opening = null;
  });

  return pending;
}

/** The shared Drizzle client. Throws until `openAppDatabase()` has resolved. */
export function getDb(): AppDatabase {
  if (!instance) {
    throw new Error('Database is not open yet. Await openAppDatabase() before querying.');
  }
  return instance;
}

export function isDatabaseOpen(): boolean {
  return instance !== null;
}

/** Raw expo-sqlite connection, for PRAGMA diagnostics and maintenance. */
export function getExpoDatabase(): SQLite.SQLiteDatabase {
  if (!expoInstance) {
    throw new Error('Database is not open yet. Await openAppDatabase() before querying.');
  }
  return expoInstance;
}

/** Verifies foreign key enforcement — used by diagnostics and tests. */
export function readForeignKeysPragma(): number {
  const row = getExpoDatabase().getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys');
  return row?.foreign_keys ?? 0;
}
