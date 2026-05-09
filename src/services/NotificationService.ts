import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAllSchedules, getSetting } from '../database/queries';
import { getEventTypeLabel } from '../constants/eventTypes';

const CHANNEL_ID = 'event-reminders';

type TimingKey = 'd7' | 'd1' | 'dday';

const TIMING_OFFSETS: Record<TimingKey, number> = {
  d7: 7,
  d1: 1,
  dday: 0,
};

const TIMING_TITLES: Record<TimingKey, string> = {
  d7: 'D-7 일정 알림',
  d1: 'D-1 일정 알림',
  dday: '오늘 일정 알림',
};

const TIMING_BODIES: Record<TimingKey, (name: string, typeLabel: string) => string> = {
  d7: (name, type) => `${name}님의 ${type} 일정이 7일 남았습니다.`,
  d1: (name, type) => `${name}님의 ${type} 일정이 1일 남았습니다.`,
  dday: (name, type) => `${name}님의 ${type} 일정 당일입니다.`,
};

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: '일정 알림',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;
  }
  return true;
}

export async function scheduleAllNotifications(): Promise<void> {
  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [enabledStr, timingsStr, hourStr, minuteStr, repeatStr] = await Promise.all([
    getSetting('notification_enabled'),
    getSetting('notif_timings'),
    getSetting('notif_hour'),
    getSetting('notif_minute'),
    getSetting('notif_repeat_yearly'),
  ]);

  if (enabledStr !== '1') return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const timings = (timingsStr ? timingsStr.split(',') : ['dday']) as TimingKey[];
  const hour = hourStr !== null ? parseInt(hourStr, 10) : 9;
  const minute = minuteStr !== null ? parseInt(minuteStr, 10) : 0;
  const repeatYearly = repeatStr === '1';

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  // 매년 반복이면 과거 날짜도 내년 YEARLY 알림 등록 대상이므로 전체 조회
  const schedules = await getAllSchedules(repeatYearly ? undefined : today);

  const timingCounters: Record<string, number> = {};

  for (const schedule of schedules) {
    const [y, m, d] = schedule.date.split('-').map(Number);
    const typeLabel = getEventTypeLabel(schedule.type);

    for (const timing of timings) {
      const offset = TIMING_OFFSETS[timing];
      const baseDate = new Date(y, m - 1, d, hour, minute, 0, 0);
      baseDate.setDate(baseDate.getDate() - offset);

      const identifier = `${schedule.id}-${timing}`;
      const content = {
        title: TIMING_TITLES[timing],
        body: TIMING_BODIES[timing](schedule.name, typeLabel),
        sound: true as const,
      };

      if (repeatYearly) {
        // 실제 등록할 때만 idx 증가. 5초 간격으로 순서대로 표시되도록 스태거링.
        const idx = timingCounters[timing] ?? 0;
        timingCounters[timing] = idx + 1;
        const notifDate = new Date(baseDate.getTime() + (idx * 5 + 30) * 1000);
        await Notifications.scheduleNotificationAsync({
          identifier,
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.YEARLY,
            month: notifDate.getMonth() + 1,
            day: notifDate.getDate(),
            hour: notifDate.getHours(),
            minute: notifDate.getMinutes(),
            ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
          },
        });
      } else if (baseDate > now) {
        const idx = timingCounters[timing] ?? 0;
        timingCounters[timing] = idx + 1;
        const notifDate = new Date(baseDate.getTime() + (idx * 5 + 30) * 1000);
        await Notifications.scheduleNotificationAsync({
          identifier,
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: notifDate,
            ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
          },
        });
      }
    }
  }
}
