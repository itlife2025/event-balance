import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Keyboard,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  Linking,
} from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { ChevronRightIcon, ChevronLeftIcon, CalendarIcon, WeddingIcon, FuneralIcon, BirthIcon, BirthdayIcon, FirstBirthdayIcon, OtherIcon, SearchIcon, PhoneIcon } from '../components/Icons';
import { Header } from '../components/Header';
import { CustomAlert } from '../components/CustomAlert';
import { EventType } from '../components/UpcomingEvents';
import { insertEvent, updateEvent, insertSchedule, getAllSchedules, ScheduleRecord, updateScheduleByEventLink } from '../database/queries';
import { getDatabase } from '../database/database';
import { resolveEventType, getEventTypeLabel } from '../constants/eventTypes';

// expo-contacts는 웹에서 지원하지 않으므로 모바일에서만 동적 로드
let Contacts: any = null;
if (Platform.OS !== 'web') {
  Contacts = require('expo-contacts');
}

type TabType = 'send' | 'receive';

export interface RegisterInitialData {
  name: string;
  phone?: string;
  type: EventType;
  date: string; // "YYYY.MM.DD (요일)" format
  relationship?: string;
  memo?: string;
  editId?: string;
  amount?: number;       // in won (DB value)
  amountType?: 'send' | 'received';
  scheduleId?: string;
}

