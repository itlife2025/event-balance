import React, { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { TransactionProvider } from './src/context/TransactionContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { NotificationProvider, useNotifications } from './src/context/NotificationContext';
import { initDatabase, invalidateDbConnection } from './src/database/database';
import { isOnboardingCompleted, setOnboardingCompleted } from './src/database/queries';
import { scheduleAllNotifications, requestNotificationPermissions } from './src/services/NotificationService';

// iOS 로컬 알림의 notification.date는 전달 시각이 아닌 등록 시각을 반환하는 경우가 있음.
// 알림 content.data에 저장한 firedAt(실제 트리거 시각)을 우선 사용.
function getNotificationDate(notification: Notifications.Notification): Date {
  const firedAt = notification.request.content.data?.firedAt;
  if (typeof firedAt === 'number') return new Date(firedAt);
  // fallback: iOS는 초 단위, Android는 밀리초 단위
  const ts = notification.date;
  return new Date(ts > 1e10 ? ts : ts * 1000);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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
      addNotification(notif.request.identifier, title, body, getNotificationDate(notif));
    }
  }, [addNotification]);

  const syncLastResponse = useCallback(async () => {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) return;
    const title = response.notification.request.content.title ?? '알림';
    const body = response.notification.request.content.body ?? '';
    addNotification(response.notification.request.identifier, title, body, getNotificationDate(response.notification));
  }, [addNotification]);

  useEffect(() => {
    // 1. 포그라운드에서 알림 도착
    const receivedSub = Notifications.addNotificationReceivedListener(notification => {
      const title = notification.request.content.title ?? '알림';
      const body = notification.request.content.body ?? '';
      addNotification(notification.request.identifier, title, body, getNotificationDate(notification));
    });

    // 2. 백그라운드/종료 상태에서 알림을 탭해 앱 진입
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const title = response.notification.request.content.title ?? '알림';
      const body = response.notification.request.content.body ?? '';
      addNotification(response.notification.request.identifier, title, body, getNotificationDate(response.notification));
    });

    // 3. 앱 시작 시 마지막으로 탭한 알림 + 알림 센터에 남은 알림 수집
    syncLastResponse();
    syncPresentedNotifications();

    // 4. 백그라운드 → 포그라운드 전환 시 DB 연결 초기화 + 알림 수집
    // Android는 백그라운드에서 네이티브 SQLite 연결이 끊길 수 있으므로 재연결 유도
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        invalidateDbConnection();
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
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <TransactionProvider>
            <HomeScreen />
          </TransactionProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}
