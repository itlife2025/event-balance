import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { ChevronRightIcon, CalendarIcon } from '../components/Icons';

type EventType = 'wedding' | 'funeral' | 'gift' | 'celebration';
type TabType = 'pay' | 'receive';
type NavTabKey = 'home' | 'list' | 'register' | 'stats' | 'settings';

interface RegisterScreenProps {
  onClose?: () => void;
  onNavPress?: (tab: NavTabKey) => void;
  onAddPress?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [activeTab, setActiveTab] = useState<TabType>('pay');
  const [selectedType, setSelectedType] = useState<EventType>('wedding');
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('2026.01.17');
  const [amount, setAmount] = useState('50');
  const [memo, setMemo] = useState('');

  const eventTypes = [
    { key: 'wedding', label: '결혼' },
    { key: 'funeral', label: '장례' },
    { key: 'gift', label: '돌선물' },
    { key: 'celebration', label: '기타' },
  ] as const;

  const quickAmounts = [3, 5, 10, 1];

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(String(quickAmount));
  };

  const handleSave = () => {
    console.log({
      tab: activeTab,
      type: selectedType,
      name: eventName,
      date,
      amount,
      memo,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isTablet && styles.headerTitleTablet]}>
            내역 추가
          </Text>
          <View style={{ width: 30 }} />
        </View>

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
              <TouchableOpacity style={[styles.inputBox, isTablet && styles.inputBoxTablet]}>
                <Text style={[styles.inputText, isTablet && styles.inputTextTablet]}>
                  {date}
                </Text>
                <CalendarIcon size={isTablet ? 20 : 18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={[styles.sectionContainer, isTablet && styles.sectionContainerTablet]}>
              <Text style={[styles.amountDisplay, isTablet && styles.amountDisplayTablet]}>
                ₩ {amount} 만원
              </Text>
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
              />
            </View>

          {/* Save Button */}
          <View style={[styles.section, { marginBottom: 40 }, isTablet && styles.sectionTablet]}>
            <TouchableOpacity
              style={[styles.saveButton, isTablet && styles.saveButtonTablet]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Text style={[styles.saveButtonText, isTablet && styles.saveButtonTextTablet]}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '500',
    width: 30,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerTitleTablet: {
    fontSize: 18,
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
  quickAmountText: {
    fontSize: 12,
    fontWeight: '600',
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
  saveButtonTablet: {
    marginHorizontal: 14,
    marginVertical: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextTablet: {
    fontSize: 15,
  },
});
