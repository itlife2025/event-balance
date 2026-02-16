import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Switch,
} from 'react-native';
import { ChevronRightIcon, BellIcon } from '../components/Icons';
import { Header } from '../components/Header';


interface SettingsScreenProps {
  onBackPress?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBackPress }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const SettingItem = ({
    icon,
    label,
    value,
    onPress,
    isToggle = false,
    toggleValue = false,
    onToggleChange,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
    isToggle?: boolean;
    toggleValue?: boolean;
    onToggleChange?: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, isTablet && styles.settingItemTablet]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isToggle}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, isTablet && styles.settingIconTablet]}>
          {icon}
        </View>
        <Text style={[styles.settingLabel, isTablet && styles.settingLabelTablet]}>
          {label}
        </Text>
      </View>
      {isToggle ? (
        <Switch
          style={styles.toggle}
          value={toggleValue}
          onValueChange={onToggleChange}
        />
      ) : (
        <>
          {value && (
            <Text style={[styles.settingValue, isTablet && styles.settingValueTablet]}>
              {value}
            </Text>
          )}
          <ChevronRightIcon size={isTablet ? 22 : 20} color="#D1D5DB" />
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="설정" onBackPress={onBackPress} />

      {/* Content */}
      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Section */}
          <View style={[styles.section, isTablet && styles.sectionTablet]}>
            <TouchableOpacity style={[styles.profileCard, isTablet && styles.profileCardTablet]}>
              <View style={[styles.profileAvatar, isTablet && styles.profileAvatarTablet]}>
                <Text style={styles.profileInitial}>김</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, isTablet && styles.profileNameTablet]}>
                  김민수
                </Text>
                <Text style={[styles.profileSub, isTablet && styles.profileSubTablet]}>
                  프로필 수정
                </Text>
              </View>
              <ChevronRightIcon size={isTablet ? 24 : 20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>

          {/* Notification Section */}
          <View style={[styles.section, isTablet && styles.sectionTablet]}>
            <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>
              알림 설정
            </Text>
            <SettingItem
              icon={<BellIcon size={isTablet ? 22 : 20} color="#6366F1" />}
              label="알림 설정"
              isToggle={true}
              toggleValue={notificationEnabled}
              onToggleChange={setNotificationEnabled}
            />
            <SettingItem
              icon={
                <Text style={styles.sectionIcon}>🌐</Text>
              }
              label="알림 시점"
              value="D-1, 당일"
            />
            <SettingItem
              icon={
                <Text style={styles.sectionIcon}>🕐</Text>
              }
              label="알림 시간"
              value="오전 9시"
            />
          </View>

          {/* App Settings Section */}
          <View style={[styles.section, isTablet && styles.sectionTablet]}>
            <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>
              앱 설정
            </Text>
            <SettingItem
              icon={
                <Text style={styles.sectionIcon}>🔊</Text>
              }
              label="설정"
            />
            <SettingItem
              icon={
                <Text style={styles.sectionIcon}>💱</Text>
              }
              label="통화 단위"
              value="원 ( ₩ )"
            />
            <SettingItem
              icon={
                <Text style={styles.sectionIcon}>💰</Text>
              }
              label="금액 표시"
              value="+ / -, 천단위"
            />
            <SettingItem
              icon={
                <Text style={styles.sectionIcon}>🌙</Text>
              }
              label="다크모드"
              isToggle={true}
              toggleValue={darkModeEnabled}
              onToggleChange={setDarkModeEnabled}
            />
          </View>

          {/* Data Section */}
          <View style={[styles.section, isTablet && styles.sectionTablet]}>
            <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>
              데이터
            </Text>
            <SettingItem
              icon={
                <Text style={styles.sectionIcon}>☁️</Text>
              }
              label="데이터"
            />
            <SettingItem
              icon={
                <Text style={styles.sectionIcon}>💾</Text>
              }
              label="데이터 백업하기"
            />
          </View>

          {/* Info Section */}
          <View style={[styles.section, isTablet && styles.sectionTablet]}>
            <SettingItem
              icon={
                <Text style={styles.sectionIcon}>ℹ️</Text>
              }
              label="앱 정보"
            />
          </View>

          {/* Reset Button */}
          <View style={[styles.section, { marginBottom: 100 }, isTablet && styles.sectionTablet]}>
            <TouchableOpacity style={[styles.resetButton, isTablet && styles.resetButtonTablet]}>
              <Text style={[styles.resetButtonText, isTablet && styles.resetButtonTextTablet]}>
                초기화
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
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitleTablet: {
    fontSize: 13,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  settingItemTablet: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIconTablet: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sectionIcon: {
    fontSize: 16,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingLabelTablet: {
    fontSize: 14,
  },
  settingValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginRight: 6,
  },
  settingValueTablet: {
    fontSize: 13,
  },
  toggle: {
    marginRight: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  profileCardTablet: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarTablet: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366F1',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  profileNameTablet: {
    fontSize: 15,
  },
  profileSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },
  profileSubTablet: {
    fontSize: 13,
  },
  resetButton: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonTablet: {
    marginHorizontal: 14,
    marginVertical: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  resetButtonTextTablet: {
    fontSize: 15,
  },
});
