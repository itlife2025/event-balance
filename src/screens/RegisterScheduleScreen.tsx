import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import { ChevronRightIcon, ChevronLeftIcon, CalendarIcon } from '../components/Icons';
import { Header } from '../components/Header';
import { EventType } from '../components/UpcomingEvents';
import { insertSchedule } from '../database/queries';

export interface ScheduleData {
  name: string;
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

  const [selectedType, setSelectedType] = useState<EventType>(initialData?.type || 'wedding');
  const [eventName, setEventName] = useState(initialData?.name || '');
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

  const relationOptions = ['본인', '배우자', '자녀', '부친', '모친', '조부', '조모', '빙부', '빙모'];

  const handleRelationSelect = (value: string) => {
    setRelation(value);
    setIsRelationDirectInput(false);
  };

  const handleRelationDirectInput = () => {
    setIsRelationDirectInput(true);
    setRelation('');
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
    { key: 'funeral', label: '장례' },
    { key: 'birthday', label: '생일' },
    { key: 'firstBirthday', label: '돌잔치' },
    { key: 'other', label: '기타' },
  ] as const;

  const typeToKorean: Record<string, string> = {
    wedding: '결혼',
    funeral: '장례',
    birthday: '생일',
    firstBirthday: '돌',
    other: '기타',
  };

  const isValid = Boolean(eventName && selectedType && selectedDate);

  const handleSave = async () => {
    if (!isValid) return;

    try {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      const dbDate = `${y}-${m}-${d}`;

      await insertSchedule({
        name: eventName,
        type: typeToKorean[selectedType] || selectedType,
        date: dbDate,
        relationship: relation,
        memo,
      });

      onSaved?.();
      onClose?.();
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
  };

  const cellSize = 32;

  return (
    <View style={styles.container}>
      <Header title="일정 등록" onBackPress={onClose} />

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
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet]}>
              이름
            </Text>
            <View style={[styles.searchContainer, isTablet && styles.searchContainerTablet]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="이름을 입력하세요"
                placeholderTextColor="#D1D5DB"
                value={eventName}
                onChangeText={setEventName}
              />
            </View>
          </View>

          {/* Event Type Selection */}
          <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet]}>
              종류
            </Text>
            <View style={styles.typeButtonsContainer}>
              {eventTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeButton,
                    selectedType === type.key && styles.typeButtonActive,
                  ]}
                  onPress={() => setSelectedType(type.key as EventType)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type.key && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet]}>
              날짜
            </Text>
            <TouchableOpacity
              style={[styles.inputBox, isTablet && styles.inputBoxTablet]}
              onPress={() => setIsCalendarOpen(!isCalendarOpen)}
            >
              <Text style={[styles.inputText, isTablet && styles.inputTextTablet]}>
                {formatDisplayDate(selectedDate)}
              </Text>
              <CalendarIcon size={isTablet ? 20 : 18} color="#6B7280" />
            </TouchableOpacity>

            {/* Inline Calendar */}
            {isCalendarOpen && (
              <View style={[styles.calendarContainer, isTablet && styles.calendarContainerTablet]}>
                {/* Calendar Header */}
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={goToPrevMonth} style={styles.calendarNavButton}>
                    <ChevronLeftIcon size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <Text style={[styles.calendarTitle, isTablet && styles.calendarTitleTablet]}>
                    {calendarYear}년 {calendarMonth + 1}월
                  </Text>
                  <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
                    <ChevronRightIcon size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Weekday Headers */}
                <View style={styles.calendarWeekdays}>
                  {WEEKDAYS.map((day) => (
                    <View key={day} style={[styles.calendarCell, { height: cellSize * 0.7 }]}>
                      <Text style={[
                        styles.calendarWeekdayText,
                        isTablet && styles.calendarWeekdayTextTablet,
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
                          selected && styles.calendarDaySelected,
                          isToday && !selected && styles.calendarDayToday,
                        ]}>
                          <Text style={[
                            styles.calendarDayText,
                            isTablet && styles.calendarDayTextTablet,
                            !item.currentMonth && styles.calendarDayTextDisabled,
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
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet]}>
              관계
            </Text>
            <View style={styles.typeButtonsContainer}>
              {relationOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.typeButton,
                    relation === opt && !isRelationDirectInput && styles.typeButtonActive,
                  ]}
                  onPress={() => handleRelationSelect(opt)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.typeButtonText,
                    relation === opt && !isRelationDirectInput && styles.typeButtonTextActive,
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.typeButton, isRelationDirectInput && styles.typeButtonActive]}
                onPress={handleRelationDirectInput}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeButtonText, isRelationDirectInput && styles.typeButtonTextActive]}>
                  직접입력
                </Text>
              </TouchableOpacity>
            </View>
            {isRelationDirectInput && (
              <TextInput
                style={[styles.relationDirectInput, isTablet && styles.inputTextTablet]}
                placeholder="관계를 입력하세요"
                placeholderTextColor="#D1D5DB"
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
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet]}>
              메모를 남겨보세요
            </Text>
            <TextInput
              style={[styles.memoInput, isTablet && styles.memoInputTablet]}
              placeholder="메모를 남겨보세요"
              placeholderTextColor="#D1D5DB"
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
                    type: selectedType,
                    date: dateStr,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionLabelTablet: {
    fontSize: 13,
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
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
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
    fontSize: 12,
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
    fontSize: 13,
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
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  inputTextTablet: {
    fontSize: 14,
  },
  placeholderText: {
    fontSize: 13,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  calendarTitleTablet: {
    fontSize: 17,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  calendarWeekdayTextTablet: {
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  calendarDayTextTablet: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registerEventButtonTextTablet: {
    fontSize: 15,
  },

  memoInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    fontSize: 13,
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  saveButtonTextTablet: {
    fontSize: 15,
  },
});
