import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { WeddingIcon, FuneralIcon, GiftIcon } from '../components/Icons';
import { EventType } from '../components/UpcomingEvents';
import { Header } from '../components/Header';
import { NavTabKey } from '../types/navigation';
import {
  getAvailableYears,
  getTransactionsByYear,
  getYearlyTotals,
  type TransactionRecord,
} from '../database/queries';

type FilterKey = 'all' | 'received' | 'sent';

interface ListScreenProps {
  onTransactionPress?: (transaction: TransactionRecord) => void;
  onNavPress?: (tab: NavTabKey) => void;
  onAddPress?: () => void;
  onBackPress?: () => void;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
}

const currentYear = new Date().getFullYear();

export const ListScreen: React.FC<ListScreenProps> = ({
  onTransactionPress,
  onNavPress,
  onAddPress,
  onBackPress,
  selectedYear: selectedYearProp,
  onYearChange,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [selectedYear, setSelectedYearInternal] = useState<number>(selectedYearProp ?? currentYear);

  const setSelectedYear = (year: number) => {
    setSelectedYearInternal(year);
    onYearChange?.(year);
  };
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [sentAmount, setSentAmount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    getAvailableYears().then((years: number[]) => {
      if (years.length > 0) setAvailableYears(years);
    });
  }, []);

  const prevYear = () => {
    const idx = availableYears.indexOf(selectedYear);
    if (idx < availableYears.length - 1) setSelectedYear(availableYears[idx + 1]);
  };
  const nextYear = () => {
    const idx = availableYears.indexOf(selectedYear);
    if (idx > 0) setSelectedYear(availableYears[idx - 1]);
  };

  useEffect(() => {
    Promise.all([
      getTransactionsByYear(selectedYear),
      getYearlyTotals(selectedYear),
    ]).then(([txs, totals]) => {
      setTransactions(txs);
      setSentAmount(totals.sentAmount);
      setReceivedAmount(totals.receivedAmount);
    });
  }, [selectedYear]);

  const filteredTransactions = transactions.filter(t => {
    if (activeFilter === 'received') return !t.isSent;
    if (activeFilter === 'sent') return t.isSent;
    return true;
  });

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'sent', label: '보낸 내역' },
    { key: 'received', label: '받은 내역' },
  ];

  const getIcon = (type: EventType) => {
    if (type === 'wedding') return <WeddingIcon size={isTablet ? 24 : 20} color="#EC4899" />;
    if (type === 'funeral') return <FuneralIcon size={isTablet ? 24 : 20} color="#3B82F6" />;
    return <GiftIcon size={isTablet ? 24 : 20} color="#F59E0B" />;
  };

  const getIconBg = (type: EventType) => {
    if (type === 'wedding') return '#FDF2F8';
    if (type === 'funeral') return '#EFF6FF';
    return '#FFFBEB';
  };

  return (
    <View style={styles.container}>
      <Header title="리스트" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, isTablet && styles.summaryCardTablet]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>보낸 금액</Text>
              <Text style={[styles.summaryAmount, styles.sentAmountText]} numberOfLines={1} adjustsFontSizeToFit>
                ₩{sentAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>받은 금액</Text>
              <Text style={[styles.summaryAmount, styles.receivedAmountText]} numberOfLines={1} adjustsFontSizeToFit>
                ₩{receivedAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterContainer, isTablet && styles.filterContainerTablet]}>
          {filters.map(filter => (
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
          {/* Year Selector */}
          <View style={styles.yearSelectorRow}>
            <View style={styles.dateSelector}>
              <TouchableOpacity onPress={prevYear} style={styles.arrowBtn}>
                <Text style={styles.arrowText}>{'‹'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowYearPicker(true)} activeOpacity={0.7} style={styles.dateSelectorTextBtn}>
                <Text style={[styles.dateSelectorText, isTablet && styles.dateSelectorTextTablet]}>
                  {selectedYear}년
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={nextYear} style={styles.arrowBtn}>
                <Text style={styles.arrowText}>{'›'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Modal transparent visible={showYearPicker} animationType="fade" onRequestClose={() => setShowYearPicker(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowYearPicker(false)}>
              <View style={styles.pickerContainer}>
                <FlatList
                  data={availableYears}
                  keyExtractor={(item) => String(item)}
                  initialScrollIndex={Math.max(0, availableYears.indexOf(selectedYear))}
                  getItemLayout={(_, index) => ({ length: 50, offset: 50 * index, index })}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, item === selectedYear && styles.pickerItemSelected]}
                      onPress={() => { setSelectedYear(item); setShowYearPicker(false); }}
                    >
                      <Text style={[styles.pickerItemText, item === selectedYear && styles.pickerItemTextSelected]}>
                        {item}년
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{selectedYear}년 내역이 없습니다.</Text>
            </View>
          ) : (
            filteredTransactions.map((transaction, index) => (
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
                    { backgroundColor: getIconBg(transaction.type) },
                  ]}
                >
                  {getIcon(transaction.type)}
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
                <Text
                  style={[
                    styles.transactionAmount,
                    isTablet && styles.transactionAmountTablet,
                    { color: '#1F2937' },
                  ]}
                >
                  {transaction.isSent ? '-' : '+'}₩{transaction.amount.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCardTablet: {
    padding: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  sentAmountText: {
    color: '#818CF8',
  },
  receivedAmountText: {
    color: '#34D399',
  },

  // Year Selector
  yearSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 4,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  arrowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  arrowText: {
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 22,
  },
  dateSelectorTextBtn: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
  },
  dateSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  dateSelectorTextTablet: {
    fontSize: 16,
    minWidth: 56,
  },
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
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: '#6366F1',
    fontWeight: '700',
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
  },
  transactionAmountTablet: {
    fontSize: 18,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
