import * as SQLite from 'expo-sqlite';
import seedRecordsJson from '../data/mockEvents.json';

const DB_NAME = 'event-balance.db';
const SEED_VERSION = 20;

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

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

  const versionRow = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM metadata WHERE key = ?',
    ['seed_version']
  );

  if (!versionRow || parseInt(versionRow.value, 10) < SEED_VERSION) {
    await seedData(database);
  }
}

async function seedData(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`DROP TABLE IF EXISTS events;`);
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

  const eventRecords = seedRecordsJson.filter((r: any) => !r.isSchedule);
  const scheduleRecords = seedRecordsJson.filter((r: any) => r.isSchedule);

  for (const record of eventRecords) {
    await database.runAsync(
      'INSERT INTO events (name, phone, type, date, amount, amountType, relationship, eventRole, memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [record.name, ((record as any).phone || '').replace(/[^0-9]/g, ''), record.type, record.date, record.amount, record.amountType, record.relationship, (record as any).eventRole || '', record.memo]
    );
  }

  await database.execAsync(`DROP TABLE IF EXISTS schedules;`);
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
  for (const record of scheduleRecords) {
    await database.runAsync(
      'INSERT INTO schedules (name, phone, type, date, relationship, memo) VALUES (?, ?, ?, ?, ?, ?)',
      [record.name, ((record as any).phone || '').replace(/[^0-9]/g, ''), record.type, record.date, record.relationship || '', record.memo]
    );
  }

  await database.runAsync(
    'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
    ['seed_version', String(SEED_VERSION)]
  );
}

export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DROP TABLE IF EXISTS events;');
  await database.execAsync('DROP TABLE IF EXISTS schedules;');
  await database.execAsync('DROP TABLE IF EXISTS metadata;');
  await initDatabase();
}
