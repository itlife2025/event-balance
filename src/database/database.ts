import * as SQLite from 'expo-sqlite';

const DB_NAME = 'event-balance.db';

let db: SQLite.SQLiteDatabase | null = null;
let openPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (openPromise) return openPromise;
  openPromise = SQLite.openDatabaseAsync(DB_NAME).then(opened => {
    db = opened;
    return opened;
  }).finally(() => {
    openPromise = null;
  });
  return openPromise;
}

export function invalidateDbConnection(): void {
  const stale = db;
  db = null;
  if (stale) {
    stale.closeAsync().catch(() => {});
  }
}

function isTransientDbError(e: unknown): boolean {
  const s = String(e);
  return (
    s.includes('NullPointerException') ||
    s.includes('IllegalStateException') ||
    s.includes('SQLiteDatabaseLockedException') ||
    s.includes('database is locked') ||
    s.includes('already-closed') ||
    s.includes('unable to open database')
  );
}

// 일시적인 Android SQLite 오류 발생 시 연결을 재설정하고 최대 5회 재시도 (간격: 200ms, 400ms, 600ms, 800ms, 1000ms)
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isTransientDbError(e)) throw e;
      lastError = e;
      invalidateDbConnection();
      await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  // WAL 모드: 동시 읽기 허용으로 concurrent access NPE 방지
  await database.execAsync('PRAGMA journal_mode = WAL;');

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      amountType TEXT NOT NULL,
      relationship TEXT NOT NULL,
      eventRole TEXT DEFAULT '',
      memo TEXT DEFAULT ''
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      relationship TEXT DEFAULT '',
      memo TEXT DEFAULT ''
    );
  `);

  // Migration: add schedule_id column to events (links event to schedule)
  try {
    await database.execAsync(
      'ALTER TABLE events ADD COLUMN schedule_id INTEGER DEFAULT NULL'
    );
  } catch {
    // Column already exists — ignore
  }
}

export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DROP TABLE IF EXISTS events;');
  await database.execAsync('DROP TABLE IF EXISTS schedules;');
  await database.execAsync('DROP TABLE IF EXISTS metadata;');
  await initDatabase();
}
