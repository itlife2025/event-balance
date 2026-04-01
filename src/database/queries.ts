import { getDatabase } from './database';
import { EVENT_TYPE_LABELS } from '../constants/eventTypes';

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

import { EventTypeKey, resolveEventType } from '../constants/eventTypes';

const CATEGORY_ORDER: EventTypeKey[] = ['wedding', 'birth', 'firstBirthday', 'birthday', 'funeral', 'other'];
export type { EventTypeKey };

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function formatPhone(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

export interface RecentRecord {
  id: string;
  name: string;
  phone: string;
  type: EventTypeKey;
  date: string;
  amount: number;
  isSent: boolean;
}

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
    phone: string;
    type: string;
    date: string;
    amount: number;
    amountType: string;
  }>(
    `SELECT id, name, phone, type, date, amount, amountType FROM events
     WHERE date <= ?
     ORDER BY date DESC
     LIMIT ?`,
    [today, limit]
  );

  return rows.map(row => ({
    id: String(row.id),
    name: row.name,
    phone: row.phone || '',
    type: resolveEventType(row.type),
    date: formatDate(row.date),
    amount: row.amount,
    isSent: row.amountType === 'send',
  }));
}

export interface UpcomingEvent {
  id: string;
  name: string;
  phone: string;
  type: EventTypeKey;
  date: string;
  daysLeft: number;
  relationship: string;
  memo: string;
}

