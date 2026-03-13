export type EventTypeKey = 'wedding' | 'funeral' | 'birthday' | 'firstBirthday' | 'birth' | 'other';

/** 영문 키 → 한글 라벨 (단일 소스) */
export const EVENT_TYPE_LABELS: Record<EventTypeKey, string> = {
  wedding: '결혼',
  funeral: '장례',
  birthday: '생일',
  firstBirthday: '돌잔치',
  birth: '출산',
  other: '기타',
};

/** 한글 → 영문 역매핑 (자동 생성) */
const KOREAN_TO_TYPE: Record<string, EventTypeKey> = Object.fromEntries(
  Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => [label, key as EventTypeKey])
);

/** DB에 저장된 type 문자열을 EventTypeKey로 변환 (영문이든 한글이든) */
export function resolveEventType(raw: string): EventTypeKey {
  if (raw in EVENT_TYPE_LABELS) return raw as EventTypeKey;
  return KOREAN_TO_TYPE[raw] ?? 'other';
}

/** type 문자열 → 표시용 라벨 (알려진 키면 한글, 직접입력이면 그대로) */
export function getEventTypeLabel(type: string): string {
  if (type in EVENT_TYPE_LABELS) return EVENT_TYPE_LABELS[type as EventTypeKey];
  if (type in KOREAN_TO_TYPE) return type; // 이미 한글
  return type; // 직접입력 값 그대로 반환
}
