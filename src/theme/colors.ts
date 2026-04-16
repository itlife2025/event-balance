export interface ThemeColors {
  background: string;
  card: string;
  surface: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  placeholder: string;
  border: string;
  borderLight: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  sent: string;
  received: string;
  danger: string;
  warning: string;
  iconButtonBg: string;
  profileAvatarBg: string;
  overlay: string;
  // calendar
  calendarDayText: string;
  calendarDayDisabled: string;
  // event type icon backgrounds
  eventWeddingBg: string;
  eventFuneralBg: string;
  eventBirthdayBg: string;
  eventFirstBirthdayBg: string;
  eventBirthBg: string;
  eventOtherBg: string;
}

export const lightColors: ThemeColors = {
  background: '#F9FAFB',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  placeholder: '#D1D5DB',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  primary: '#6366F1',
  primaryLight: '#EEF2FF',
  primaryDark: '#4338CA',
  sent: '#818CF8',
  received: '#34D399',
  danger: '#EF4444',
  warning: '#F59E0B',
  iconButtonBg: '#F3F4F6',
  profileAvatarBg: '#E0E7FF',
  overlay: 'rgba(0,0,0,0.4)',
  calendarDayText: '#1F2937',
  calendarDayDisabled: '#D1D5DB',
  eventWeddingBg: '#FDF2F8',
  eventFuneralBg: '#EDE9F5',
  eventBirthdayBg: '#FFFBEB',
  eventFirstBirthdayBg: '#DCFCE7',
  eventBirthBg: '#DBEAFE',
  eventOtherBg: '#F5F3FF',
};

export const darkColors: ThemeColors = {
  background: '#111827',
  card: '#1F2937',
  surface: '#374151',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  placeholder: '#6B7280',
  border: '#374151',
  borderLight: '#374151',
  primary: '#818CF8',
  primaryLight: '#312E81',
  primaryDark: '#6366F1',
  sent: '#818CF8',
  received: '#34D399',
  danger: '#EF4444',
  warning: '#F59E0B',
  iconButtonBg: '#374151',
  profileAvatarBg: '#312E81',
  overlay: 'rgba(0,0,0,0.6)',
  calendarDayText: '#F9FAFB',
  calendarDayDisabled: '#4B5563',
  eventWeddingBg: '#3D1C32',
  eventFuneralBg: '#2C2040',
  eventBirthdayBg: '#3D2E1C',
  eventFirstBirthdayBg: '#14532D',
  eventBirthBg: '#1E3A5F',
  eventOtherBg: '#2D2552',
};
