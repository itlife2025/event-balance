import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Keyboard,
  Platform,
  Modal,
  FlatList,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { ChevronRightIcon, ChevronLeftIcon, CalendarIcon } from '../components/Icons';
import { Header } from '../components/Header';
import { useTransactions } from '../context/TransactionContext';
import { EventType } from '../components/UpcomingEvents';

// expo-contacts는 웹에서 지원하지 않으므로 모바일에서만 동적 로드
let Contacts: any = null;
if (Platform.OS !== 'web') {
  Contacts = require('expo-contacts');
}

type TabType = 'pay' | 'receive';

export interface RegisterInitialData {
  name: string;
  type: EventType;
  date: string; // "YYYY.MM.DD (요일)" format
}

interface RegisterScreenProps {
  onClose?: () => void;
  initialData?: RegisterInitialData;
  onRegisterSchedule?: (data: RegisterInitialData) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onClose,
  initialData,
  onRegisterSchedule,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { addTransaction, transactions } = useTransactions();
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToEnd = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  // 데이터 확인용 로그 (임시)
  useEffect(() => {
    console.log('현재 저장된 DB 데이터:', JSON.stringify(transactions, null, 2));
  }, [transactions]);

  // Parse initialData date "YYYY.MM.DD (요일)" → Date
  const initialDate = React.useMemo(() => {
    if (!initialData?.date) return new Date();
    const datePart = initialData.date.split(' ')[0];
    const [y, m, d] = datePart.split('.').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
    return new Date();
  }, [initialData]);

  const [activeTab, setActiveTab] = useState<TabType>('pay');
  const [selectedType, setSelectedType] = useState<EventType>(initialData?.type || 'wedding');
  const [eventName, setEventName] = useState(initialData?.name || '');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [calendarYear, setCalendarYear] = useState(initialDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(initialDate.getMonth());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [amount, setAmount] = useState('0'); // Start with 0
  const [isDirectInput, setIsDirectInput] = useState(false);
  const [relation, setRelation] = useState('');
  const [memo, setMemo] = useState('');

  const dismissAll = () => {
    Keyboard.dismiss();
    setIsCalendarOpen(false);
  };

  // 연락처 관련 state (모바일 전용)
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);

  const openContactPicker = async () => {
    if (!isMobile || !Contacts) return;

    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '연락처에 접근하려면 권한을 허용해주세요.');
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
  const [isRelationDirectInput, setIsRelationDirectInput] = useState(false);

  const handleRelationSelect = (value: string) => {
    setRelation(value);
    setIsRelationDirectInput(false);
  };

  const handleRelationDirectInput = () => {
    setIsRelationDirectInput(true);
    setRelation('');
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
    setSelectedType('custom');
    setCustomEventType('');
  };

  const quickAmounts = [1, 5, 10];

  const handleQuickAmount = (quickAmount: number) => {
    setIsDirectInput(false);
    setAmount((prev) => {
      const current = prev ? parseInt(prev) : 0;
      return String(current + quickAmount);
    });
  };

  const handleDirectInputMode = () => {
    setIsDirectInput(true);
    setAmount(''); // Clear for direct input
  };

  const isValid = Boolean(eventName && amount && selectedDate);

