import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Switch,
  Linking,
  Platform,
  AppState,
  AppStateStatus,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import * as Notifications from 'expo-notifications';
import { ChevronRightIcon, BellIconColored } from '../components/Icons';
import { Header } from '../components/Header';
import { CustomAlert } from '../components/CustomAlert';
import { resetDatabase } from '../database/database';
import { getSetting, setSetting } from '../database/queries';

type TimingKey = 'd7' | 'd1' | 'dday';

const TIMING_OPTIONS: { key: TimingKey; label: string }[] = [
  { key: 'd7', label: 'D-7' },
  { key: 'd1', label: 'D-1' },
  { key: 'dday', label: '당일' },
];

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 6); // 6~22

function formatHour(h: number): string {
  if (h < 12) return `오전 ${h}시`;
  if (h === 12) return `오후 12시`;
  return `오후 ${h - 12}시`;
}

interface SettingsScreenProps {
  onBackPress?: () => void;
  onDataReset?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBackPress, onDataReset }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { colors, toggleTheme, isDark } = useTheme();

  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [profileName, setProfileName] = useState('');

  // Notification time settings
  const [repeatYearly, setRepeatYearly] = useState(true);
  const [notifTimings, setNotifTimings] = useState<TimingKey[]>(['dday']);
  const [notifHour, setNotifHour] = useState(9);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Alerts
  const [promptAlert, setPromptAlert] = useState(false);
  const [resetConfirmAlert, setResetConfirmAlert] = useState(false);
  const [resultAlert, setResultAlert] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });
  const [notifPermAlert, setNotifPermAlert] = useState(false);

  const appState = useRef<AppStateStatus>(AppState.currentState);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === 'granted');
    return status === 'granted';
  };

  useEffect(() => {
    (async () => {
      const [notif, dark, name, repeat, timings, hour] = await Promise.all([
        getSetting('notification_enabled'),
        getSetting('dark_mode_enabled'),
        getSetting('profile_name'),
        getSetting('notif_repeat_yearly'),
        getSetting('notif_timings'),
        getSetting('notif_hour'),
      ]);
      if (dark !== null) setDarkModeEnabled(dark === '1');
      setProfileName(name || '사용자');
      if (repeat !== null) setRepeatYearly(repeat === '1');
      if (timings) setNotifTimings(timings.split(',') as TimingKey[]);
      if (hour) setNotifHour(parseInt(hour, 10));

      const granted = await checkPermission();
      if (notif !== null) setNotificationEnabled(notif === '1' && granted);
    })();

    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        await checkPermission();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await checkPermission();
      if (!granted) {
        setNotifPermAlert(true);
        return;
      }
    }
    setNotificationEnabled(value);
    setSetting('notification_enabled', value ? '1' : '0');
  };

  const handleOpenNotificationSettings = () => {
    setNotifPermAlert(false);
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const handleRepeatToggle = (value: boolean) => {
    setRepeatYearly(value);
    setSetting('notif_repeat_yearly', value ? '1' : '0');
  };

  const toggleTiming = (key: TimingKey) => {
    const next = notifTimings.includes(key)
      ? notifTimings.filter(t => t !== key)
      : [...notifTimings, key];
    if (next.length === 0) return; // at least one must be selected
    setNotifTimings(next);
    setSetting('notif_timings', next.join(','));
  };

  const handleSelectHour = (h: number) => {
    setNotifHour(h);
    setSetting('notif_hour', String(h));
    setShowTimePicker(false);
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkModeEnabled(value);
    toggleTheme();
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
    showArrow = true,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
    isToggle?: boolean;
    toggleValue?: boolean;
    onToggleChange?: (value: boolean) => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, isTablet && styles.settingItemTablet, { borderTopColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isToggle}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, isTablet && styles.settingIconTablet, { backgroundColor: colors.iconButtonBg }]}>
          {icon}
        </View>
        <Text style={[styles.settingLabel, isTablet && styles.settingLabelTablet, { color: colors.text }]}>
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
            <Text style={[styles.settingValue, isTablet && styles.settingValueTablet, { color: colors.textTertiary }]}>
              {value}
            </Text>
          )}
          {showArrow && <ChevronRightIcon size={isTablet ? 22 : 20} color={colors.placeholder} />}
        </>
      )}
    </TouchableOpacity>
  );

  const showNotifTimeMenu = notificationEnabled && permissionGranted;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="설정" />

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
          <View style={[styles.section, isTablet && styles.sectionTablet, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={[styles.profileCard, isTablet && styles.profileCardTablet]} onPress={handleEditProfileName}>
              <Image
                source={require('../../assets/profile-icon.png')}
                style={[styles.profileAvatar, isTablet && styles.profileAvatarTablet]}
                resizeMode="contain"
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, isTablet && styles.profileNameTablet, { color: colors.text }]}>
                  {profileName}
                </Text>
                <Text style={[styles.profileSub, isTablet && styles.profileSubTablet, { color: colors.textTertiary }]}>
                  프로필 수정
                </Text>
              </View>
              <ChevronRightIcon size={isTablet ? 24 : 20} color={colors.placeholder} />
            </TouchableOpacity>
          </View>

          {/* Notification Section */}
          <View style={[styles.section, isTablet && styles.sectionTablet, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet, { color: colors.text }]}>
              알림 설정
            </Text>
            <SettingItem
              icon={<BellIconColored size={isTablet ? 22 : 20} color={colors.primary} />}
              label="알림 설정"
              isToggle={true}
              toggleValue={notificationEnabled}
              onToggleChange={handleNotificationToggle}
            />

            {showNotifTimeMenu && (
              <>
                {/* Repeat yearly */}
                <SettingItem
                  icon={<Text style={styles.sectionIcon}>🔁</Text>}
                  label="매년 반복"
                  isToggle={true}
                  toggleValue={repeatYearly}
                  onToggleChange={handleRepeatToggle}
                />

                {/* Timing multi-select */}
                <View style={[styles.settingItem, isTablet && styles.settingItemTablet, { borderTopColor: colors.borderLight }]}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, isTablet && styles.settingIconTablet, { backgroundColor: colors.iconButtonBg }]}>
                      <Text style={styles.sectionIcon}>📅</Text>
                    </View>
                    <Text style={[styles.settingLabel, isTablet && styles.settingLabelTablet, { color: colors.text }]}>
                      알림 시점
                    </Text>
                  </View>
                  <View style={styles.timingChips}>
                    {TIMING_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.timingChip,
                          { backgroundColor: colors.iconButtonBg, borderColor: colors.border },
                          notifTimings.includes(opt.key) && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                        ]}
                        onPress={() => toggleTiming(opt.key)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.timingChipText,
                          { color: colors.textTertiary },
                          notifTimings.includes(opt.key) && { color: colors.primary },
                        ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Notification time */}
                <TouchableOpacity
                  style={[styles.settingItem, isTablet && styles.settingItemTablet, { borderTopColor: colors.borderLight }]}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, isTablet && styles.settingIconTablet, { backgroundColor: colors.iconButtonBg }]}>
                      <Text style={styles.sectionIcon}>🕐</Text>
                    </View>
                    <Text style={[styles.settingLabel, isTablet && styles.settingLabelTablet, { color: colors.text }]}>
                      알림 시간
                    </Text>
                  </View>
                  <Text style={[styles.settingValue, isTablet && styles.settingValueTablet, { color: colors.textTertiary }]}>
                    {formatHour(notifHour)}
                  </Text>
                  <ChevronRightIcon size={isTablet ? 22 : 20} color={colors.placeholder} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* App Settings Section */}
          <View style={[styles.section, isTablet && styles.sectionTablet, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet, { color: colors.text }]}>
              앱 설정
            </Text>
