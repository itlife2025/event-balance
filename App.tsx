import React from 'react';
import { HomeScreen } from './src/screens/HomeScreen';
import { TransactionProvider } from './src/context/TransactionContext';

export default function App() {
  return (
    <TransactionProvider>
      <HomeScreen />
    </TransactionProvider>
  );
}