  const handleSave = async () => {
    if (!isValid) return;

    const transactionData = {
      type: activeTab,
      amount: parseInt(amount) * 10000,
      date: formatDisplayDate(selectedDate),
      name: eventName,
      event_type: selectedType,
      custom_event_type: isEventTypeDirectInput ? customEventType : undefined,
      relation,
      memo,
    };

    console.log('RegisterScreen: Saving data...', transactionData);

    try {
      await addTransaction(transactionData);

      if (onClose) {
        onClose();
      } else {
        setEventName('');
        setAmount('0'); // Reset to 0
        setRelation('');
        setMemo('');
        setIsDirectInput(false);
        setIsEventTypeDirectInput(false);
        setCustomEventType('');
        setIsRelationDirectInput(false);
      }
    } catch (error) {
      console.error('Failed to save transaction:', error);
      // TODO: Show error to user
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="등록" onBackPress={onClose} />

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
          <View style={[styles.tabContainer, isTablet && styles.tabContainerTablet]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'pay' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('pay')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>🎁</Text>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'pay' && styles.tabLabelActive,
                ]}
              >
                받기
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'receive' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('receive')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>🌸</Text>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'receive' && styles.tabLabelActive,
                ]}
              >
                보내기
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, isTablet && styles.searchContainerTablet]}>
            <TextInput
              style={styles.searchInput}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#D1D5DB"
              value={eventName}
              onChangeText={setEventName}
            />
            {isMobile ? (
              <TouchableOpacity onPress={openContactPicker} activeOpacity={0.6} style={styles.searchIconRight}>
                <Text style={styles.searchIconText}>🔍</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.searchIconText, styles.searchIconRight]}>🔍</Text>
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
                  <Text
                    style={[
                      styles.typeButtonText,
                      relation === opt && !isRelationDirectInput && styles.typeButtonTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  isRelationDirectInput && styles.typeButtonActive,
                ]}
                onPress={handleRelationDirectInput}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    isRelationDirectInput && styles.typeButtonTextActive,
                  ]}
                >
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
                    selectedType === type.key && !isEventTypeDirectInput && styles.typeButtonActive,
                  ]}
                  onPress={() => handleEventTypeSelect(type.key as EventType)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type.key && !isEventTypeDirectInput && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  isEventTypeDirectInput && styles.typeButtonActive,
                ]}
                onPress={handleEventTypeDirectInput}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    isEventTypeDirectInput && styles.typeButtonTextActive,
                  ]}
                >
                  직접입력
                </Text>
              </TouchableOpacity>
            </View>
            {isEventTypeDirectInput && (
              <TextInput
                style={[styles.relationDirectInput, isTablet && styles.inputTextTablet]}
                placeholder="종류를 입력하세요"
                placeholderTextColor="#D1D5DB"
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
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet]}>
              날짜
            </Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.inputBox, isTablet && styles.inputBoxTablet, { flex: 1 }]}
                onPress={() => setIsCalendarOpen(!isCalendarOpen)}
              >
                <Text style={[styles.inputText, isTablet && styles.inputTextTablet]}>
                  {formatDisplayDate(selectedDate)}
                </Text>
                <CalendarIcon size={isTablet ? 20 : 18} color="#6B7280" />
              </TouchableOpacity>
              {onRegisterSchedule && (
                <TouchableOpacity
                  style={[styles.registerScheduleButton, isTablet && styles.registerScheduleButtonTablet]}
                  onPress={() => {
                    const days = ['일', '월', '화', '수', '목', '금', '토'];
                    const dayName = days[selectedDate.getDay()];
                    onRegisterSchedule({
                      name: eventName,
                      type: selectedType,
                      date: `${formatDisplayDate(selectedDate)} (${dayName})`,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.registerScheduleButtonText, isTablet && styles.registerScheduleButtonTextTablet]}>
                    일정 등록
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Inline Calendar */}
            {isCalendarOpen && (
              <View
                style={[styles.calendarContainer, isTablet && styles.calendarContainerTablet]}
              >
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
                <View style={styles.calendarWeekdays}>
                  {WEEKDAYS.map((day) => (
                    <View key={day} style={[styles.calendarCell, { height: cellSize * 0.7 }]}>
                      <Text style={[styles.calendarWeekdayText, isTablet && styles.calendarWeekdayTextTablet]}>
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

          {/* Amount */}
          <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
            <View style={{ marginBottom: 12 }}>
              {isDirectInput ? (
                <View style={[styles.inputBox, isTablet && styles.inputBoxTablet]}>
                  <TextInput
                    style={[styles.inputText, isTablet && styles.inputTextTablet, { flex: 1 }]}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="number-pad"
                    placeholder="금액을 입력하세요"
                    placeholderTextColor="#D1D5DB"
                    autoFocus
                    onFocus={scrollToEnd}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                  <Text style={[styles.inputText, { marginLeft: 8 }]}>만원</Text>
                </View>
              ) : (
                <Text style={[styles.amountDisplay, isTablet && styles.amountDisplayTablet]}>
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
                    isTablet && styles.quickAmountButtonTablet,
                  ]}
                  onPress={() => handleQuickAmount(quickAmount)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
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
                  isDirectInput && styles.quickAmountButtonActive,
                  isTablet && styles.quickAmountButtonTablet,
                ]}
                onPress={handleDirectInputMode}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    isDirectInput && styles.quickAmountTextActive,
                    isTablet && styles.quickAmountTextTablet,
                  ]}
                >
                  직접입력
                </Text>
              </TouchableOpacity>
            </View>
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
              returnKeyType="default"
              blurOnSubmit={false}
              onFocus={scrollToEnd}
            />
          </View>

          {/* Save Button */}
          <View style={{ marginBottom: 40 }}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                styles.saveButtonStandalone,
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 연락처 선택 모달 (모바일 전용) */}
      {isMobile && (
        <Modal
          visible={contactModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setContactModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>연락처 선택</Text>
              <TouchableOpacity
                onPress={() => setContactModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseText}>닫기</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchContainer}>
              <Text style={styles.modalSearchIcon}>🔍</Text>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="이름 검색..."
                placeholderTextColor="#9CA3AF"
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
                  style={styles.contactItem}
                  onPress={() => selectContact(item)}
                  activeOpacity={0.6}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {item.name?.charAt(0) || '?'}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name || '이름 없음'}</Text>
                    {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                      <Text style={styles.contactPhone}>
                        {item.phoneNumbers[0].number}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
                </View>
              }
              contentContainerStyle={styles.contactList}
            />
          </View>
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
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 13,
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
  searchIconRight: {
    marginLeft: 8,
  },
  searchIconText: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registerScheduleButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerScheduleButtonTablet: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  registerScheduleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registerScheduleButtonTextTablet: {
    fontSize: 13,
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
  amountDisplay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  amountDisplayTablet: {
    fontSize: 18,
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
    borderWidth: 1.5,
    borderColor: '#6366F1',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  quickAmountTextActive: {
    color: '#6366F1',
  },
  quickAmountTextTablet: {
    fontSize: 13,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366F1',
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
    fontSize: 14,
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  contactPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
