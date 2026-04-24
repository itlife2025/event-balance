import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Keyboard,
  Image,
  Pressable,
} from 'react-native';
import { ChevronRightIcon, ChevronLeftIcon, CalendarIcon, SearchIcon, PhoneIcon } from '../components/Icons';
import { Header } from '../components/Header';
import { useTheme } from '../theme/ThemeContext';
import { EventType } from '../components/UpcomingEvents';
import { insertSchedule, updateSchedule } from '../database/queries';

export interface ScheduleData {
  id?: string;
  name: string;
  phone?: string;
  type: EventType;
  date: string; // "YYYY.MM.DD (요일)" format
  relationship?: string;
  memo?: string;
}

interface RegisterScheduleScreenProps {
  onClose?: () => void;
  onSaved?: () => void;
  initialData?: ScheduleData;
  onRegisterEvent?: (data: ScheduleData) => void;
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

function getCalendarDays(year: number, month: number) {
  // getDay() returns 0=Sun..6=Sat; convert to Mon-based: 0=Mon..6=Sun
  const rawFirstDay = new Date(year, month, 1).getDay();
  const firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { day: number; currentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, currentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, currentMonth: true });
  }

  // Next month leading days
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, currentMonth: false });
    }
  }

  return days;
}

function formatDisplayDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export const RegisterScheduleScreen: React.FC<RegisterScheduleScreenProps> = ({
  onClose,
  onSaved,
  initialData,
  onRegisterEvent,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { colors } = useTheme();

  const isEditMode = !!initialData?.id;

  const nameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Parse initialData date "YYYY.MM.DD (요일)" → Date
  const initialDate = useMemo(() => {
    if (!initialData?.date) return today;
    const datePart = initialData.date.split(' ')[0]; // "YYYY.MM.DD"
    const [y, m, d] = datePart.split('.').map(Number);
    if (y && m && d) {
      const date = new Date(y, m - 1, d);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    return today;
  }, [initialData, today]);

  const [selectedType, setSelectedType] = useState<EventType | null>(initialData?.type || null);
  const [eventName, setEventName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [calendarYear, setCalendarYear] = useState(initialDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(initialDate.getMonth());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [relation, setRelation] = useState(initialData?.relationship || '');
  const [isRelationDirectInput, setIsRelationDirectInput] = useState(() => {
    const preset = ['본인', '배우자', '자녀', '부친', '모친', '조부', '조모', '빙부', '빙모'];
    return !!initialData?.relationship && !preset.includes(initialData.relationship);
  });
  const [memo, setMemo] = useState(initialData?.memo || '');
  const [isEventTypeDirectInput, setIsEventTypeDirectInput] = useState(false);
  const [customEventType, setCustomEventType] = useState('');

  const relationOptions = ['본인', '배우자', '자녀', '부친', '모친', '조부', '조모', '빙부', '빙모'];

  const handleRelationSelect = (value: string) => {
    setRelation(value);
    setIsRelationDirectInput(false);
  };

  const handleRelationDirectInput = () => {
    setIsRelationDirectInput(true);
    setRelation('');
  };

  const handleEventTypeSelect = (key: EventType) => {
    setSelectedType(key);
    setIsEventTypeDirectInput(false);
    setCustomEventType('');
  };

  const handleEventTypeDirectInput = () => {
    setIsEventTypeDirectInput(true);
    setSelectedType(null);
    setCustomEventType('');
  };

  const calendarDays = useMemo(
    () => getCalendarDays(calendarYear, calendarMonth),
    [calendarYear, calendarMonth]
  );

  const goToPrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear(calendarYear - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(calendarYear + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleDayPress = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return;
    const newDate = new Date(calendarYear, calendarMonth, day);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
    setIsCalendarOpen(false);
  };

  const isSelectedDay = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return false;
    return (
      selectedDate.getFullYear() === calendarYear &&
      selectedDate.getMonth() === calendarMonth &&
      selectedDate.getDate() === day
    );
  };

  const isTodayDay = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return false;
    return (
      today.getFullYear() === calendarYear &&
      today.getMonth() === calendarMonth &&
      today.getDate() === day
    );
  };

  const eventTypes = [
    { key: 'wedding', label: '결혼' },
    { key: 'birth', label: '출산' },
    { key: 'firstBirthday', label: '돌잔치' },
    { key: 'birthday', label: '생일' },
    { key: 'funeral', label: '장례' },
  ] as const;

  const typeToKorean: Record<string, string> = {
    wedding: '결혼',
    funeral: '장례',
    birthday: '생일',
    firstBirthday: '돌',
    other: '기타',
  };

  const isValid = Boolean(eventName && selectedDate && (selectedType || (isEventTypeDirectInput && customEventType.trim())));

  const handleSave = async () => {
    if (!isValid) return;

    const eventType = isEventTypeDirectInput
      ? (customEventType.trim() || 'other')
      : (selectedType || 'other');

    try {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      const dbDate = `${y}-${m}-${d}`;

      const scheduleData = {
        name: eventName,
        phone,
        type: eventType,
        date: dbDate,
        relationship: relation,
        memo,
      };

      if (isEditMode && initialData?.id) {
        await updateSchedule(initialData.id, scheduleData);
      } else {
        await insertSchedule(scheduleData);
      }

      onSaved?.();
      onClose?.();
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
  };

  const cellSize = 32;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={isEditMode ? "일정 수정" : "일정 등록"} />

      <View style={styles.contentArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Name Input */}
          <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet, { color: colors.text }]}>
              이름
            </Text>
            <Pressable
              style={[styles.searchContainer, isTablet && styles.searchContainerTablet, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              onPress={() => nameInputRef.current?.focus()}
            >
              <View style={styles.searchIconLeft}>
                <SearchIcon size={20} color={colors.textSecondary} />
              </View>
              <TextInput
                ref={nameInputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="이름을 입력하세요"
                placeholderTextColor={colors.placeholder}
                value={eventName}
                onChangeText={setEventName}
              />
            </Pressable>
          </View>

          {/* Phone Input */}
          <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet, { color: colors.text }]}>
              전화번호
            </Text>
            <Pressable
              style={[styles.searchContainer, isTablet && styles.searchContainerTablet, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              onPress={() => phoneInputRef.current?.focus()}
            >
              <View style={styles.searchIconLeft}>
                <PhoneIcon size={20} color={colors.textSecondary} />
              </View>
              <TextInput
                ref={phoneInputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="전화번호를 입력하세요"
                placeholderTextColor={colors.placeholder}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </Pressable>
          </View>

          {/* Event Type Selection */}
          <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet, { color: colors.text }]}>
              종류
            </Text>
            <View style={styles.typeButtonsContainer}>
              {eventTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeButton,
                    { borderColor: colors.placeholder, backgroundColor: colors.card },
                    selectedType === type.key && !isEventTypeDirectInput && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => handleEventTypeSelect(type.key as EventType)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: colors.textSecondary },
                      selectedType === type.key && !isEventTypeDirectInput && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { borderColor: colors.placeholder, backgroundColor: colors.card },
                  isEventTypeDirectInput && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                ]}
                onPress={handleEventTypeDirectInput}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: colors.textSecondary },
                    isEventTypeDirectInput && { color: colors.primary, fontWeight: '600' },
                  ]}
                >
                  직접입력
                </Text>
              </TouchableOpacity>
            </View>
            {isEventTypeDirectInput && (
              <TextInput
                style={[styles.relationDirectInput, isTablet && styles.inputTextTablet, { backgroundColor: colors.card, color: colors.text, borderColor: colors.primary }]}
                placeholder="종류를 입력하세요"
                placeholderTextColor={colors.placeholder}
                value={customEventType}
                onChangeText={setCustomEventType}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            )}
          </View>

          {/* Date */}
          <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet, { color: colors.text }]}>
              날짜
            </Text>
            <TouchableOpacity
              style={[styles.inputBox, isTablet && styles.inputBoxTablet, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              onPress={() => setIsCalendarOpen(!isCalendarOpen)}
            >
              <Text style={[styles.inputText, isTablet && styles.inputTextTablet, { color: colors.text }]}>
                {formatDisplayDate(selectedDate)}
              </Text>
              <CalendarIcon size={isTablet ? 20 : 18} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Inline Calendar */}
            {isCalendarOpen && (
              <View style={[styles.calendarContainer, isTablet && styles.calendarContainerTablet, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Calendar Header */}
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={goToPrevMonth} style={[styles.calendarNavButton, { backgroundColor: colors.iconButtonBg }]}>
                    <ChevronLeftIcon size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={[styles.calendarTitle, isTablet && styles.calendarTitleTablet, { color: colors.text }]}>
                    {calendarYear}년 {calendarMonth + 1}월
                  </Text>
                  <TouchableOpacity onPress={goToNextMonth} style={[styles.calendarNavButton, { backgroundColor: colors.iconButtonBg }]}>
                    <ChevronRightIcon size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Weekday Headers */}
                <View style={styles.calendarWeekdays}>
                  {WEEKDAYS.map((day) => (
                    <View key={day} style={[styles.calendarCell, { height: cellSize * 0.7 }]}>
                      <Text style={[
                        styles.calendarWeekdayText,
                        isTablet && styles.calendarWeekdayTextTablet,
                        { color: colors.textTertiary },
                      ]}>
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.calendarDaysGrid}>
                  {calendarDays.map((item, index) => {
                    const selected = isSelectedDay(item.day, item.currentMonth);
                    const isToday = isTodayDay(item.day, item.currentMonth);

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.calendarCell,
                          { height: cellSize },
                        ]}
                        onPress={() => handleDayPress(item.day, item.currentMonth)}
                        disabled={!item.currentMonth}
                        activeOpacity={0.6}
                      >
                        <View style={[
                          styles.calendarDayInner,
                          { width: cellSize - 4, height: cellSize - 4, borderRadius: (cellSize - 4) / 2 },
                          selected && [styles.calendarDaySelected, { backgroundColor: colors.primary }],
                          isToday && !selected && [styles.calendarDayToday, { borderColor: colors.primary }],
                        ]}>
                          <Text style={[
                            styles.calendarDayText,
                            isTablet && styles.calendarDayTextTablet,
                            { color: colors.calendarDayText },
                            !item.currentMonth && { color: colors.calendarDayDisabled },
                            selected && styles.calendarDayTextSelected,
                          ]}>
                            {item.day}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Relation */}
          <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet, { color: colors.text }]}>
              관계
            </Text>
            <View style={styles.typeButtonsContainer}>
              {relationOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.typeButton,
                    { borderColor: colors.placeholder, backgroundColor: colors.card },
                    relation === opt && !isRelationDirectInput && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => handleRelationSelect(opt)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.typeButtonText,
                    { color: colors.textSecondary },
                    relation === opt && !isRelationDirectInput && { color: colors.primary, fontWeight: '600' },
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { borderColor: colors.placeholder, backgroundColor: colors.card },
                  isRelationDirectInput && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                ]}
                onPress={handleRelationDirectInput}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.typeButtonText,
                  { color: colors.textSecondary },
                  isRelationDirectInput && { color: colors.primary, fontWeight: '600' },
                ]}>
                  직접입력
                </Text>
              </TouchableOpacity>
            </View>
            {isRelationDirectInput && (
              <TextInput
                style={[styles.relationDirectInput, isTablet && styles.inputTextTablet, { backgroundColor: colors.card, borderColor: colors.primary, color: colors.text }]}
                placeholder="관계를 입력하세요"
                placeholderTextColor={colors.placeholder}
                value={relation}
                onChangeText={setRelation}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            )}
          </View>

          {/* Memo */}
          <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet, { color: colors.text }]}>
              메모를 남겨보세요
            </Text>
            <TextInput
              style={[styles.memoInput, isTablet && styles.memoInputTablet, { backgroundColor: colors.card, borderColor: colors.borderLight, color: colors.text }]}
              placeholder="메모를 남겨보세요"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
              value={memo}
              onChangeText={setMemo}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit={true}
            />
          </View>

          {/* Buttons */}
          <View style={{ marginBottom: 40, gap: 10 }}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                !isValid && styles.saveButtonDisabled,
                isTablet && styles.saveButtonTablet,
              ]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={!isValid}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  { color: '#FFFFFF' },
                  !isValid && styles.saveButtonTextDisabled,
                  isTablet && styles.saveButtonTextTablet,
                ]}
              >
                저장하기
              </Text>
            </TouchableOpacity>
            {initialData && onRegisterEvent && (
              <TouchableOpacity
                style={[styles.registerEventButton, isTablet && styles.registerEventButtonTablet]}
                onPress={() => {
                  const days = ['일', '월', '화', '수', '목', '금', '토'];
                  const dayName = days[selectedDate.getDay()];
                  const dateStr = `${formatDisplayDate(selectedDate)} (${dayName})`;
                  onRegisterEvent({
                    name: eventName,
                    phone,
                    type: selectedType || 'other',
                    date: dateStr,
                    relationship: relation,
                    memo,
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.registerEventButtonText, isTablet && styles.registerEventButtonTextTablet]}>
                  경조사비 등록
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    flexDirection: 'column',
  },
  contentArea: {
    flex: 1,
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  sectionContainer: {
    marginBottom: 18,
  },
  sectionContainerTablet: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionLabelTablet: {
    fontSize: 16,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchContainerTablet: {
    height: 44,
    paddingHorizontal: 14,
  },
  searchIconLeft: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  typeButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  relationDirectInput: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#6366F1',
    fontSize: 16,
    color: '#1F2937',
    height: 40,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  inputBoxTablet: {
    height: 44,
    paddingHorizontal: 14,
  },
  inputText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  inputTextTablet: {
    fontSize: 17,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },

  // Calendar styles
  calendarContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  calendarContainerTablet: {
    padding: 16,
    width: '50%',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  calendarTitleTablet: {
    fontSize: 20,
  },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarCell: {
    width: '14.285%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarWeekdayText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  calendarWeekdayTextTablet: {
    fontSize: 16,
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDaySelected: {
    backgroundColor: '#6366F1',
  },
  calendarDayToday: {
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  calendarDayTextTablet: {
    fontSize: 17,
  },
  calendarDayTextDisabled: {
    color: '#D1D5DB',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  registerEventButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerEventButtonTablet: {
    paddingVertical: 14,
    borderRadius: 12,
  },
  registerEventButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registerEventButtonTextTablet: {
    fontSize: 18,
  },

  memoInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  memoInputTablet: {
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTablet: {
    marginBottom: 24,
    borderRadius: 14,
  },
  saveButton: {
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonFull: {
    flex: 1,
  },
  saveButtonTablet: {
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#6366F1',
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  saveButtonTextTablet: {
    fontSize: 18,
  },
});