interface RegisterScreenProps {
  onClose?: () => void;
  onGoToList?: () => void;
  initialData?: RegisterInitialData;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onClose,
  onGoToList,
  initialData,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { colors } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);

  const scrollToEnd = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  // Parse initialData date "YYYY.MM.DD (요일)" → Date
  const initialDate = React.useMemo(() => {
    if (!initialData?.date) return new Date();
    const datePart = initialData.date.split(' ')[0];
    const [y, m, d] = datePart.split('.').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
    return new Date();
  }, [initialData]);

  const isEditMode = !!initialData?.editId;

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (initialData?.amountType === 'received') return 'receive';
    return 'send';
  });
  const [selectedType, setSelectedType] = useState<EventType | null>(initialData?.type || null);
  const [eventName, setEventName] = useState(initialData?.name || '');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [calendarYear, setCalendarYear] = useState(initialDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(initialDate.getMonth());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [amount, setAmount] = useState(() => {
    if (initialData?.amount) return String(initialData.amount / 10000);
    return '0';
  });
  const [isDirectInput, setIsDirectInput] = useState(false);
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [relation, setRelation] = useState(initialData?.relationship || '');
  const [memo, setMemo] = useState(initialData?.memo || '');
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'alert' | 'confirm';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({ visible: false, title: '' });

  const showAlert = (title: string, message?: string, onConfirm?: () => void) => {
    setAlertState({ visible: true, title, message, type: 'alert', onConfirm });
  };
  const hideAlert = () => {
    const callback = alertState.onConfirm;
    setAlertState({ visible: false, title: '' });
    callback?.();
  };

  // 연락처 관련 state (모바일 전용)
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);

  const openContactPicker = async () => {
    if (!isMobile || !Contacts) return;

    try {
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        if (canAskAgain) {
          showAlert('권한 필요', '연락처에 접근하려면 권한을 허용해주세요.');
        } else {
          // 영구 거부 상태 — OS별 설정 경로가 다르므로 앱 설정 화면을 직접 열어준다
          setAlertState({
            visible: true,
            title: '권한 필요',
            message: '연락처 권한이 꺼져 있습니다. 설정에서 연락처 접근을 허용해주세요.',
            type: 'confirm',
            confirmText: '설정 열기',
            cancelText: '닫기',
            onConfirm: () => {
              setAlertState({ visible: false, title: '' });
              Linking.openSettings();
            },
            onCancel: () => setAlertState({ visible: false, title: '' }),
          });
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
        showAlert('연락처 없음', '저장된 연락처가 없습니다.');
      }
    } catch (error) {
      console.error('Failed to open contact picker:', error);
      showAlert('오류', '연락처를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    (async () => {
      const db = await getDatabase();
      const allEvents = await db.getAllAsync('SELECT * FROM events ORDER BY date DESC');
      const allSchedules = await db.getAllAsync('SELECT * FROM schedules ORDER BY date ASC');
      console.log(`=== 저장된 데이터 (events: ${allEvents.length}건, schedules: ${allSchedules.length}건) ===`);
      console.log('[events]', JSON.stringify(allEvents, null, 2));
      console.log('[schedules]', JSON.stringify(allSchedules, null, 2));
    })();
  }, []);

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

  const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

  const getCalendarDays = (year: number, month: number) => {
    const rawFirstDay = new Date(year, month, 1).getDay();
    const firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days: { day: number; currentMonth: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, currentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, currentMonth: true });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        days.push({ day: d, currentMonth: false });
      }
    }
    return days;
  };

  const calendarDays = React.useMemo(
    () => getCalendarDays(calendarYear, calendarMonth),
    [calendarYear, calendarMonth]
  );

  const goToPrevMonth = () => {
    if (calendarMonth === 0) { setCalendarYear(calendarYear - 1); setCalendarMonth(11); }
    else { setCalendarMonth(calendarMonth - 1); }
  };

  const goToNextMonth = () => {
    if (calendarMonth === 11) { setCalendarYear(calendarYear + 1); setCalendarMonth(0); }
    else { setCalendarMonth(calendarMonth + 1); }
  };

  const handleDayPress = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return;
    setSelectedDate(new Date(calendarYear, calendarMonth, day));
    setIsCalendarOpen(false);
  };

  const isSelectedDay = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return false;
    return selectedDate.getFullYear() === calendarYear && selectedDate.getMonth() === calendarMonth && selectedDate.getDate() === day;
  };

  const today = React.useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const isTodayDay = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return false;
    return today.getFullYear() === calendarYear && today.getMonth() === calendarMonth && today.getDate() === day;
  };

  const formatDisplayDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  };

  const cellSize = 32;

  const relationOptions = ['본인', '배우자', '자녀', '부친', '모친', '조부', '조모', '빙부', '빙모'];
  const [isRelationDirectInput, setIsRelationDirectInput] = useState(() => {
    const preset = ['본인', '배우자', '자녀', '부친', '모친', '조부', '조모', '빙부', '빙모'];
    return !!initialData?.relationship && !preset.includes(initialData.relationship);
  });

  const handleRelationSelect = (value: string) => {
    setRelation(value);
    setIsRelationDirectInput(false);
  };

  const handleRelationDirectInput = () => {
    setIsRelationDirectInput(true);
    setRelation('');
  };

  // Recall Schedule modal
  const [recallModalVisible, setRecallModalVisible] = useState(false);
  const [schedulesList, setSchedulesList] = useState<ScheduleRecord[]>([]);
  const [registerScheduleChecked, setRegisterScheduleChecked] = useState(false);

  const getScheduleIcon = (type: string) => {
    const t = resolveEventType(type);
    if (t === 'wedding') return <WeddingIcon size={36} />;
    if (t === 'funeral') return <FuneralIcon size={36} />;
    if (t === 'birthday') return <BirthdayIcon size={36} />;
    if (t === 'firstBirthday') return <FirstBirthdayIcon size={36} />;
    if (t === 'birth') return <BirthIcon size={36} />;
    return <OtherIcon size={36} />;
  };

  const getScheduleIconBg = (_type: string): string => {
    return 'transparent';
  };

  const openRecallModal = async () => {
    try {
      const schedules = await getAllSchedules();
      setSchedulesList(schedules);
      setRecallModalVisible(true);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      showAlert('오류', '일정을 불러오는데 실패했습니다.');
    }
  };

  const handleScheduleSelect = (schedule: ScheduleRecord) => {
    setEventName(schedule.name);
    setPhone(schedule.phone || '');
    const eventType = resolveEventType(schedule.type);
    setSelectedType(eventType);
    setIsEventTypeDirectInput(false);
    setCustomEventType('');
    const parts = schedule.date.split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      setSelectedDate(date);
      setCalendarYear(date.getFullYear());
      setCalendarMonth(date.getMonth());
    }
    const presetRelations = ['본인', '배우자', '자녀', '부친', '모친', '조부', '조모', '빙부', '빙모'];
    setRelation(schedule.relationship);
    setIsRelationDirectInput(
      schedule.relationship !== '' && !presetRelations.includes(schedule.relationship)
    );
    setMemo(schedule.memo);
    setRecallModalVisible(false);
  };

  const eventTypes = [
    { key: 'wedding', label: '결혼' },
    { key: 'birth', label: '출산' },
    { key: 'firstBirthday', label: '돌잔치' },
    { key: 'birthday', label: '생일' },
    { key: 'funeral', label: '장례' },
  ] as const;
  const [isEventTypeDirectInput, setIsEventTypeDirectInput] = useState(false);
  const [customEventType, setCustomEventType] = useState('');

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

  const quickAmounts = [1, 5, 10];

  const handleQuickAmount = (quickAmount: number) => {
    setIsDirectInput(false);
    setSelectedQuickAmount(quickAmount);
    setAmount((prev) => {
      const current = parseInt(prev) || 0;
      return String(current + quickAmount);
    });
  };

  const handleDirectInputMode = () => {
    setIsDirectInput(true);
    setSelectedQuickAmount(null);
    setAmount(''); // Clear for direct input
  };

  const isValid = Boolean(eventName.trim() && amount && selectedDate && (selectedType || (isEventTypeDirectInput && customEventType.trim())));

  const handleSave = async () => {
    if (!isValid) return;

    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const dbDate = `${y}-${m}-${d}`;
    const eventType = isEventTypeDirectInput
      ? (customEventType.trim() || 'other')
      : (selectedType || 'other');
    const amountType: 'send' | 'received' = activeTab === 'receive' ? 'received' : 'send';

    try {
      const eventData = {
        name: eventName.trim(),
        phone,
        type: eventType,
        date: dbDate,
        amount: (parseInt(amount) || 0) * 10000,
        amountType,
        relationship: relation,
        memo,
        scheduleId: initialData?.scheduleId,
      };

      if (isEditMode && initialData?.editId) {
        await updateEvent(initialData.editId, eventData);
        // Sync shared fields to the linked schedule
        await updateScheduleByEventLink(initialData.editId, {
          name: eventName.trim(),
          phone,
          type: eventType,
          date: dbDate,
          relationship: relation,
          memo,
        });
      } else {
        await insertEvent(eventData);

        // Only create a new schedule if not already linked to one
        if (registerScheduleChecked && !initialData?.scheduleId) {
          await insertSchedule({
            name: eventName,
            phone,
            type: eventType,
            date: dbDate,
            relationship: relation,
            memo,
          });
        }
      }

      if (isEditMode) {
        showAlert('수정 완료', '수정되었습니다.', () => {
          onClose?.();
        });
      } else {
        const resetForm = () => {
          setEventName('');
          setPhone('');
          setAmount('0');
          setRelation('');
          setMemo('');
          setIsDirectInput(false);
          setSelectedQuickAmount(null);
          setIsEventTypeDirectInput(false);
          setCustomEventType('');
          setIsRelationDirectInput(false);
          setRegisterScheduleChecked(false);
          setSelectedType(null);
          setActiveTab('send');
        };

        setAlertState({
          visible: true,
          title: '저장 완료',
          message: '저장되었습니다.',
          type: 'confirm',
          confirmText: '계속 저장',
          cancelText: '내역보기',
          onConfirm: () => {
            setAlertState({ visible: false, title: '' });
            resetForm();
          },
          onCancel: () => {
            setAlertState({ visible: false, title: '' });
            onGoToList?.();
          },
        });
      }
    } catch (error) {
      console.error('Failed to save transaction:', error);
      showAlert('오류', '저장에 실패했습니다.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Header title={isEditMode ? "수정" : "등록"} onBackPress={isEditMode ? onClose : undefined} />

      {/* Content Area */}
      <KeyboardAvoidingView
        style={styles.contentArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ScrollView */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
          keyboardDismissMode="on-drag"
        >
          {/* Tab Buttons */}
          <View style={[styles.tabContainer, isTablet && styles.tabContainerTablet, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                activeTab === 'send' && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
              ]}
              onPress={() => setActiveTab('send')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>🌸</Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: colors.textSecondary },
                  activeTab === 'send' && { color: colors.primary },
                ]}
              >
                보내기
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                activeTab === 'receive' && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
              ]}
              onPress={() => setActiveTab('receive')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>🎁</Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: colors.textSecondary },
                  activeTab === 'receive' && { color: colors.primary },
                ]}
              >
                받기
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
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

          {/* Phone */}
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
                    { backgroundColor: colors.card, borderColor: colors.placeholder },
                    relation === opt && !isRelationDirectInput && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => handleRelationSelect(opt)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: colors.textSecondary },
                      relation === opt && !isRelationDirectInput && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: colors.card, borderColor: colors.placeholder },
                  isRelationDirectInput && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                ]}
                onPress={handleRelationDirectInput}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: colors.textSecondary },
                    isRelationDirectInput && { color: colors.primary, fontWeight: '600' },
                  ]}
                >
                  직접입력
                </Text>
              </TouchableOpacity>
            </View>
            {isRelationDirectInput && (
              <TextInput
                style={[styles.relationDirectInput, isTablet && styles.inputTextTablet, { backgroundColor: colors.card, color: colors.text, borderColor: colors.primary }]}
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
                    { backgroundColor: colors.card, borderColor: colors.placeholder },
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
                  { backgroundColor: colors.card, borderColor: colors.placeholder },
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
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.inputBox, isTablet && styles.inputBoxTablet, { flex: 1, backgroundColor: colors.card, borderColor: colors.borderLight }]}
                onPress={() => setIsCalendarOpen(!isCalendarOpen)}
              >
                <Text style={[styles.inputText, isTablet && styles.inputTextTablet, { color: colors.text }]}>
                  {formatDisplayDate(selectedDate)}
                </Text>
                <CalendarIcon size={isTablet ? 20 : 18} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Recall Schedule — text button */}
              <TouchableOpacity
                style={[styles.recallButton, isTablet && styles.recallButtonTablet, { backgroundColor: colors.warning }]}
                onPress={openRecallModal}
                activeOpacity={0.7}
              >
                <Text style={[styles.recallButtonText, isTablet && styles.recallButtonTextTablet]}>
                  일정 불러오기
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inline Calendar */}
            {isCalendarOpen && (
              <View
                style={[styles.calendarContainer, isTablet && styles.calendarContainerTablet, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
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
                <View style={styles.calendarWeekdays}>
                  {WEEKDAYS.map((day) => (
                    <View key={day} style={[styles.calendarCell, { height: cellSize * 0.7 }]}>
                      <Text style={[styles.calendarWeekdayText, isTablet && styles.calendarWeekdayTextTablet, { color: colors.textTertiary }]}>
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.calendarDaysGrid}>
                  {calendarDays.map((item, index) => {
                    const selected = isSelectedDay(item.day, item.currentMonth);
                    const isToday = isTodayDay(item.day, item.currentMonth);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.calendarCell, { height: cellSize }]}
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

            {/* Register Schedule checkbox */}
            <View style={styles.checkboxRow}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.checkboxContent}
                onPress={() => setRegisterScheduleChecked(!registerScheduleChecked)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, { borderColor: colors.placeholder, backgroundColor: colors.card }, registerScheduleChecked && { borderColor: colors.primary, backgroundColor: colors.primary }]}>
                  {registerScheduleChecked && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>일정 등록</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount */}
          <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
            <View style={{ marginBottom: 12 }}>
              {isDirectInput ? (
                <View style={[styles.inputBox, isTablet && styles.inputBoxTablet, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                  <TextInput
                    style={[styles.inputText, isTablet && styles.inputTextTablet, { flex: 1, color: colors.text }]}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="number-pad"
                    placeholder="금액을 입력하세요"
                    placeholderTextColor={colors.placeholder}
                    autoFocus
                    onFocus={scrollToEnd}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                  <Text style={[styles.inputText, { marginLeft: 8, color: colors.text }]}>만원</Text>
                </View>
              ) : (
                <Text style={[styles.amountDisplay, isTablet && styles.amountDisplayTablet, { color: colors.text }]}>
                  ₩ {amount} 만원
                </Text>
              )}
            </View>

            <View style={styles.quickAmountContainer}>
              {quickAmounts.map((quickAmount, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickAmountButton,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    selectedQuickAmount === quickAmount && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                    isTablet && styles.quickAmountButtonTablet,
                  ]}
                  onPress={() => handleQuickAmount(quickAmount)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      { color: colors.textSecondary },
                      selectedQuickAmount === quickAmount && { color: colors.primary, fontWeight: '600' },
                      isTablet && styles.quickAmountTextTablet,
                    ]}
                  >
                    +{quickAmount}만
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.quickAmountButton,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  isDirectInput && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  isTablet && styles.quickAmountButtonTablet,
                ]}
                onPress={handleDirectInputMode}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    { color: colors.textSecondary },
                    isDirectInput && { color: colors.primary, fontWeight: '600' },
                    isTablet && styles.quickAmountTextTablet,
                  ]}
                >
                  직접입력
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.amountResetButton,
                  { borderColor: colors.placeholder, backgroundColor: colors.card },
                  isTablet && styles.quickAmountButtonTablet,
                ]}
                onPress={() => { setAmount('0'); setIsDirectInput(false); setSelectedQuickAmount(null); }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.amountResetText,
                    { color: colors.textSecondary },
                    isTablet && styles.quickAmountTextTablet,
                  ]}
                >
                  초기화
                </Text>
              </TouchableOpacity>
            </View>
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
              returnKeyType="default"
              submitBehavior="newline"
              onFocus={scrollToEnd}
            />
          </View>

          {/* Reset + Save Buttons */}
          <View style={{ marginBottom: 40, flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.resetButton, isTablet && styles.resetButtonTablet, { flex: 1, backgroundColor: colors.border }]}
              onPress={() => {
                setEventName('');
                setPhone('');
                setAmount('0');
                setRelation('');
                setMemo('');
                setIsDirectInput(false);
                setSelectedQuickAmount(null);
                setIsEventTypeDirectInput(false);
                setCustomEventType('');
                setIsRelationDirectInput(false);
                setRegisterScheduleChecked(false);
                setSelectedType(null);
                setSelectedDate(new Date());
                setCalendarYear(new Date().getFullYear());
                setCalendarMonth(new Date().getMonth());
                setIsCalendarOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetButtonText, isTablet && styles.resetButtonTextTablet, { color: colors.textSecondary }]}>
                초기화
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                styles.saveButtonStandalone,
                { backgroundColor: colors.primary },
                !isValid && styles.saveButtonDisabled,
                isTablet && styles.saveButtonTablet,
                { flex: 1 },
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
                {isEditMode ? '수정하기' : '저장하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 일정 불러오기 모달 */}
      <Modal
        visible={recallModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setRecallModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>일정 불러오기</Text>
            <TouchableOpacity
              onPress={() => setRecallModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalCloseText, { color: colors.primary }]}>닫기</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={schedulesList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.scheduleItem, { borderBottomColor: colors.borderLight }]}
                onPress={() => handleScheduleSelect(item)}
                activeOpacity={0.6}
              >
                <View style={[styles.scheduleIconContainer, { backgroundColor: getScheduleIconBg(item.type) }]}>
                  {getScheduleIcon(item.type)}
                </View>
                <View style={styles.scheduleItemLeft}>
                  <Text style={[styles.scheduleItemName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.scheduleItemMeta, { color: colors.textSecondary }]}>
                    {getEventTypeLabel(resolveEventType(item.type))}{item.relationship ? ` · ${item.relationship}` : ''}
                  </Text>
                </View>
                <Text style={[styles.scheduleItemDate, { color: colors.textTertiary }]}>
                  {item.date.replace(/-/g, '.')}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>등록된 일정이 없습니다</Text>
              </View>
            }
            contentContainerStyle={styles.contactList}
          />
        </SafeAreaView>
      </Modal>

      <CustomAlert
        visible={alertState.visible}
        type={alertState.type || 'alert'}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm || hideAlert}
        onCancel={alertState.onCancel}
      />

      {/* 연락처 선택 모달 (모바일 전용) */}
      {isMobile && (
        <Modal
          visible={contactModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setContactModalVisible(false)}
        >
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
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabContainerTablet: {
    padding: 14,
    gap: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  tabIcon: {
    fontSize: 19,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#6366F1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
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
  searchIconImage: {
    width: 20,
    height: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
    marginBottom: 8,
  },
  sectionLabelTablet: {
    fontSize: 16,
    marginBottom: 10,
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
  },
  typeButtonTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  relationDirectInput: {
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recallButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  recallButtonTablet: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  recallButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recallButtonTextTablet: {
    fontSize: 16,
  },
  scheduleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  checkboxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#6366F1',
    backgroundColor: '#6366F1',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 14,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scheduleItemLeft: {
    flex: 1,
  },
  scheduleItemName: {
    fontSize: 18,
    fontWeight: '600',
  },
  scheduleItemMeta: {
    fontSize: 15,
    marginTop: 2,
  },
  scheduleItemDate: {
    fontSize: 16,
    marginLeft: 12,
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
    fontWeight: '500',
  },
  inputTextTablet: {
    fontSize: 17,
  },
  placeholderText: {
    fontSize: 16,
  },
  amountDisplay: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  amountDisplayTablet: {
    fontSize: 17,
    marginBottom: 12,
  },
  quickAmountContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  quickAmountButtonTablet: {
    paddingVertical: 11,
  },
  quickAmountButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: '600',
  },
  quickAmountTextActive: {
  },
  amountResetButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountResetText: {
    fontSize: 15,
    fontWeight: '600',
  },
  quickAmountTextTablet: {
    fontSize: 16,
  },
  memoInput: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 16,
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
  resetButton: {
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonTablet: {
    paddingVertical: 14,
    borderRadius: 12,
  },
  resetButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  resetButtonTextTablet: {
    fontSize: 18,
  },
  saveButton: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonStandalone: {
    marginHorizontal: 0,
    marginVertical: 0,
  },
  saveButtonTablet: {
    marginHorizontal: 14,
    marginVertical: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#6366F1', // Keep original color
    opacity: 0.5, // Reduce opacity
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
  },
  saveButtonTextTablet: {
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
  modalSearchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 17,
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
