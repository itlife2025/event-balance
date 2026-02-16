import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Header } from '../components/Header';
import { WeddingIcon, FuneralIcon, GiftIcon } from '../components/Icons';
import { NavTabKey } from '../types/navigation';

type PeriodFilter = 'month' | 'year' | 'all';
type AmountTab = 'sent' | 'received';
type EventType = 'wedding' | 'funeral' | 'birthday';

interface CategoryData {
  label: string;
  type: EventType;
  amount: number;
  count: number;
  chartColor: string;
}

interface DetailItem {
  id: string;
  eventName: string;
  type: EventType;
  amount: number;
  date: string;
}

interface StatsScreenProps {
  onNavPress?: (tab: NavTabKey) => void;
  onAddPress?: () => void;
  onBackPress?: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  onNavPress,
  onAddPress,
  onBackPress,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [activePeriod, setActivePeriod] = useState<PeriodFilter>('month');
  const [amountTab, setAmountTab] = useState<AmountTab>('sent');

  // --- Sent Data (2026년 1월) ---
  const sentCategories: CategoryData[] = [
    { label: '생일', type: 'birthday', amount: 200000, count: 2, chartColor: '#F6B3AE' },
    { label: '결혼식', type: 'wedding', amount: 100000, count: 1, chartColor: '#AEE3D2' },
    { label: '조의금', type: 'funeral', amount: 100000, count: 1, chartColor: '#ffdb8a' },
  ];

  const sentDetails: DetailItem[] = [
    { id: '1', eventName: '김민수 생일', type: 'birthday', amount: 100000, date: '2026.01.05' },
    { id: '2', eventName: '이영호 생일', type: 'birthday', amount: 100000, date: '2026.01.12' },
    { id: '3', eventName: '박서연 결혼식', type: 'wedding', amount: 100000, date: '2026.01.18' },
    { id: '4', eventName: '최준혁 조의금', type: 'funeral', amount: 100000, date: '2026.01.25' },
  ];

  // --- Received Data (2026년 1월) ---
  const receivedCategories: CategoryData[] = [
    { label: '결혼식', type: 'wedding', amount: 600000, count: 2, chartColor: '#E0C9FF' },
    { label: '조의금', type: 'funeral', amount: 300000, count: 1, chartColor: '#A7C7FF' },
    { label: '생일', type: 'birthday', amount: 300000, count: 1, chartColor: '#FFC9B5' },
  ];

  const receivedDetails: DetailItem[] = [
    { id: '1', eventName: '홍길동 결혼식', type: 'wedding', amount: 300000, date: '2026.01.08' },
    { id: '2', eventName: '장미래 결혼식', type: 'wedding', amount: 300000, date: '2026.01.15' },
    { id: '3', eventName: '김서윤 조의금', type: 'funeral', amount: 300000, date: '2026.01.20' },
    { id: '4', eventName: '정하늘 생일', type: 'birthday', amount: 300000, date: '2026.01.28' },
  ];

  const sentAmount = sentCategories.reduce((sum, c) => sum + c.amount, 0);
  const receivedAmount = receivedCategories.reduce((sum, c) => sum + c.amount, 0);

  const currentCategories = amountTab === 'sent' ? sentCategories : receivedCategories;
  const currentDetails = amountTab === 'sent' ? sentDetails : receivedDetails;
  const currentTotal = amountTab === 'sent' ? sentAmount : receivedAmount;
  const currentLabel = amountTab === 'sent' ? '보낸 내역' : '받은 내역';
  const currentColor = amountTab === 'sent' ? '#818CF8' : '#34D399';

  const periods: { key: PeriodFilter; label: string }[] = [
    { key: 'month', label: '월' },
    { key: 'year', label: '년' },
    { key: 'all', label: '전체' },
  ];

  // Donut chart dimensions
  const chartSize = isTablet ? 180 : 150;
  const strokeWidth = isTablet ? 28 : 24;

  const getCategoryIcon = (type: EventType) => {
    if (type === 'wedding') return <WeddingIcon size={isTablet ? 24 : 20} color="#EC4899" />;
    if (type === 'funeral') return <FuneralIcon size={isTablet ? 24 : 20} color="#3B82F6" />;
    return <GiftIcon size={isTablet ? 24 : 20} color="#F59E0B" />;
  };

  const getCategoryIconBg = (type: EventType) => {
    if (type === 'wedding') return '#FDF2F8';
    if (type === 'funeral') return '#EFF6FF';
    return '#FFFBEB';
  };

