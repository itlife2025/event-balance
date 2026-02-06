import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { WeddingIcon, FuneralIcon } from '../components/Icons';
import { EventType } from '../components/UpcomingEvents';

type FilterKey = 'all' | 'received' | 'sent';

interface Transaction {
  id: string;
  name: string;
  type: EventType;
  date: string;
  amount: number;
  isSent: boolean;
}

const sampleTransactions: Transaction[] = [
  { id: '1', name: '김민수 결혼식', type: 'wedding', date: '2022.12.15', amount: 200000, isSent: false },
  { id: '2', name: '이영호 조의금', type: 'funeral', date: '2022.11.30', amount: 100000, isSent: true },
  { id: '3', name: '박지연 결혼식', type: 'wedding', date: '2022.10.05', amount: 300000, isSent: false },
  { id: '4', name: '회사 동문 돌잔치', type: 'wedding', date: '2022.09.18', amount: 50000, isSent: true },
];

interface ListScreenProps {
  onTransactionPress?: (transaction: Transaction) => void;
}

export const ListScreen: React.FC<ListScreenProps> = ({ onTransactionPress }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const receivedAmount = 1200000;
  const sentAmount = 850000;

  const filteredTransactions = sampleTransactions.filter((t) => {
    if (activeFilter === 'received') return !t.isSent;
    if (activeFilter === 'sent') return t.isSent;
    return true;
  });

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'received', label: '받은 내역' },
    { key: 'sent', label: '보낸 내역' },
  ];

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      {/* Summary Cards */}
      <View style={[styles.summaryContainer, isTablet && styles.summaryContainerTablet]}>
        <View style={[styles.summaryCard, styles.sentCard]}>
          <Text style={styles.summaryLabel}>보낸 금액</Text>
          <Text style={[styles.summaryAmount, styles.sentAmountText]} numberOfLines={1} adjustsFontSizeToFit>
            ₩{sentAmount.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.receivedCard]}>
          <Text style={styles.summaryLabel}>받은 금액</Text>
          <Text style={[styles.summaryAmount, styles.receivedAmount]} numberOfLines={1} adjustsFontSizeToFit>
            ₩{receivedAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, isTablet && styles.filterContainerTablet]}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              activeFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction List */}
      <View style={[styles.transactionList, isTablet && styles.transactionListTablet]}>
        {filteredTransactions.map((transaction, index) => (
          <TouchableOpacity
            key={transaction.id}
            style={[
              styles.transactionItem,
              isTablet && styles.transactionItemTablet,
              index < filteredTransactions.length - 1 && styles.transactionItemBorder,
            ]}
            onPress={() => onTransactionPress?.(transaction)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.transactionIcon,
                isTablet && styles.transactionIconTablet,
                { backgroundColor: transaction.type === 'wedding' ? '#FDF2F8' : '#EFF6FF' },
              ]}
            >
              {transaction.type === 'wedding' ? (
                <WeddingIcon size={isTablet ? 24 : 20} color="#EC4899" />
              ) : (
                <FuneralIcon size={isTablet ? 24 : 20} color="#3B82F6" />
              )}
            </View>
            <View style={styles.transactionInfo}>
              <Text
                style={[styles.transactionName, isTablet && styles.transactionNameTablet]}
                numberOfLines={1}
              >
                {transaction.name}
              </Text>
              <Text style={[styles.transactionDate, isTablet && styles.transactionDateTablet]}>
                {transaction.date}
              </Text>
            </View>
            <Text style={[styles.transactionAmount, isTablet && styles.transactionAmountTablet]}>
              {transaction.isSent ? '-' : '+'}₩{transaction.amount.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  containerTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },

  // Summary Cards
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryContainerTablet: {
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  receivedCard: {
    backgroundColor: '#FFFFFF',
  },
  sentCard: {
    backgroundColor: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
  },
  receivedAmount: {
    color: '#34D399',
  },
  sentAmountText: {
    color: '#818CF8',
  },

  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 4,
    justifyContent: 'center',
  },
  filterContainerTablet: {},
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
    borderRadius: 4,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  filterTabTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },

  // Transaction List
  transactionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionListTablet: {
    borderRadius: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionItemTablet: {
    padding: 20,
  },
  transactionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIconTablet: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionNameTablet: {
    fontSize: 16,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionDateTablet: {
    fontSize: 14,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  transactionAmountTablet: {
    fontSize: 18,
  },
});
