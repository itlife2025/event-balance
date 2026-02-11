import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    initDatabase,
    getTransactionsFromDb,
    addTransactionToDb,
    Transaction,
} from '../services/Database';

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    refreshTransactions: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        initDatabase();
        refreshTransactions();
    }, []);

    const refreshTransactions = () => {
        getTransactionsFromDb((data) => {
            setTransactions(data);
        });
    };

    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        return new Promise<void>((resolve, reject) => {
            addTransactionToDb(
                transaction,
                () => {
                    refreshTransactions();
                    resolve();
                },
                (error) => reject(error)
            );
        });
    };

    return (
        <TransactionContext.Provider value={{ transactions, addTransaction, refreshTransactions }}>
            {children}
        </TransactionContext.Provider>
    );
};

export const useTransactions = () => {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
};
