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

const TIMING_SUFFIXES: Record<TimingKey, string> = {
  d7: '일정이 7일 남았습니다.',
  d1: '일정이 1일 남았습니다.',
  dday: '일정 당일입니다.',
};

// 같은 날짜+같은 타이밍 일정을 하나의 알림 문구로 합침.
// 1건이면 기존과 동일("홍길동님의 결혼 일정 당일입니다."),
// 2건 이상이면 "홍길동님의 결혼 외 1건 일정 당일입니다." 형태.
function buildBody(timing: TimingKey, firstName: string, firstType: string, count: number): string {
  const others = count - 1;
  const subject = others > 0
    ? `${firstName}님의 ${firstType} 외 ${others}건`
    : `${firstName}님의 ${firstType}`;
  return `${subject} ${TIMING_SUFFIXES[timing]}`;
}

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

const ALL_TIMINGS: TimingKey[] = ['d7', 'd1', 'dday'];

export async function dismissScheduleNotifications(scheduleId: string): Promise<void> {
  await Promise.all(
    ALL_TIMINGS.map(t =>
      Notifications.dismissNotificationAsync(`${scheduleId}-${t}`).catch(() => {}),
    ),
  );
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

  interface ScheduleGroup {
    timing: TimingKey;
    baseDate: Date;
    repId: string;
    firstName: string;
    firstType: string;
    count: number;
  }

  // 같은 날짜+같은 타이밍 일정을 하나의 그룹으로 묶음.
  // 그룹의 대표(repId)는 가장 먼저 등장한 일정이며, 알림 식별자/탭 시 열릴 일정이 됨.
  const groupMap = new Map<string, ScheduleGroup>();

  for (const schedule of schedules) {
    const [y, m, d] = schedule.date.split('-').map(Number);
    const typeLabel = getEventTypeLabel(schedule.type);

    for (const timing of timings) {
      const offset = TIMING_OFFSETS[timing];
      const baseDate = new Date(y, m - 1, d, hour, minute, 0, 0);
      baseDate.setDate(baseDate.getDate() - offset);

      const key = `${schedule.date}|${timing}`;
      const existing = groupMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        groupMap.set(key, {
          timing,
          baseDate,
          repId: schedule.id,
          firstName: schedule.name,
          firstType: typeLabel,
          count: 1,
        });
      }
    }
  }

  interface PendingNotif {
    identifier: string;
    content: { title: string; body: string; sound: true };
    notifDate: Date;
    isYearly: boolean;
  }

  const pending: PendingNotif[] = [];

  for (const group of groupMap.values()) {
    const identifier = `${group.repId}-${group.timing}`;
    const content = {
      title: TIMING_TITLES[group.timing],
      body: buildBody(group.timing, group.firstName, group.firstType, group.count),
      sound: true as const,
    };

    if (repeatYearly) {
      pending.push({ identifier, content, notifDate: group.baseDate, isYearly: true });
    } else if (group.baseDate > now) {
      pending.push({ identifier, content, notifDate: group.baseDate, isYearly: false });
    }
  }

  // 날짜순 정렬 후 알림(대표 일정) 수를 badge로 할당.
  // 같은 날짜+타이밍 일정은 1개 알림으로 합쳐지므로 badge도 알림 1개당 1씩 증가.
  pending.sort((a, b) => a.notifDate.getTime() - b.notifDate.getTime());

  const badgeScheduleIds = new Set<string>();
  for (let i = 0; i < pending.length; i++) {
    const { identifier, content, isYearly } = pending[i];
    // 동시 전달/순서 보장을 위해 알림마다 시각을 조금씩 어긋나게(+30s, +5s 간격) 둠
    const notifDate = new Date(pending[i].notifDate.getTime() + (i * 5 + 30) * 1000);
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
