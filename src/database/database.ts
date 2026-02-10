import * as SQLite from 'expo-sqlite';

const DB_NAME = 'event-balance.db';
const SEED_VERSION = 7;

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
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      amountType TEXT NOT NULL,
      relationship TEXT NOT NULL,
      eventRole TEXT DEFAULT '',
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
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      amountType TEXT NOT NULL,
      relationship TEXT NOT NULL,
      eventRole TEXT DEFAULT '',
      memo TEXT DEFAULT ''
    );
  `);

  const seedRecords = [
    { name: '김민준', type: '결혼', date: '2023-02-18', amount: 100000, amountType: 'send', relationship: '친구', eventRole: '', memo: '' },
    { name: '이서연', type: '돌', date: '2023-04-09', amount: 50000, amountType: 'received', relationship: '지인', eventRole: '', memo: '아이 돌잔치' },
    { name: '박도윤', type: '결혼', date: '2023-07-22', amount: 150000, amountType: 'send', relationship: '가족', eventRole: '', memo: '' },
    { name: '김하은', type: '장례', date: '2023-09-03', amount: 100000, amountType: 'send', relationship: '직장', eventRole: '', memo: '' },
    { name: '이준우', type: '기타', date: '2023-11-27', amount: 30000, amountType: 'received', relationship: '친구', eventRole: '', memo: '개업 축하' },
    { name: '박수아', type: '결혼', date: '2024-01-13', amount: 50000, amountType: 'send', relationship: '직장', eventRole: '', memo: '' },
    { name: '김도윤', type: '돌', date: '2024-03-24', amount: 70000, amountType: 'received', relationship: '친구', eventRole: '', memo: '' },
    { name: '이지아', type: '결혼', date: '2024-05-11', amount: 50000, amountType: 'send', relationship: '직장', eventRole: '', memo: '사정상 참석 불가' },
    { name: '박현우', type: '장례', date: '2024-06-30', amount: 100000, amountType: 'send', relationship: '지인', eventRole: '', memo: '' },
    { name: '김채원', type: '기타', date: '2024-08-19', amount: 50000, amountType: 'received', relationship: '친구', eventRole: '', memo: '집들이' },
    { name: '이민준', type: '결혼', date: '2024-10-05', amount: 200000, amountType: 'send', relationship: '가족', eventRole: '', memo: '' },
    { name: '박하린', type: '돌', date: '2024-12-14', amount: 50000, amountType: 'received', relationship: '지인', eventRole: '', memo: '' },
    { name: '김지훈', type: '장례', date: '2025-01-26', amount: 100000, amountType: 'send', relationship: '직장', eventRole: '', memo: '' },
    { name: '이윤서', type: '결혼', date: '2025-03-08', amount: 100000, amountType: 'send', relationship: '친구', eventRole: '', memo: '' },
    { name: '박서준', type: '생일', date: '2025-05-21', amount: 30000, amountType: 'received', relationship: '지인', eventRole: '', memo: '' },
    { name: '김지안', type: '생일', date: '2025-07-02', amount: 70000, amountType: 'received', relationship: '친구', eventRole: '', memo: '' },
    { name: '이시우', type: '결혼', date: '2025-08-22', amount: 100000, amountType: 'send', relationship: '가족', eventRole: '', memo: '' },
    { name: '박예린', type: '기타', date: '2025-10-11', amount: 50000, amountType: 'received', relationship: '친구', eventRole: '', memo: '출산 축하' },
    { name: '김준서', type: '장례', date: '2025-12-03', amount: 100000, amountType: 'send', relationship: '지인', eventRole: '', memo: '' },
    { name: '이아린', type: '결혼', date: '2026-02-07', amount: 150000, amountType: 'send', relationship: '친구', eventRole: '', memo: '' },
    { name: '최은우', type: '결혼', date: '2023-01-29', amount: 70000, amountType: 'send', relationship: '지인', eventRole: '', memo: '' },
    { name: '정다은', type: '기타', date: '2023-06-11', amount: 30000, amountType: 'received', relationship: '친구', eventRole: '', memo: '카페 오픈 축하' },
    { name: '오지훈', type: '장례', date: '2023-12-02', amount: 100000, amountType: 'send', relationship: '가족', eventRole: '', memo: '' },
    { name: '한유진', type: '생일', date: '2024-02-04', amount: 50000, amountType: 'received', relationship: '지인', eventRole: '', memo: '' },
    { name: '윤태호', type: '결혼', date: '2024-07-07', amount: 150000, amountType: 'send', relationship: '친구', eventRole: '', memo: '' },
    { name: '신예원', type: '기타', date: '2024-11-23', amount: 50000, amountType: 'received', relationship: '직장', eventRole: '', memo: '퇴사 기념 선물' },
    { name: '장우성', type: '장례', date: '2025-02-15', amount: 100000, amountType: 'send', relationship: '지인', eventRole: '', memo: '' },
    { name: '문서현', type: '결혼', date: '2025-06-18', amount: 200000, amountType: 'received', relationship: '가족', eventRole: '', memo: '' },
    { name: '배나연', type: '돌', date: '2025-09-09', amount: 70000, amountType: 'received', relationship: '친구', eventRole: '', memo: '' },
    { name: '임준혁', type: '생일', date: '2026-01-12', amount: 30000, amountType: 'send', relationship: '직장', eventRole: '', memo: '' },
    { name: '김서영', type: '기타', date: '2026-03-14', amount: 0, amountType: 'send', relationship: '친구', eventRole: 'host', memo: '집들이 모임 주최' },
    { name: '박진우', type: '결혼', date: '2026-04-18', amount: 0, amountType: 'send', relationship: '직장', eventRole: 'attend', memo: '' },
    { name: '이소민', type: '기타', date: '2026-05-02', amount: 0, amountType: 'send', relationship: '지인', eventRole: 'attend', memo: '출판 기념회 참석' },
    { name: '최현수', type: '돌', date: '2026-06-21', amount: 0, amountType: 'send', relationship: '친구', eventRole: 'attend', memo: '' },
  ];

  for (const record of seedRecords) {
    await database.runAsync(
      'INSERT INTO events (name, type, date, amount, amountType, relationship, eventRole, memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [record.name, record.type, record.date, record.amount, record.amountType, record.relationship, record.eventRole, record.memo]
    );
  }

  await database.runAsync(
    'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
    ['seed_version', String(SEED_VERSION)]
  );
}