export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);

  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    phone: string;
    type: string;
    date: string;
    relationship: string;
    memo: string;
  }>(
    `SELECT id, name, phone, type, date, relationship, memo FROM schedules
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
      phone: row.phone || '',
      type: resolveEventType(row.type),
      date: formatDate(row.date),
      daysLeft,
      relationship: row.relationship || '',
      memo: row.memo || '',
    };
  });
}

export interface TransactionRecord {
  id: string;
  name: string;
  phone: string;
  type: EventTypeKey;
  date: string;
  rawDate: string;
  amount: number;
  isSent: boolean;
}

export async function getAvailableYears(): Promise<number[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ year: string }>(
    `SELECT DISTINCT substr(date, 1, 4) as year FROM events ORDER BY year DESC`
  );
  return rows.map(r => parseInt(r.year, 10));
}

export async function getTransactionsByYear(year: number): Promise<TransactionRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    phone: string;
    type: string;
    date: string;
    amount: number;
    amountType: string;
  }>(
    `SELECT id, name, phone, type, date, amount, amountType FROM events
     WHERE substr(date, 1, 4) = ?
     ORDER BY date DESC`,
    [String(year)]
  );

  return rows.map(row => ({
    id: String(row.id),
    name: row.name,
    phone: row.phone || '',
    type: resolveEventType(row.type),
    date: formatDate(row.date),
    rawDate: row.date,
    amount: row.amount,
    isSent: row.amountType === 'send',
  }));
}

export interface PersonDetail {
  records: {
    id: string;
    name: string;
    phone: string;
    type: EventTypeKey;
    typeName: string;
    date: string;
    amount: number;
    isSent: boolean;
    relationship: string;
    memo: string;
  }[];
  sentTotal: number;
  receivedTotal: number;
}

export async function getEventsByPhone(phone: string): Promise<PersonDetail> {
  const db = await getDatabase();
  const normalized = normalizePhone(phone);

  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    phone: string;
    type: string;
    date: string;
    amount: number;
    amountType: string;
    relationship: string;
    memo: string;
  }>(
    `SELECT id, name, phone, type, date, amount, amountType, relationship, memo FROM events
     WHERE phone = ?
     ORDER BY date DESC`,
    [normalized]
  );

  let sentTotal = 0;
  let receivedTotal = 0;
  const records = rows.map(row => {
    const isSent = row.amountType === 'send';
    if (isSent) {
      sentTotal += row.amount;
    } else {
      receivedTotal += row.amount;
    }
    return {
      id: String(row.id),
      name: row.name,
      phone: row.phone || '',
      type: resolveEventType(row.type),
      typeName: row.type,
      date: formatDate(row.date),
      amount: row.amount,
      isSent,
      relationship: row.relationship || '',
      memo: row.memo || '',
    };
  });

  return {
    records,
    sentTotal,
    receivedTotal,
  };
}

export async function getEventsByNameAndPhone(name: string, phone: string): Promise<PersonDetail> {
  const db = await getDatabase();
  const normalized = normalizePhone(phone);

  // phone 있음: 같은 이름 + (해당 전화번호 또는 전화번호 없는) 내역
  // phone 없음: 같은 이름의 모든 내역 (동명이인 포함)
  const query = normalized
    ? `SELECT id, name, phone, type, date, amount, amountType, relationship, memo FROM events
       WHERE name = ? AND (phone = ? OR phone = '')
       ORDER BY date DESC`
    : `SELECT id, name, phone, type, date, amount, amountType, relationship, memo FROM events
       WHERE name = ?
       ORDER BY date DESC`;
  const params = normalized ? [name, normalized] : [name];

  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    phone: string;
    type: string;
    date: string;
    amount: number;
    amountType: string;
    relationship: string;
    memo: string;
  }>(query, params);

  let sentTotal = 0;
  let receivedTotal = 0;
  const records = rows.map(row => {
    const isSent = row.amountType === 'send';
    if (isSent) {
      sentTotal += row.amount;
    } else {
      receivedTotal += row.amount;
    }
    return {
      id: String(row.id),
      name: row.name,
      phone: row.phone || '',
      type: resolveEventType(row.type),
      typeName: row.type,
      date: formatDate(row.date),
      amount: row.amount,
      isSent,
      relationship: row.relationship || '',
      memo: row.memo || '',
    };
  });

  return {
    records,
    sentTotal,
    receivedTotal,
  };
}

export interface EventInput {
  name: string;
  phone?: string;
  type: string;        // Korean: '결혼', '장례', etc.
  date: string;        // "YYYY-MM-DD"
  amount: number;      // in won
  amountType: 'send' | 'received';
  relationship: string;
  memo?: string;
}

export async function insertEvent(event: EventInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO events (name, phone, type, date, amount, amountType, relationship, eventRole, memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [event.name, normalizePhone(event.phone || ''), event.type, event.date, event.amount, event.amountType, event.relationship, '', event.memo || '']
  );
}

export async function updateEvent(id: string, event: EventInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE events SET name = ?, phone = ?, type = ?, date = ?, amount = ?, amountType = ?, relationship = ?, memo = ? WHERE id = ?',
    [event.name, normalizePhone(event.phone || ''), event.type, event.date, event.amount, event.amountType, event.relationship, event.memo || '', id]
  );
}

export interface ScheduleRecord {
  id: string;
  name: string;
  phone: string;
  type: string;
  date: string; // "YYYY-MM-DD"
  relationship: string;
  memo: string;
}

export async function getAllSchedules(): Promise<ScheduleRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    phone: string;
    type: string;
    date: string;
    relationship: string;
    memo: string;
  }>(
    'SELECT id, name, phone, type, date, relationship, memo FROM schedules ORDER BY date ASC'
  );
  return rows.map(row => ({
    id: String(row.id),
    name: row.name,
    phone: row.phone || '',
    type: row.type,
    date: row.date,
    relationship: row.relationship || '',
    memo: row.memo || '',
  }));
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM metadata WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function isOnboardingCompleted(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM metadata WHERE key = ?',
    ['onboarding_completed']
  );
  return row?.value === '1';
}

export async function setOnboardingCompleted(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
    ['onboarding_completed', '1']
  );
}

export interface ScheduleInput {
  name: string;
  phone?: string;
  type: string;
  date: string;
  relationship?: string;
  memo?: string;
}

export interface MonthlyStatsCategoryStat {
  type: EventTypeKey;
  label: string;
  amount: number;
  count: number;
}

export interface MonthlyStatsDetailStat {
  id: string;
  name: string;
  phone: string;
  type: EventTypeKey;
  amount: number;
  date: string;
}

export interface MonthlyStats {
  sentAmount: number;
  receivedAmount: number;
  sentCategories: MonthlyStatsCategoryStat[];
  receivedCategories: MonthlyStatsCategoryStat[];
  sentDetails: MonthlyStatsDetailStat[];
  receivedDetails: MonthlyStatsDetailStat[];
}

export async function getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
  const db = await getDatabase();
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    phone: string;
    type: string;
    date: string;
    amount: number;
    amountType: string;
  }>(
    `SELECT id, name, phone, type, date, amount, amountType FROM events
     WHERE substr(date, 1, 7) = ?
     ORDER BY date DESC`,
    [yearMonth]
  );

  const sentCatMap = new Map<string, { amount: number; count: number }>();
  const receivedCatMap = new Map<string, { amount: number; count: number }>();
  const sentDetails: MonthlyStatsDetailStat[] = [];
  const receivedDetails: MonthlyStatsDetailStat[] = [];
  let sentAmount = 0;
  let receivedAmount = 0;

  for (const row of rows) {
    const typeKey = resolveEventType(row.type);
    const isSent = row.amountType === 'send';
    const catMap = isSent ? sentCatMap : receivedCatMap;
    const existing = catMap.get(typeKey) ?? { amount: 0, count: 0 };
    catMap.set(typeKey, { amount: existing.amount + row.amount, count: existing.count + 1 });
    if (isSent) {
      sentAmount += row.amount;
      sentDetails.push({ id: String(row.id), name: row.name, phone: row.phone || '', type: typeKey, amount: row.amount, date: formatDate(row.date) });
    } else {
      receivedAmount += row.amount;
      receivedDetails.push({ id: String(row.id), name: row.name, phone: row.phone || '', type: typeKey, amount: row.amount, date: formatDate(row.date) });
    }
  }

  const toCategories = (map: Map<string, { amount: number; count: number }>): MonthlyStatsCategoryStat[] =>
    [...map.entries()]
      .map(([typeKey, data]) => ({
        type: typeKey as EventTypeKey,
        label: EVENT_TYPE_LABELS[typeKey as EventTypeKey] ?? typeKey,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.type);
        const bi = CATEGORY_ORDER.indexOf(b.type);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });

  return {
    sentAmount,
    receivedAmount,
    sentCategories: toCategories(sentCatMap),
    receivedCategories: toCategories(receivedCatMap),
    sentDetails,
    receivedDetails,
  };
}

export async function getYearlyStats(year: number): Promise<MonthlyStats> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    phone: string;
    type: string;
    date: string;
    amount: number;
    amountType: string;
  }>(
    `SELECT id, name, phone, type, date, amount, amountType FROM events
     WHERE substr(date, 1, 4) = ?
     ORDER BY date DESC`,
    [String(year)]
  );

  const sentCatMap = new Map<string, { amount: number; count: number }>();
  const receivedCatMap = new Map<string, { amount: number; count: number }>();
  const sentDetails: MonthlyStatsDetailStat[] = [];
  const receivedDetails: MonthlyStatsDetailStat[] = [];
  let sentAmount = 0;
  let receivedAmount = 0;

  for (const row of rows) {
    const typeKey = resolveEventType(row.type);
    const isSent = row.amountType === 'send';
    const catMap = isSent ? sentCatMap : receivedCatMap;
    const existing = catMap.get(typeKey) ?? { amount: 0, count: 0 };
    catMap.set(typeKey, { amount: existing.amount + row.amount, count: existing.count + 1 });
    if (isSent) {
      sentAmount += row.amount;
      sentDetails.push({ id: String(row.id), name: row.name, phone: row.phone || '', type: typeKey, amount: row.amount, date: formatDate(row.date) });
    } else {
      receivedAmount += row.amount;
      receivedDetails.push({ id: String(row.id), name: row.name, phone: row.phone || '', type: typeKey, amount: row.amount, date: formatDate(row.date) });
    }
  }

  const toCategories = (map: Map<string, { amount: number; count: number }>): MonthlyStatsCategoryStat[] =>
    [...map.entries()]
      .map(([typeKey, data]) => ({
        type: typeKey as EventTypeKey,
        label: EVENT_TYPE_LABELS[typeKey as EventTypeKey] ?? typeKey,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.type);
        const bi = CATEGORY_ORDER.indexOf(b.type);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });

  return { sentAmount, receivedAmount, sentCategories: toCategories(sentCatMap), receivedCategories: toCategories(receivedCatMap), sentDetails, receivedDetails };
}

export async function getAllStats(): Promise<MonthlyStats> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    phone: string;
    type: string;
    date: string;
    amount: number;
    amountType: string;
  }>(
    `SELECT id, name, phone, type, date, amount, amountType FROM events ORDER BY date DESC`
  );

  const sentCatMap = new Map<string, { amount: number; count: number }>();
  const receivedCatMap = new Map<string, { amount: number; count: number }>();
  const sentDetails: MonthlyStatsDetailStat[] = [];
  const receivedDetails: MonthlyStatsDetailStat[] = [];
  let sentAmount = 0;
  let receivedAmount = 0;

  for (const row of rows) {
    const typeKey = resolveEventType(row.type);
    const isSent = row.amountType === 'send';
    const catMap = isSent ? sentCatMap : receivedCatMap;
    const existing = catMap.get(typeKey) ?? { amount: 0, count: 0 };
    catMap.set(typeKey, { amount: existing.amount + row.amount, count: existing.count + 1 });
    if (isSent) {
      sentAmount += row.amount;
      sentDetails.push({ id: String(row.id), name: row.name, phone: row.phone || '', type: typeKey, amount: row.amount, date: formatDate(row.date) });
    } else {
      receivedAmount += row.amount;
      receivedDetails.push({ id: String(row.id), name: row.name, phone: row.phone || '', type: typeKey, amount: row.amount, date: formatDate(row.date) });
    }
  }

  const toCategories = (map: Map<string, { amount: number; count: number }>): MonthlyStatsCategoryStat[] =>
    [...map.entries()]
      .map(([typeKey, data]) => ({
        type: typeKey as EventTypeKey,
        label: EVENT_TYPE_LABELS[typeKey as EventTypeKey] ?? typeKey,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.type);
        const bi = CATEGORY_ORDER.indexOf(b.type);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });

  return { sentAmount, receivedAmount, sentCategories: toCategories(sentCatMap), receivedCategories: toCategories(receivedCatMap), sentDetails, receivedDetails };
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
}

export async function insertSchedule(schedule: ScheduleInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO schedules (name, phone, type, date, relationship, memo) VALUES (?, ?, ?, ?, ?, ?)',
    [schedule.name, normalizePhone(schedule.phone || ''), schedule.type, schedule.date, schedule.relationship || '', schedule.memo || '']
  );
}
