import React, { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { TransactionProvider } from './src/context/TransactionContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { NotificationProvider, useNotifications } from './src/context/NotificationContext';
import { initDatabase } from './src/database/database';
import { isOnboardingCompleted, setOnboardingCompleted } from './src/database/queries';
import { scheduleAllNotifications, requestNotificationPermissions } from './src/services/NotificationService';

// iOS는 초 단위, Android는 밀리초 단위를 반환하므로 자동 감지
function toDate(dateValue: number): Date {
  return new Date(dateValue > 1e10 ? dateValue : dateValue * 1000);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const completed = await isOnboardingCompleted();
        setShowOnboarding(!completed);
        await requestNotificationPermissions();
        scheduleAllNotifications().catch(() => {});
      } catch (error) {
        console.error('App init error:', error);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const syncPresentedNotifications = useCallback(async () => {
    const presented = await Notifications.getPresentedNotificationsAsync();
    for (const notif of presented) {
      const title = notif.request.content.title ?? '알림';
      const body = notif.request.content.body ?? '';
      addNotification(notif.request.identifier, title, body, toDate(notif.date));
    }
  }, [addNotification]);

  const syncLastResponse = useCallback(async () => {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) return;
    const title = response.notification.request.content.title ?? '알림';
    const body = response.notification.request.content.body ?? '';
    addNotification(response.notification.request.identifier, title, body, toDate(response.notification.date));
  }, [addNotification]);

  useEffect(() => {
    // 1. 포그라운드에서 알림 도착
    const receivedSub = Notifications.addNotificationReceivedListener(notification => {
      const title = notification.request.content.title ?? '알림';
      const body = notification.request.content.body ?? '';
      addNotification(notification.request.identifier, title, body, toDate(notification.date));
    });

    // 2. 백그라운드/종료 상태에서 알림을 탭해 앱 진입
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const title = response.notification.request.content.title ?? '알림';
      const body = response.notification.request.content.body ?? '';
      addNotification(response.notification.request.identifier, title, body, toDate(response.notification.date));
    });

    // 3. 앱 시작 시 마지막으로 탭한 알림 + 알림 센터에 남은 알림 수집
    syncLastResponse();
    syncPresentedNotifications();

    // 4. 백그라운드 → 포그라운드 전환 시 알림 수집 (300ms 딜레이로 네이티브 상태 안정화 대기)
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setTimeout(() => {
          syncLastResponse();
          syncPresentedNotifications();
        }, 300);
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
      appStateSub.remove();
    };
  }, [addNotification, syncPresentedNotifications, syncLastResponse]);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <TransactionProvider>
          <HomeScreen />
        </TransactionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}
