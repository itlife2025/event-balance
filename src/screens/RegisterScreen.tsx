import React, { useState, useEffect } from 'react';
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
import { ChevronRightIcon, CalendarIcon } from '../components/Icons';
import { Header } from '../components/Header';
import { useTransactions } from '../context/TransactionContext';
import { EventType } from '../components/UpcomingEvents';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

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

  // 데이터 확인용 로그 (임시)
  useEffect(() => {
    console.log('현재 저장된 DB 데이터:', JSON.stringify(transactions, null, 2));
  }, [transactions]);

  // Parse initialData date "YYYY.MM.DD (요일)" → "YYYY.MM.DD"
  const initialDateStr = initialData?.date
    ? initialData.date.split(' ')[0]
    : new Date().toISOString().split('T')[0].replace(/-/g, '.');

  const [activeTab, setActiveTab] = useState<TabType>('pay');
  const [selectedType, setSelectedType] = useState<EventType>(initialData?.type || 'wedding');
  const [eventName, setEventName] = useState(initialData?.name || '');
  const [date, setDate] = useState(initialDateStr);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [amount, setAmount] = useState('0'); // Start with 0
  const [isDirectInput, setIsDirectInput] = useState(false);
  const [relation, setRelation] = useState('');
  const [memo, setMemo] = useState('');

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selectedDate: Date) => {
    const formattedDate = selectedDate.toISOString().split('T')[0].replace(/-/g, '.');
    setDate(formattedDate);
    hideDatePicker();
  };

  const eventTypes = [
    { key: 'wedding', label: '결혼' },
    { key: 'funeral', label: '장례' },
    { key: 'gift', label: '돌선물' },
    { key: 'celebration', label: '기타' },
  ] as const;

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

  const isValid = Boolean(eventName && amount && date);

  const handleSave = async () => {
    if (!isValid) return;

    const transactionData = {
      type: activeTab,
      amount: parseInt(amount) * 10000,
      date,
      name: eventName,
      event_type: selectedType,
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
      <View style={styles.contentArea}>
        {/* ScrollView */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
          ]}
          showsVerticalScrollIndicator={false}
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
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#D1D5DB"
              value={eventName}
              onChangeText={setEventName}
            />
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
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.inputBox, isTablet && styles.inputBoxTablet, { flex: 1 }]}
                onPress={showDatePicker}
              >
                <Text style={[styles.inputText, isTablet && styles.inputTextTablet]}>
                  {date}
                </Text>
                <CalendarIcon size={isTablet ? 20 : 18} color="#6B7280" />
              </TouchableOpacity>
              {onRegisterSchedule && (
                <TouchableOpacity
                  style={[styles.registerScheduleButton, isTablet && styles.registerScheduleButtonTablet]}
                  onPress={() => {
                    const days = ['일', '월', '화', '수', '목', '금', '토'];
                    const dateParts = date.split('.');
                    const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    const dayName = days[d.getDay()];
                    onRegisterSchedule({
                      name: eventName,
                      type: selectedType,
                      date: `${date} (${dayName})`,
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
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
              locale="ko_KR"
              confirmTextIOS="확인"
              cancelTextIOS="취소"
            />
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

          {/* Relation */}
          <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet]}>
              관계
            </Text>
            <TouchableOpacity style={[styles.inputBox, isTablet && styles.inputBoxTablet]}>
              <Text style={[styles.placeholderText, isTablet && styles.inputTextTablet]}>
                친구 / 직장 / 가족...
              </Text>
              <ChevronRightIcon size={isTablet ? 20 : 18} color="#9CA3AF" />
            </TouchableOpacity>
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
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
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
});
