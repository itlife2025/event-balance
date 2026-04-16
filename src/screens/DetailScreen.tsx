import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Swipeable } from 'react-native-gesture-handler';
import { WeddingIcon, FuneralIcon, BirthIcon, BirthdayIcon, FirstBirthdayIcon, OtherIcon } from '../components/Icons';
import { Header } from '../components/Header';
import { CustomAlert } from '../components/CustomAlert';
import { getEventsByPhone, getEventsByNameAndPhone, deleteEvent, type PersonDetail } from '../database/queries';
import { type EventTypeKey, getEventTypeLabel } from '../constants/eventTypes';

const formatPhone = (num: string): string => {
  const digits = num.replace(/\D/g, '');
  if (digits.startsWith('02')) {
    if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    return digits.replace(/(\d{2})(\d{3,4})(\d{4})/, '$1-$2-$3');
  }
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  return num;
};

interface EditEventData {
  id: string;
  name: string;
  phone: string;
  type: EventTypeKey;
  typeName: string;
  date: string;
  amount: number;
  isSent: boolean;
  relationship: string;
  memo: string;
}

interface DetailScreenProps {
  name: string;
  phone: string;
  onClose?: () => void;
  onEdit?: (data: EditEventData) => void;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({
  name,
  phone,
  onClose,
  onEdit,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PersonDetail | null>(null);
  const [deleteAlert, setDeleteAlert] = useState<{ visible: boolean; recordId: string }>({ visible: false, recordId: '' });
  const [errorAlert, setErrorAlert] = useState(false);

  // 열린 Swipeable을 추적하여 다른 행 스와이프 시 닫기
  const openSwipeableRef = useRef<Swipeable | null>(null);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const loadData = async () => {
    try {
      console.log('[DetailScreen] name:', name, 'phone:', phone);
      const result = await getEventsByNameAndPhone(name, phone);
      console.log('[DetailScreen] records count:', result.records.length);
      setData(result);
    } catch (error) {
      console.error('Failed to load person detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [name, phone]);

  const handleEdit = (record: PersonDetail['records'][0]) => {
    openSwipeableRef.current?.close();
    openSwipeableRef.current = null;
    console.log('[DetailScreen] edit record:', JSON.stringify({ id: record.id, name: record.name, phone: record.phone }));
    if (onEdit) {
      onEdit({
        id: record.id,
        name: record.name,
        phone: record.phone,
        type: record.type,
        typeName: record.typeName,
        date: record.date,
        amount: record.amount,
        isSent: record.isSent,
        relationship: record.relationship,
        memo: record.memo,
      });
    }
  };

  const handleDelete = (recordId: string) => {
    openSwipeableRef.current?.close();
    openSwipeableRef.current = null;
    setDeleteAlert({ visible: true, recordId });
  };

  const confirmDelete = async () => {
    const { recordId } = deleteAlert;
    setDeleteAlert({ visible: false, recordId: '' });
    try {
      await deleteEvent(recordId);
      const result = await getEventsByNameAndPhone(name, phone);
      if (result.records.length === 0) {
        onClose?.();
      } else {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      setErrorAlert(true);
    }
  };

  const personName = name;
  const sentAmount = data?.sentTotal ?? 0;
  const receivedAmount = data?.receivedTotal ?? 0;
  const balance = sentAmount - receivedAmount;
  const records = data?.records ?? [];

  const getEventIcon = (type: EventTypeKey) => {
    const s = isTablet ? 48 : 40;
    if (type === 'wedding') return <WeddingIcon size={s} />;
    if (type === 'funeral') return <FuneralIcon size={s} />;
    if (type === 'birthday') return <BirthdayIcon size={s} />;
    if (type === 'firstBirthday') return <FirstBirthdayIcon size={s} />;
    if (type === 'birth') return <BirthIcon size={s} />;
    return <OtherIcon size={s} />;
  };

  const getAmountColor = (isSent: boolean) => {
    return isSent ? colors.sent : colors.received;
  };

  const getAmountSign = (isSent: boolean) => {
    return isSent ? '-' : '+';
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
    record: PersonDetail['records'][0],
  ) => {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeEditButton, { backgroundColor: colors.primary }]}
          onPress={() => handleEdit(record)}
          activeOpacity={0.7}
        >
          <Text style={styles.swipeButtonText}>수정</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeDeleteButton, { backgroundColor: colors.danger }]}
          onPress={() => handleDelete(record.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.swipeButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <Header title={personName} onBackPress={onClose} />

        {/* Content */}
        <View style={styles.contentWrapper}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              isTablet && styles.scrollContentTablet,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View
                style={[
                  styles.profileAvatar,
                  isTablet && styles.profileAvatarTablet,
                  { backgroundColor: colors.profileAvatarBg },
                ]}
              >
                <Text style={[styles.profileInitial, { color: colors.primary }]}>{personName.charAt(0)}</Text>
              </View>
              <Text style={[styles.profileName, isTablet && styles.profileNameTablet, { color: colors.text }]}>
                {personName}
              </Text>
              {phone ? (
                <Text style={[styles.profilePhone, isTablet && styles.profilePhoneTablet, { color: colors.textTertiary }]}>
                  {formatPhone(phone)}
                </Text>
              ) : null}
            </View>

            {/* Balance Card */}
            <View style={[styles.balanceCard, isTablet && styles.balanceCardTablet, { backgroundColor: colors.card }]}>
              <Text style={[styles.balanceTitle, isTablet && styles.balanceTitleTablet, { color: colors.text }]}>
                주고받은 합계 (Total)
              </Text>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={[styles.balanceLabel, isTablet && styles.balanceLabelTablet, { color: colors.textSecondary }]}>
                    보낸 금액:
                  </Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      isTablet && styles.balanceAmountTablet,
                      { color: colors.sent },
                    ]}
                  >
                    -{sentAmount.toLocaleString()} 원
                  </Text>
                </View>
              </View>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={[styles.balanceLabel, isTablet && styles.balanceLabelTablet, { color: colors.textSecondary }]}>
                    받은 금액:
                  </Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      isTablet && styles.balanceAmountTablet,
                      { color: colors.received },
                    ]}
                  >
                    +{receivedAmount.toLocaleString()} 원
                  </Text>
                </View>
              </View>
            </View>

            {/* History Section */}
            <View style={[styles.historySection, isTablet && styles.historySectionTablet]}>
              <Text style={[styles.historyTitle, isTablet && styles.historyTitleTablet, { color: colors.text }]}>
                [ 히스토리 (History) ]
              </Text>

              <View style={styles.recordsList}>
                {records.map((record) => (
                  <Swipeable
                    key={record.id}
                    renderRightActions={(progress, dragX) =>
                      renderRightActions(progress, dragX, record)
                    }
                    rightThreshold={40}
                    overshootRight={false}
                    ref={(ref) => {
                      if (ref) swipeableRefs.current.set(record.id, ref);
                      else swipeableRefs.current.delete(record.id);
                    }}
                    onSwipeableWillOpen={() => {
                      const me = swipeableRefs.current.get(record.id);
                      if (openSwipeableRef.current && openSwipeableRef.current !== me) {
                        openSwipeableRef.current.close();
                      }
                    }}
                    onSwipeableOpen={() => {
                      openSwipeableRef.current = swipeableRefs.current.get(record.id) || null;
                    }}
                    onSwipeableClose={() => {
                      const me = swipeableRefs.current.get(record.id);
                      if (openSwipeableRef.current === me) {
                        openSwipeableRef.current = null;
                      }
                    }}
                  >
                    <View style={[styles.recordItem, { backgroundColor: colors.card }]}>
                      <View style={styles.recordLeft}>
                        <View
                          style={[
                            styles.recordIcon,
                            isTablet && styles.recordIconTablet,
                            { backgroundColor: 'transparent' },
                          ]}
                        >
                          {getEventIcon(record.type)}
                        </View>
                        <View style={styles.recordInfo}>
                          <Text
                            style={[
                              styles.recordName,
                              isTablet && styles.recordNameTablet,
                              { color: colors.text },
                            ]}
                            numberOfLines={1}
                          >
                            {getEventTypeLabel(record.typeName)}{record.relationship ? ` (${record.relationship})` : ''}
                          </Text>
                          <Text
                            style={[
                              styles.recordDate,
                              isTablet && styles.recordDateTablet,
                              { color: colors.textTertiary },
                            ]}
                          >
                            {record.date}
                          </Text>
                          {record.memo ? (
                            <Text
                              style={[
                                styles.recordMemo,
                                isTablet && styles.recordMemoTablet,
                                { color: colors.textTertiary },
                              ]}
                              numberOfLines={1}
                            >
                              {record.memo}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.recordAmount,
                          isTablet && styles.recordAmountTablet,
                          { color: getAmountColor(record.isSent) },
                        ]}
                      >
                        {getAmountSign(record.isSent)}
                        {record.amount.toLocaleString()} 원
                      </Text>
                    </View>
                  </Swipeable>
                ))}
              </View>
            </View>
          </ScrollView>
          )}
        </View>

      </View>

      <CustomAlert
        visible={deleteAlert.visible}
        type="confirm"
        title="삭제 확인"
        message="이 기록을 삭제하시겠습니까?"
        confirmText="삭제"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlert({ visible: false, recordId: '' })}
      />

      <CustomAlert
        visible={errorAlert}
        type="alert"
        title="오류"
        message="삭제에 실패했습니다."
        onConfirm={() => setErrorAlert(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 80,
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  profileAvatarTablet: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 14,
  },
  profileInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366F1',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileNameTablet: {
    fontSize: 21,
  },
  profilePhone: {
    fontSize: 17,
    color: '#9CA3AF',
    marginTop: 4,
  },
  profilePhoneTablet: {
    fontSize: 18,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  balanceCardTablet: {
    padding: 20,
    marginBottom: 28,
  },
  balanceTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  balanceTitleTablet: {
    fontSize: 18,
    marginBottom: 14,
  },
  balanceRow: {
    marginBottom: 10,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#6B7280',
  },
  balanceLabelTablet: {
    fontSize: 18,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  balanceAmountTablet: {
    fontSize: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  historySection: {
    marginBottom: 20,
  },
  historySectionTablet: {
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  historyTitleTablet: {
    fontSize: 18,
    marginBottom: 14,
  },
  recordsList: {
    gap: 10,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIconTablet: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  recordNameTablet: {
    fontSize: 18,
  },
  recordDate: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  recordDateTablet: {
    fontSize: 17,
  },
  recordMemo: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 2,
  },
  recordMemoTablet: {
    fontSize: 16,
  },
  recordAmount: {
    fontSize: 17,
    fontWeight: '700',
  },
  recordAmountTablet: {
    fontSize: 18,
  },
  // Swipe action styles
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    marginLeft: 8,
  },
  swipeEditButton: {
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '100%',
  },
  swipeDeleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '100%',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  swipeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
