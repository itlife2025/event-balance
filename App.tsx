import React, { useState, useEffect } from 'react';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { TransactionProvider } from './src/context/TransactionContext';
import { initDatabase } from './src/database/database';
import { isOnboardingCompleted, setOnboardingCompleted } from './src/database/queries';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const completed = await isOnboardingCompleted();
        setShowOnboarding(!completed);
      } catch (error) {
        console.error('App init error:', error);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  if (!isReady) return null;

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={async () => {
          await setOnboardingCompleted();
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <TransactionProvider>
      <HomeScreen />
    </TransactionProvider>
  );
}
