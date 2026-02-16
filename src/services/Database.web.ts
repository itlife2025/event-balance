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

export const initDatabase = () => {
    console.log('Database initialized (web no-op)');
};

export const addTransactionToDb = (
    transaction: Omit<Transaction, 'id'>,
    onSuccess?: () => void,
    _onError?: (error: any) => void
) => {
    console.log('addTransactionToDb (web no-op)', transaction);
    if (onSuccess) onSuccess();
};

export const getTransactionsFromDb = (
    onSuccess: (transactions: Transaction[]) => void,
    _onError?: (error: any) => void
) => {
    onSuccess([]);
};
