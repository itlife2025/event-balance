import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
  Image,
} from 'react-native';
import { ChevronRightIcon, WeddingIcon, FuneralIcon } from '../components/Icons';
import { Header } from '../components/Header';


type EventType = 'wedding' | 'funeral';

interface HistoryRecord {
  id: string;
  date: string;
  type: EventType;
  name: string;
  amount: number;
  isSent: boolean;
}

interface DetailScreenProps {
  onClose?: () => void;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // 샘플 데이터
  const personName = '김철수';
  const personTitle = '직장 동료';
  const sentAmount = 200000;
  const receivedAmount = 100000;
  const balance = sentAmount - receivedAmount;

  const records: HistoryRecord[] = [
    {
      id: '1',
      date: '2024.04.24',
      type: 'wedding',
      name: '2024.04.24 결혼식',
      amount: 100000,
      isSent: true,
    },
    {
      id: '2',
      date: '2026.01.17',
      type: 'funeral',
      name: '장례',
      amount: 50000,
      isSent: false,
    },
    {
      id: '3',
      date: '2023.01.10',
      type: 'wedding',
      name: '내 생일 손혁',
      amount: 100000,
      isSent: false,
    },
    {
      id: '4',
      date: '2022.08.15',
      type: 'wedding',
      name: '부친상 부친상',
      amount: 100000,
      isSent: true,
    },
  ];



  const getEventIcon = (type: EventType) => {
    if (type === 'wedding') {
      return <WeddingIcon size={isTablet ? 32 : 28} color="#EC4899" />;
    }
    return <FuneralIcon size={isTablet ? 32 : 28} color="#3B82F6" />;
  };

  const getAmountColor = (isSent: boolean) => {
    return isSent ? '#818CF8' : '#34D399';
  };

  const getAmountSign = (isSent: boolean) => {
    return isSent ? '-' : '+';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <View style={styles.container}>
        {/* Header */}
        <Header title={personName} onBackPress={onClose} />

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
            <View style={styles.profileSection}>
              <View
                style={[
                  styles.profileAvatar,
                  isTablet && styles.profileAvatarTablet,
                ]}
              >
                <Text style={styles.profileInitial}>김</Text>
              </View>
              <Text style={[styles.profileName, isTablet && styles.profileNameTablet]}>
                {personName}
              </Text>
              <Text style={[styles.profileTitle, isTablet && styles.profileTitleTablet]}>
                ({personTitle})
              </Text>
            </View>

            {/* Balance Card */}
            <View style={[styles.balanceCard, isTablet && styles.balanceCardTablet]}>
              <Text style={[styles.balanceTitle, isTablet && styles.balanceTitleTablet]}>
                주고받은 합계 (Total)
              </Text>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={[styles.balanceLabel, isTablet && styles.balanceLabelTablet]}>
                    내가 줌:
                  </Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      isTablet && styles.balanceAmountTablet,
                      { color: '#818CF8' },
                    ]}
                  >
                    -{sentAmount.toLocaleString()} 원
                  </Text>
                </View>
              </View>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={[styles.balanceLabel, isTablet && styles.balanceLabelTablet]}>
                    내가 받음:
                  </Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      isTablet && styles.balanceAmountTablet,
                      { color: '#34D399' },
                    ]}
                  >
                    +{receivedAmount.toLocaleString()} 원
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={[styles.balanceLabel, isTablet && styles.balanceLabelTablet]}>
                    차액:
                  </Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      isTablet && styles.balanceAmountTablet,
                      { color: '#EF4444' },
                    ]}
                  >
                    {balance > 0 ? '-' : '+'}{Math.abs(balance).toLocaleString()} 원 (손해)
                  </Text>
                </View>
              </View>
            </View>

            {/* History Section */}
            <View style={[styles.historySection, isTablet && styles.historySectionTablet]}>
              <Text style={[styles.historyTitle, isTablet && styles.historyTitleTablet]}>
                [ 히스토리 (History) ]
              </Text>

              <View style={styles.recordsList}>
                {records.map((record) => (
                  <View key={record.id} style={styles.recordItem}>
                    <View style={styles.recordLeft}>
                      <View
                        style={[
                          styles.recordIcon,
                          isTablet && styles.recordIconTablet,
                        ]}
                      >
                        {getEventIcon(record.type)}
                      </View>
                      <View style={styles.recordInfo}>
                        <Text
                          style={[
                            styles.recordName,
                            isTablet && styles.recordNameTablet,
                          ]}
                          numberOfLines={1}
                        >
                          {record.name}
                        </Text>
                        <Text
                          style={[
                            styles.recordDate,
                            isTablet && styles.recordDateTablet,
                          ]}
                        >
                          {record.date}
                        </Text>
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
                ))}
              </View>
            </View>
          </ScrollView>
        </View>


      </View>
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileNameTablet: {
    fontSize: 18,
  },
  profileTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  profileTitleTablet: {
    fontSize: 14,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  balanceTitleTablet: {
    fontSize: 14,
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
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  balanceLabelTablet: {
    fontSize: 14,
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  balanceAmountTablet: {
    fontSize: 16,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  historyTitleTablet: {
    fontSize: 14,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  recordNameTablet: {
    fontSize: 14,
  },
  recordDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  recordDateTablet: {
    fontSize: 13,
  },
  recordAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  recordAmountTablet: {
    fontSize: 14,
  },
});
