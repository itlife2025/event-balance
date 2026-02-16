import { getDatabase } from './database';

export interface YearlyTotals {
  sentAmount: number;
  receivedAmount: number;
}

export interface MonthlyData {
  month: string;
  sent: number;
  received: number;
}

export async function getYearlyTotals(year: number): Promise<YearlyTotals> {
  const db = await getDatabase();

  const sentRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM events
     WHERE substr(date, 1, 4) = ? AND amountType = 'send'`,
    [String(year)]
  );

  const receivedRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM events
     WHERE substr(date, 1, 4) = ? AND amountType = 'received'`,
    [String(year)]
  );

  return {
    sentAmount: sentRow?.total ?? 0,
    receivedAmount: receivedRow?.total ?? 0,
  };
}

export async function getMonthlyBreakdown(year: number): Promise<MonthlyData[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    month: number;
    amountType: string;
    total: number;
  }>(
    `SELECT CAST(substr(date, 6, 2) AS INTEGER) as month, amountType, SUM(amount) as total
     FROM events
     WHERE substr(date, 1, 4) = ?
     GROUP BY month, amountType
     ORDER BY month`,
    [String(year)]
  );

  const monthMap = new Map<number, { sent: number; received: number }>();

  for (let m = 1; m <= 12; m++) {
    monthMap.set(m, { sent: 0, received: 0 });
  }

  for (const row of rows) {
    const entry = monthMap.get(row.month)!;
    if (row.amountType === 'send') {
      entry.sent = row.total;
    } else {
      entry.received = row.total;
    }
  }

  const result: MonthlyData[] = [];
  for (let m = 1; m <= 12; m++) {
    const data = monthMap.get(m)!;
    result.push({
      month: `${m}월`,
      sent: data.sent,
      received: data.received,
    });
  }

  return result;
}

type EventTypeKey = 'wedding' | 'funeral' | 'birthday' | 'firstBirthday' | 'other';

export interface RecentRecord {
  id: string;
  name: string;
  type: EventTypeKey;
  date: string;
  amount: number;
  isSent: boolean;
}

const typeMap: Record<string, EventTypeKey> = {
  '결혼': 'wedding',
  '장례': 'funeral',
  '생일': 'birthday',
  '돌': 'firstBirthday',
  '기타': 'other',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day} (${days[d.getDay()]})`;
}

export async function getRecentRecords(limit: number = 3): Promise<RecentRecord[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);

  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    type: string;
    date: string;
    amount: number;
    amountType: string;
  }>(
    `SELECT id, name, type, date, amount, amountType FROM events
     WHERE date <= ?
     ORDER BY date DESC
     LIMIT ?`,
    [today, limit]
  );

  return rows.map(row => ({
    id: String(row.id),
    name: row.name,
    type: typeMap[row.type] ?? 'other',
    date: formatDate(row.date),
    amount: row.amount,
    isSent: row.amountType === 'send',
  }));
}

export interface UpcomingEvent {
  id: string;
  name: string;
  type: EventTypeKey;
  date: string;
  daysLeft: number;
}

export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);

  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    type: string;
    date: string;
  }>(
    `SELECT id, name, type, date FROM schedules
     WHERE date >= ?
     ORDER BY date ASC`,
    [today]
  );

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return rows.map(row => {
    const eventDate = new Date(row.date);
    eventDate.setHours(0, 0, 0, 0);
    const diffMs = eventDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      id: String(row.id),
      name: row.name,
      type: typeMap[row.type] ?? 'other',
      date: formatDate(row.date),
      daysLeft,
    };
  });
}

export interface ScheduleInput {
  name: string;
  type: string;
  date: string;
  relationship?: string;
  memo?: string;
}

export async function insertSchedule(schedule: ScheduleInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO schedules (name, type, date, relationship, memo) VALUES (?, ?, ?, ?, ?)',
    [schedule.name, schedule.type, schedule.date, schedule.relationship || '', schedule.memo || '']
  );
}
