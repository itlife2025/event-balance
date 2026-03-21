import mockEvents from '../data/mockEvents.json';

interface ScheduleStoreRecord {
  id: number;
  name: string;
  phone: string;
  type: string;
  date: string;
  relationship: string;
  memo: string;
}

interface EventStoreRecord {
  id: number;
  name: string;
  phone: string;
  type: string;
  date: string;
  amount: number;
  amountType: string;
  relationship: string;
  memo: string;
}

const schedulesStore: ScheduleStoreRecord[] = [];
let scheduleNextId = 1;

const eventsStore: EventStoreRecord[] = [];
let eventNextId = 1;

export interface YearlyTotals {
  sentAmount: number;
  receivedAmount: number;
}

export interface MonthlyData {
  month: string;
  sent: number;
  received: number;
}

import { EventTypeKey, resolveEventType } from '../constants/eventTypes';
export type { EventTypeKey };

export interface RecentRecord {
  id: string;
  name: string;
  phone: string;
  type: EventTypeKey;
  date: string;
  amount: number;
  isSent: boolean;
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


function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day} (${days[d.getDay()]})`;
}

export async function getYearlyTotals(year: number): Promise<YearlyTotals> {
  const yearStr = String(year);
  let sentAmount = 0;
  let receivedAmount = 0;

  for (const e of mockEvents as any[]) {
    if ((e as any).isSchedule) continue;
    if (e.date.substring(0, 4) !== yearStr) continue;
    if (e.amountType === 'send') {
      sentAmount += e.amount;
    } else {
      receivedAmount += e.amount;
    }
  }

  for (const e of eventsStore) {
    if (e.date.substring(0, 4) !== yearStr) continue;
    if (e.amountType === 'send') {
      sentAmount += e.amount;
    } else {
      receivedAmount += e.amount;
    }
  }

  return { sentAmount, receivedAmount };
}

export async function getMonthlyBreakdown(year: number): Promise<MonthlyData[]> {
  const yearStr = String(year);
  const monthMap = new Map<number, { sent: number; received: number }>();

  for (let m = 1; m <= 12; m++) {
    monthMap.set(m, { sent: 0, received: 0 });
  }

  for (const e of mockEvents as any[]) {
    if ((e as any).isSchedule) continue;
    if (e.date.substring(0, 4) !== yearStr) continue;
    const month = parseInt(e.date.substring(5, 7), 10);
    const entry = monthMap.get(month)!;
    if (e.amountType === 'send') {
      entry.sent += e.amount;
    } else {
      entry.received += e.amount;
    }
  }

  for (const e of eventsStore) {
    if (e.date.substring(0, 4) !== yearStr) continue;
    const month = parseInt(e.date.substring(5, 7), 10);
    const entry = monthMap.get(month)!;
    if (e.amountType === 'send') {
      entry.sent += e.amount;
    } else {
      entry.received += e.amount;
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

export async function getRecentRecords(limit: number = 3): Promise<RecentRecord[]> {
  const today = new Date().toISOString().slice(0, 10);

  const mockRecords = (mockEvents as any[])
    .filter((e: any) => !e.isSchedule && e.date <= today)
    .map((e: any) => ({
      name: e.name,
      phone: e.phone || '',
      type: e.type,
      date: e.date,
      amount: e.amount,
      amountType: e.amountType,
    }));

  const userRecords = eventsStore
    .filter(e => e.date <= today)
    .map(e => ({
      name: e.name,
      phone: e.phone || '',
      type: e.type,
      date: e.date,
      amount: e.amount,
      amountType: e.amountType,
    }));

  return [...mockRecords, ...userRecords]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((e, i) => ({
      id: String(i + 1),
      name: e.name,
      phone: e.phone,
      type: resolveEventType(e.type),
      date: formatDate(e.date),
      amount: e.amount,
      isSent: e.amountType === 'send',
    }));
}

export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Combine mock schedule entries and user-added schedules
  const mockSchedules = (mockEvents as any[])
    .filter((e: any) => e.isSchedule && e.date >= today)
    .map((e: any, i: number) => ({
      id: `mock-${i}`,
      name: e.name,
      phone: ((e as any).phone || '').replace(/[^0-9]/g, ''),
      type: resolveEventType(e.type),
      date: formatDate(e.date),
      daysLeft: Math.ceil((new Date(e.date).setHours(0,0,0,0) - now.getTime()) / (1000 * 60 * 60 * 24)),
      relationship: e.relationship || '',
      memo: e.memo || '',
    }));

  const userSchedules = schedulesStore
    .filter(s => s.date >= today)
    .map(s => {
      const eventDate = new Date(s.date);
      eventDate.setHours(0, 0, 0, 0);
      const diffMs = eventDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: String(s.id),
        name: s.name,
        phone: (s.phone || '').replace(/[^0-9]/g, ''),
        type: resolveEventType(s.type),
        date: formatDate(s.date),
        daysLeft,
        relationship: s.relationship,
        memo: s.memo,
      };
    });

  return [...mockSchedules, ...userSchedules].sort((a, b) => a.daysLeft - b.daysLeft);
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
  const yearsSet = new Set<number>();
  for (const e of mockEvents as any[]) {
    if (e.isSchedule) continue;
    yearsSet.add(parseInt(e.date.substring(0, 4), 10));
  }
  for (const e of eventsStore) {
    yearsSet.add(parseInt(e.date.substring(0, 4), 10));
  }
  return [...yearsSet].sort((a, b) => b - a);
}

export async function getTransactionsByYear(year: number): Promise<TransactionRecord[]> {
  const yearStr = String(year);
  const all: TransactionRecord[] = [];

  (mockEvents as any[])
    .filter((e: any) => !e.isSchedule && e.date.substring(0, 4) === yearStr)
    .forEach((e: any, i: number) => {
      all.push({
        id: `mock-${i}`,
        name: e.name,
        phone: e.phone || '',
        type: resolveEventType(e.type),
        date: formatDate(e.date),
        rawDate: e.date,
        amount: e.amount,
        isSent: e.amountType === 'send',
      });
    });

  eventsStore
    .filter(e => e.date.substring(0, 4) === yearStr)
    .forEach(e => {
      all.push({
        id: String(e.id),
        name: e.name,
        phone: e.phone || '',
        type: resolveEventType(e.type),
        date: formatDate(e.date),
        rawDate: e.date,
        amount: e.amount,
        isSent: e.amountType === 'send',
      });
    });

  return all.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
}

export interface PersonDetail {
  records: {
    id: string;
    type: EventTypeKey;
    typeName: string;
    date: string;
    amount: number;
    isSent: boolean;
    relationship: string;
  }[];
  sentTotal: number;
  receivedTotal: number;
}

export async function getEventsByPhone(phone: string): Promise<PersonDetail> {
  const allEvents = [
    ...(mockEvents as any[]).filter((e: any) => !e.isSchedule && e.phone === phone).map((e: any, i: number) => ({
      id: `mock-${i}`,
      type: e.type,
      date: e.date,
      amount: e.amount,
      amountType: e.amountType,
      relationship: e.relationship || '',
    })),
    ...eventsStore.filter(e => e.phone === phone).map(e => ({
      id: String(e.id),
      type: e.type,
      date: e.date,
      amount: e.amount,
      amountType: e.amountType,
      relationship: e.relationship,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  let sentTotal = 0;
  let receivedTotal = 0;
  const records = allEvents.map(row => {
    const isSent = row.amountType === 'send';
    if (isSent) sentTotal += row.amount;
    else receivedTotal += row.amount;
    return {
      id: row.id,
      type: resolveEventType(row.type),
      typeName: row.type,
      date: formatDate(row.date),
      amount: row.amount,
      isSent,
      relationship: row.relationship,
    };
  });

  return { records, sentTotal, receivedTotal };
}

export interface EventInput {
  name: string;
  phone?: string;
  type: string;
  date: string; // "YYYY-MM-DD"
  amount: number;
  amountType: 'send' | 'received';
  relationship: string;
  memo?: string;
}

export async function insertEvent(event: EventInput): Promise<void> {
  eventsStore.push({
    id: eventNextId++,
    name: event.name,
    phone: event.phone || '',
    type: event.type,
    date: event.date,
    amount: event.amount,
    amountType: event.amountType,
    relationship: event.relationship,
    memo: event.memo || '',
  });
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
  const mockSchedules = (mockEvents as any[])
    .filter((e: any) => e.isSchedule)
    .map((e: any, i: number) => ({
      id: `mock-${i}`,
      name: e.name,
      phone: e.phone || '',
      type: e.type,
      date: e.date,
      relationship: e.relationship || '',
      memo: e.memo || '',
    }));

  const userSchedules = schedulesStore.map(s => ({
    id: String(s.id),
    name: s.name,
    phone: s.phone || '',
    type: s.type,
    date: s.date,
    relationship: s.relationship,
    memo: s.memo,
  }));

  return [...mockSchedules, ...userSchedules].sort((a, b) => a.date.localeCompare(b.date));
}

export interface ScheduleInput {
  name: string;
  phone?: string;
  type: string;
  date: string;
  relationship?: string;
  memo?: string;
}

export async function insertSchedule(schedule: ScheduleInput): Promise<void> {
  schedulesStore.push({
    id: scheduleNextId++,
    name: schedule.name,
    phone: schedule.phone || '',
    type: schedule.type,
    date: schedule.date,
    relationship: schedule.relationship || '',
    memo: schedule.memo || '',
  });
}
