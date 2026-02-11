import * as SQLite from 'expo-sqlite';
import { EventType } from '../components/UpcomingEvents';

export interface Transaction {
    id: number;
    type: 'pay' | 'receive';
    amount: number;
    date: string;
    name: string;
    event_type: EventType;
    relation?: string;
    memo?: string;
}

const db = SQLite.openDatabaseSync('transactions.db');

export const initDatabase = () => {
    try {
        db.execSync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          amount INTEGER NOT NULL,
          date TEXT NOT NULL,
          name TEXT NOT NULL,
          event_type TEXT NOT NULL,
          relation TEXT,
          memo TEXT
        );
      `);
        console.log('Database initialized');
    } catch (error) {
        console.error('Database initialization failed', error);
    }
};

export const addTransactionToDb = (
    transaction: Omit<Transaction, 'id'>,
    onSuccess?: () => void,
    onError?: (error: any) => void
) => {
    try {
        const result = db.runSync(
            `INSERT INTO transactions (type, amount, date, name, event_type, relation, memo)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [
                transaction.type,
                transaction.amount,
                transaction.date,
                transaction.name,
                transaction.event_type,
                transaction.relation || '',
                transaction.memo || '',
            ]
        );
        console.log('Transaction added:', result);
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error('Failed to add transaction', error);
        if (onError) onError(error);
    }
};

export const getTransactionsFromDb = (
    onSuccess: (transactions: Transaction[]) => void,
    onError?: (error: any) => void
) => {
    try {
        const rows = db.getAllSync(
            `SELECT * FROM transactions ORDER BY date DESC;`
        );
        onSuccess(rows as Transaction[]);
    } catch (error) {
        console.error('Failed to fetch transactions', error);
        if (onError) onError(error);
    }
};
