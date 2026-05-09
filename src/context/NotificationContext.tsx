import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { getSetting, setSetting } from '../database/queries';

export interface NotificationItem {
  id: string;
  scheduleId: string;
  title: string;
  body: string;
  receivedAt: Date;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  hasUnread: boolean;
  isPanelOpen: boolean;
  addNotification: (notifId: string, title: string, body: string, receivedAt?: Date) => void;
  dismissNotification: (id: string) => void;
  openPanel: () => void;
  closePanel: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  hasUnread: false,
  isPanelOpen: false,
  addNotification: () => {},
  dismissNotification: () => {},
  openPanel: () => {},
  closePanel: () => {},
  clearAll: () => {},
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());
  // 전체 삭제 시각 (ms). 이 시각 이전 알림은 재시작 후에도 다시 추가하지 않음.
  const clearedAt = useRef<number>(0);

  useEffect(() => {
    getSetting('notif_cleared_at').then(val => {
      if (val) clearedAt.current = parseInt(val, 10);
    });
  }, []);

  const addNotification = useCallback((notifId: string, title: string, body: string, receivedAt?: Date) => {
    if (seenIds.current.has(notifId)) return;
    // notifId 형식: "${scheduleId}-${timing}" (예: "42-dday"). 숫자 ID가 아니면 스케줄 알림이 아님.
    const scheduleIdStr = notifId.split('-')[0];
    if (!scheduleIdStr || isNaN(Number(scheduleIdStr))) return;
    // 전체 삭제 이전에 수신된 알림은 무시
    if (receivedAt && receivedAt.getTime() <= clearedAt.current) return;
    seenIds.current.add(notifId);
    const item: NotificationItem = { id: notifId, scheduleId: scheduleIdStr, title, body, receivedAt: receivedAt ?? new Date() };
    setNotifications(prev => [item, ...prev]);
    setHasUnread(true);
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const openPanel = useCallback(() => {
    setHasUnread(false);
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const clearAll = () => {
    const now = Date.now();
    clearedAt.current = now;
    setSetting('notif_cleared_at', String(now));
    Notifications.dismissAllNotificationsAsync();
    seenIds.current.clear();
    setNotifications([]);
    setHasUnread(false);
    setIsPanelOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ notifications, hasUnread, isPanelOpen, addNotification, dismissNotification, openPanel, closePanel, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