  // Render donut chart layers using stacked arcs
  // Segments are ordered clockwise. We stack layers from bottom (full ring) to top (smallest arc).
  const renderDonutLayers = () => {
    const total = currentTotal;
    const layers: { color: string; angleDeg: number }[] = [];

    for (let i = currentCategories.length - 1; i >= 0; i--) {
      const cumPercent = currentCategories
        .slice(0, i + 1)
        .reduce((sum, s) => sum + (s.amount / total) * 100, 0);
      const angleDeg = Math.round((cumPercent / 100) * 360);
      layers.push({ color: currentCategories[i].chartColor, angleDeg });
    }

    return layers.map((layer, index) => (
      <View
        key={`${amountTab}-${index}`}
        style={{
          position: 'absolute' as const,
          width: chartSize,
          height: chartSize,
          borderRadius: chartSize / 2,
          borderWidth: strokeWidth,
          borderTopColor: layer.angleDeg > 0 ? layer.color : 'transparent',
          borderRightColor: layer.angleDeg > 90 ? layer.color : 'transparent',
          borderBottomColor: layer.angleDeg > 180 ? layer.color : 'transparent',
          borderLeftColor: layer.angleDeg > 270 ? layer.color : 'transparent',
          transform: [{ rotate: '45deg' }],
        }}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <View style={[styles.container, isTablet && styles.containerTablet]}>
        <Header title="통계" onBackPress={onBackPress} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Cards - Selectable Tabs */}
          <View style={[styles.summaryContainer, isTablet && styles.summaryContainerTablet]}>
            <TouchableOpacity
              style={[
                styles.summaryCard,
                amountTab === 'sent' && styles.summaryCardActiveSent,
              ]}
              onPress={() => setAmountTab('sent')}
              activeOpacity={0.7}
            >
              <Text style={styles.summaryLabel}>보낸 금액</Text>
              <Text
                style={[styles.summaryAmount, styles.sentAmountText]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                ₩{sentAmount.toLocaleString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.summaryCard,
                amountTab === 'received' && styles.summaryCardActiveReceived,
              ]}
              onPress={() => setAmountTab('received')}
              activeOpacity={0.7}
            >
              <Text style={styles.summaryLabel}>받은 금액</Text>
              <Text
                style={[styles.summaryAmount, styles.receivedAmountText]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                ₩{receivedAmount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Period Filter Tabs */}
          <View style={[styles.filterContainer, isTablet && styles.filterContainerTablet]}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.filterTab,
                  activePeriod === period.key && styles.filterTabActive,
                  activePeriod === period.key && { borderBottomColor: currentColor },
                ]}
                onPress={() => setActivePeriod(period.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activePeriod === period.key && styles.filterTabTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Combined Card */}
          <View style={[styles.combinedCard, isTablet && styles.combinedCardTablet]}>
            {/* Date Selector */}
            <View style={styles.dateSelectorContainer}>
              <TouchableOpacity style={styles.dateSelector} activeOpacity={0.7}>
                <Text style={[styles.dateSelectorText, isTablet && styles.dateSelectorTextTablet]}>
                  2026년 1월
                </Text>
                <Text style={styles.dateSelectorArrow}>{'∨'}</Text>
              </TouchableOpacity>
            </View>

            {/* Chart Row */}
            <View style={styles.chartRow}>
              {/* Donut Chart */}
              <View style={[styles.donutContainer, { width: chartSize, height: chartSize }]}>
                {/* Background circle */}
                <View
                  style={[
                    styles.donutBg,
                    {
                      width: chartSize,
                      height: chartSize,
                      borderRadius: chartSize / 2,
                      borderWidth: strokeWidth,
                    },
                  ]}
                />
                {/* Donut segments */}
                {renderDonutLayers()}
                {/* Center text */}
                <View style={styles.donutCenter}>
                  <Text
                    style={[styles.donutCenterAmount, isTablet && styles.donutCenterAmountTablet]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    ₩{currentTotal.toLocaleString()}
                  </Text>
                  <Text style={[styles.donutCenterLabel, isTablet && styles.donutCenterLabelTablet]}>
                    {amountTab === 'sent' ? '보낸 금액' : '받은 금액'}
                  </Text>
                </View>
              </View>

              {/* Legend */}
              <View style={styles.chartLegend}>
                <Text style={[styles.legendTitle, isTablet && styles.legendTitleTablet]}>
                  {currentLabel}
                </Text>
                <Text
                  style={[
                    styles.legendAmount,
                    isTablet && styles.legendAmountTablet,
                    { color: currentColor },
                  ]}
                >
                  ₩{currentTotal.toLocaleString()}
                </Text>
                <Text style={[styles.legendSubLabel, isTablet && styles.legendSubLabelTablet]}>
                  총 경조사비
                </Text>

                {currentCategories.map((cat, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={styles.legendDotRow}>
                      <View
                        style={[styles.legendDot, { backgroundColor: cat.chartColor }]}
                      />
                      <Text
                        style={[
                          styles.legendCategoryName,
                          isTablet && styles.legendCategoryNameTablet,
                        ]}
                      >
                        {cat.label}
                      </Text>
                      <Text
                        style={[
                          styles.legendCategoryAmount,
                          isTablet && styles.legendCategoryAmountTablet,
                          { color: cat.chartColor },
                        ]}
                      >
                        ₩{cat.amount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.legendBarRow}>
                      <View style={styles.legendBarBg}>
                        <View
                          style={[
                            styles.legendBarFill,
                            {
                              width: `${(cat.amount / currentTotal) * 100}%`,
                              backgroundColor: cat.chartColor,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.legendCount}>({cat.count}회)</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.sectionDivider} />

            {/* Detail List */}
            <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>
              {currentLabel}
            </Text>

            {currentDetails.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.detailItem,
                  index < currentDetails.length - 1 && styles.detailItemBorder,
                ]}
              >
                <View style={styles.detailItemLeft}>
                  <View
                    style={[
                      styles.detailItemIcon,
                      isTablet && styles.detailItemIconTablet,
                      { backgroundColor: getCategoryIconBg(item.type) },
                    ]}
                  >
                    {getCategoryIcon(item.type)}
                  </View>
                  <View style={styles.detailItemInfo}>
                    <Text
                      style={[
                        styles.detailItemLabel,
                        isTablet && styles.detailItemLabelTablet,
                      ]}
                    >
                      {item.eventName}
                    </Text>
                    <Text
                      style={[
                        styles.detailItemDate,
                        isTablet && styles.detailItemDateTablet,
                      ]}
                    >
                      {item.date}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.detailItemAmount,
                    isTablet && styles.detailItemAmountTablet,
                    { color: '#000000' },
                  ]}
                >
                  ₩{item.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
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
  containerTablet: {
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    alignSelf: 'stretch',
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  summaryCardActiveSent: {
    borderBottomColor: '#818CF8',
  },
  summaryCardActiveReceived: {
    borderBottomColor: '#34D399',
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
  receivedAmountText: {
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

  // Combined Card
  combinedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  combinedCardTablet: {
    padding: 28,
    borderRadius: 20,
  },

  // Date Selector
  dateSelectorContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  dateSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateSelectorTextTablet: {
    fontSize: 16,
  },
  dateSelectorArrow: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Donut Chart
  donutContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutBg: {
    position: 'absolute',
    borderColor: '#E5E7EB',
  },
  donutCenter: {
    alignItems: 'center',
  },
  donutCenterAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  donutCenterAmountTablet: {
    fontSize: 15,
  },
  donutCenterLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  donutCenterLabelTablet: {
    fontSize: 12,
  },

  // Chart Legend
  chartLegend: {
    flex: 1,
    marginLeft: 20,
    paddingTop: 4,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  legendTitleTablet: {
    fontSize: 14,
  },
  legendAmount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  legendAmountTablet: {
    fontSize: 24,
  },
  legendSubLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  legendSubLabelTablet: {
    fontSize: 12,
  },
  legendItem: {
    marginBottom: 10,
  },
  legendDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendCategoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  legendCategoryNameTablet: {
    fontSize: 14,
  },
  legendCategoryAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  legendCategoryAmountTablet: {
    fontSize: 14,
  },
  legendBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  legendBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  legendCount: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // Section Divider
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },

  // Section Title
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  sectionTitleTablet: {
    fontSize: 16,
    marginBottom: 14,
  },

  // Detail List Items
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailItemIconTablet: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  detailItemInfo: {
    marginLeft: 12,
  },
  detailItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  detailItemLabelTablet: {
    fontSize: 16,
  },
  detailItemDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  detailItemDateTablet: {
    fontSize: 13,
  },
  detailItemAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailItemAmountTablet: {
    fontSize: 17,
  },
});
