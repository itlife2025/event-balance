import React, { useState, useEffect } from 'react';
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
import { CustomAlert } from '../components/CustomAlert';
import { resetDatabase } from '../database/database';
import { getSetting, setSetting } from '../database/queries';


interface SettingsScreenProps {
  onBackPress?: () => void;
  onDataReset?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBackPress, onDataReset }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [promptAlert, setPromptAlert] = useState(false);
  const [resetConfirmAlert, setResetConfirmAlert] = useState(false);
  const [resultAlert, setResultAlert] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  useEffect(() => {
    (async () => {
      const [notif, dark, name] = await Promise.all([
        getSetting('notification_enabled'),
        getSetting('dark_mode_enabled'),
        getSetting('profile_name'),
      ]);
      if (notif !== null) setNotificationEnabled(notif === '1');
      if (dark !== null) setDarkModeEnabled(dark === '1');
      setProfileName(name || '사용자');
    })();
  }, []);

  const handleNotificationToggle = (value: boolean) => {
    setNotificationEnabled(value);
    setSetting('notification_enabled', value ? '1' : '0');
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkModeEnabled(value);
    setSetting('dark_mode_enabled', value ? '1' : '0');
  };

  const handleEditProfileName = () => {
    setPromptAlert(true);
  };

  const handleProfileNameSubmit = (newName: string) => {
    setPromptAlert(false);
    if (newName.trim()) {
      const trimmed = newName.trim();
      setProfileName(trimmed);
      setSetting('profile_name', trimmed);
    }
  };

  const handleResetConfirm = async () => {
    setResetConfirmAlert(false);
    try {
      await resetDatabase();
      setResultAlert({ visible: true, title: '완료', message: '데이터가 초기화되었습니다.' });
      onDataReset?.();
    } catch (error) {
      console.error('Reset failed:', error);
      setResultAlert({ visible: true, title: '오류', message: '초기화에 실패했습니다.' });
    }
  };

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
            <TouchableOpacity style={[styles.profileCard, isTablet && styles.profileCardTablet]} onPress={handleEditProfileName}>
              <View style={[styles.profileAvatar, isTablet && styles.profileAvatarTablet]}>
                <Text style={styles.profileInitial}>{profileName.charAt(0) || '?'}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, isTablet && styles.profileNameTablet]}>
                  {profileName}
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
              onToggleChange={handleNotificationToggle}
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
              onToggleChange={handleDarkModeToggle}
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
            <TouchableOpacity
              style={[styles.resetButton, isTablet && styles.resetButtonTablet]}
              onPress={() => setResetConfirmAlert(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetButtonText, isTablet && styles.resetButtonTextTablet]}>
                초기화
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <CustomAlert
        visible={promptAlert}
        type="prompt"
        title="프로필 이름 수정"
        message="새 이름을 입력하세요"
        inputDefaultValue={profileName}
        onSubmit={handleProfileNameSubmit}
        onCancel={() => setPromptAlert(false)}
      />

      <CustomAlert
        visible={resetConfirmAlert}
        type="confirm"
        title="데이터 초기화"
        message="모든 데이터가 삭제되고 초기 데이터로 복원됩니다. 계속하시겠습니까?"
        confirmText="초기화"
        destructive
        onConfirm={handleResetConfirm}
        onCancel={() => setResetConfirmAlert(false)}
      />

      <CustomAlert
        visible={resultAlert.visible}
        type="alert"
        title={resultAlert.title}
        message={resultAlert.message}
        onConfirm={() => setResultAlert({ visible: false, title: '', message: '' })}
      />
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
