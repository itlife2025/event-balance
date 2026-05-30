import * as Notifications from 'expo-notifications';
import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
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

async function checkExactAlarmPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 31) return;
  try {
    const granted = await PermissionsAndroid.check(
      'android.permission.SCHEDULE_EXACT_ALARM' as any,
    );
    if (granted) return;
    Alert.alert(
      '정확한 알림 권한 필요',
      '자정처럼 기기가 절전 상태일 때도 정확한 시각에 알림을 받으려면 "알람 및 미리 알림" 권한이 필요합니다.',
      [
        { text: '나중에', style: 'cancel' },
        {
          text: '설정 열기',
          onPress: async () => {
            try {
              await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM');
            } catch {
              Linking.openSettings();
            }
          },
        },
      ],
    );
  } catch {
    // 일부 기기에서 권한 확인 자체가 실패할 수 있음 — 무시
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;
  }
  await checkExactAlarmPermission();
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

  interface PendingNotif {
    identifier: string;
    content: { title: string; body: string; sound: true };
    notifDate: Date;
    isYearly: boolean;
  }

  const timingCounters: Record<string, number> = {};
  const pending: PendingNotif[] = [];

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
        const idx = timingCounters[timing] ?? 0;
        timingCounters[timing] = idx + 1;
        const notifDate = new Date(baseDate.getTime() + (idx * 5 + 30) * 1000);
        pending.push({ identifier, content, notifDate, isYearly: true });
      } else if (baseDate > now) {
        const idx = timingCounters[timing] ?? 0;
        timingCounters[timing] = idx + 1;
        const notifDate = new Date(baseDate.getTime() + (idx * 5 + 30) * 1000);
        pending.push({ identifier, content, notifDate, isYearly: false });
      }
    }
  }

  // 날짜순 정렬 후 고유 일정(schedule) 수를 badge로 할당
  // 같은 일정의 D-7/D-1/당일 알림이 여러 개여도 badge = 고유 일정 수
  pending.sort((a, b) => a.notifDate.getTime() - b.notifDate.getTime());

  const badgeScheduleIds = new Set<string>();
  for (let i = 0; i < pending.length; i++) {
    const { identifier, content, notifDate, isYearly } = pending[i];
    badgeScheduleIds.add(identifier.split('-')[0]);
    const badge = badgeScheduleIds.size;
    if (isYearly) {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: { ...content, badge, data: { firedAt: notifDate.getTime() } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.YEARLY,
          month: notifDate.getMonth() + 1,
          day: notifDate.getDate(),
          hour: notifDate.getHours(),
          minute: notifDate.getMinutes(),
          ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
        },
      });
    } else {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: { ...content, badge, data: { firedAt: notifDate.getTime() } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifDate,
          ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
        },
      });
    }
  }
}
