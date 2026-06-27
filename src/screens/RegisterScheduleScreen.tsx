import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Keyboard,
  Pressable,
  Alert,
  Platform,
  Modal,
  FlatList,
  Linking,
} from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { ChevronRightIcon, ChevronLeftIcon, CalendarIcon, SearchIcon, PhoneIcon } from '../components/Icons';
import { Header } from '../components/Header';
import { useTheme } from '../theme/ThemeContext';
import { EventType } from '../components/UpcomingEvents';
import { insertSchedule, updateSchedule, updateEventsByScheduleId } from '../database/queries';
import { scheduleAllNotifications } from '../services/NotificationService';

// expo-contacts는 웹에서 지원하지 않으므로 모바일에서만 동적 로드
let Contacts: any = null;
if (Platform.OS !== 'web') {
  Contacts = require('expo-contacts');
}

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
  onDelete?: (id: string) => void;
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
  onDelete,
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

  // 연락처 관련 state (모바일 전용)
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);

  // 화면 진입 시 연락처 권한이 undetermined이면 자동으로 시스템 다이얼로그 표시
  useEffect(() => {
    if (!isMobile || !Contacts) return;
    (async () => {
      const { status } = await Contacts.getPermissionsAsync();
      if (status === 'undetermined') {
        await Contacts.requestPermissionsAsync();
      }
    })();
  }, []);

  const openContactPicker = async () => {
    if (!isMobile || !Contacts) return;

    try {
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        if (canAskAgain) {
          Alert.alert('권한 필요', '연락처에 접근하려면 권한을 허용해주세요.');
        } else {
          // 영구 거부 상태 — OS별 설정 경로가 다르므로 앱 설정 화면을 직접 열어준다
          Alert.alert(
            '권한 필요',
            '연락처 권한이 꺼져 있습니다. 설정에서 연락처 접근을 허용해주세요.',
            [
              { text: '닫기', style: 'cancel' },
              { text: '설정 열기', onPress: () => Linking.openSettings() },
            ],
          );
        }
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.LastName,
      });

      if (data.length > 0) {
        setContacts(data);
        setFilteredContacts(data);
        setContactSearch('');
        setContactModalVisible(true);
      } else {
        Alert.alert('연락처 없음', '저장된 연락처가 없습니다.');
      }
    } catch (error) {
      console.error('Failed to open contact picker:', error);
      Alert.alert('오류', '연락처를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    if (contactSearch.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      setFilteredContacts(
        contacts.filter((c) =>
          c.name?.toLowerCase().includes(contactSearch.toLowerCase())
        )
      );
    }
  }, [contactSearch, contacts]);

  const selectContact = (contact: any) => {
    if (contact.name) {
      setEventName(contact.name);
    }
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      setPhone(contact.phoneNumbers[0].number || '');
    }
    setContactModalVisible(false);
  };

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
        await updateEventsByScheduleId(initialData.id, scheduleData);
      } else {
        await insertSchedule(scheduleData);
      }

      scheduleAllNotifications().catch(() => {});
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
              {isMobile ? (
                <TouchableOpacity onPress={openContactPicker} activeOpacity={0.6} style={styles.searchIconLeft}>
                  <SearchIcon size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.searchIconLeft}>
                  <SearchIcon size={20} color={colors.textSecondary} />
                </View>
              )}
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
              submitBehavior="blurAndSubmit"
            />
          </View>

          {/* Buttons */}
          <View style={{ marginBottom: 40, gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {isEditMode && onDelete && initialData?.id && (
                <TouchableOpacity
                  style={[styles.deleteButton, isTablet && styles.deleteButtonTablet, { flex: 1 }]}
                  onPress={() => {
                    Alert.alert(
                      '일정 삭제',
                      '이 일정을 삭제하시겠습니까?',
                      [
                        { text: '취소', style: 'cancel' },
                        {
                          text: '삭제',
                          style: 'destructive',
                          onPress: () => onDelete(initialData.id!),
                        },
                      ],
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.deleteButtonText, isTablet && styles.deleteButtonTextTablet]}>
                    삭제하기
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { flex: 1, backgroundColor: colors.primary },
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
            </View>
            {initialData && onRegisterEvent && (
              <TouchableOpacity
                style={[styles.registerEventButton, isTablet && styles.registerEventButtonTablet]}
                onPress={() => {
                  const days = ['일', '월', '화', '수', '목', '금', '토'];
                  const dayName = days[selectedDate.getDay()];
                  const dateStr = `${formatDisplayDate(selectedDate)} (${dayName})`;
                  onRegisterEvent({
                    id: initialData?.id,
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

      {/* 연락처 선택 모달 (모바일 전용) */}
      {isMobile && (
        <Modal
          visible={contactModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setContactModalVisible(false)}
        >
          <SafeAreaProvider>
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>연락처 선택</Text>
              <TouchableOpacity
                onPress={() => setContactModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCloseText, { color: colors.primary }]}>닫기</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.modalSearchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SearchIcon size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.modalSearchInput, { color: colors.text }]}
                placeholder="이름 검색..."
                placeholderTextColor={colors.textTertiary}
                value={contactSearch}
                onChangeText={setContactSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id ?? Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.contactItem, { borderBottomColor: colors.borderLight }]}
                  onPress={() => selectContact(item)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.contactAvatar, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.contactAvatarText, { color: colors.primary }]}>
                      {item.name?.charAt(0) || '?'}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.text }]}>{item.name || '이름 없음'}</Text>
                    {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                      <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
                        {item.phoneNumbers[0].number}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>검색 결과가 없습니다</Text>
                </View>
              }
              contentContainerStyle={styles.contactList}
            />
          </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      )}
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
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchContainerTablet: {
    minHeight: 52,
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
    minHeight: 48,
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
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  inputBoxTablet: {
    minHeight: 52,
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
  deleteButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButtonTablet: {
    paddingVertical: 14,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteButtonTextTablet: {
    fontSize: 18,
  },
  // 연락처 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 42,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 17,
    marginLeft: 8,
  },
  contactList: {
    paddingHorizontal: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 19,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 16,
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 17,
  },
});