<SettingItem
              icon={<Text style={styles.sectionIcon}>🌙</Text>}
              label="다크모드"
              isToggle={true}
              toggleValue={darkModeEnabled}
              onToggleChange={handleDarkModeToggle}
            />
          </View>

          {/* Info Section */}
          <View style={[styles.section, isTablet && styles.sectionTablet, { backgroundColor: colors.card }]}>
            <SettingItem icon={<Text style={styles.sectionIcon}>ℹ️</Text>} label="앱 버전" value="1.0" showArrow={false} />
          </View>

          {/* Reset Button */}
          <View style={[styles.section, { marginBottom: 100 }, isTablet && styles.sectionTablet, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.resetButton, isTablet && styles.resetButtonTablet, { backgroundColor: colors.border }]}
              onPress={() => setResetConfirmAlert(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetButtonText, isTablet && styles.resetButtonTextTablet, { color: colors.textSecondary }]}>
                초기화
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Time Picker Modal */}
      <Modal transparent visible={showTimePicker} animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setShowTimePicker(false)}>
          <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
            <FlatList
              data={HOUR_OPTIONS}
              keyExtractor={(item) => String(item)}
              initialScrollIndex={Math.max(0, HOUR_OPTIONS.indexOf(notifHour))}
              getItemLayout={(_, index) => ({ length: 50, offset: 50 * index, index })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, item === notifHour && { backgroundColor: colors.primaryLight }]}
                  onPress={() => handleSelectHour(item)}
                >
                  <Text style={[styles.pickerItemText, { color: colors.text }, item === notifHour && { color: colors.primary, fontWeight: '700' }]}>
                    {formatHour(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

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

      <CustomAlert
        visible={notifPermAlert}
        type="confirm"
        title="알림 권한 필요"
        message="이 앱의 알림이 허용되어 있지 않습니다. 휴대폰 설정에서 알림을 허용해 주세요."
        confirmText="설정"
        cancelText="취소"
        onConfirm={handleOpenNotificationSettings}
        onCancel={() => setNotifPermAlert(false)}
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
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitleTablet: {
    fontSize: 16,
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
    fontSize: 19,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingLabelTablet: {
    fontSize: 17,
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
    marginRight: 6,
  },
  settingValueTablet: {
    fontSize: 16,
  },
  toggle: {
    marginRight: 4,
  },

  // Timing chips
  timingChips: {
    flexDirection: 'row',
    gap: 6,
  },
  timingChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timingChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  timingChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  timingChipTextActive: {
    color: '#6366F1',
  },

  // Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: 180,
    maxHeight: 300,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerItem: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pickerItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  pickerItemText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: '#6366F1',
    fontWeight: '700',
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
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  profileNameTablet: {
    fontSize: 18,
  },
  profileSub: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },
  profileSubTablet: {
    fontSize: 16,
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
    fontSize: 17,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  resetButtonTextTablet: {
    fontSize: 18,
  },
});
