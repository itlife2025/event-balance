import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  FlatList,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Header } from '../components/Header';
import { WeddingIcon, FuneralIcon, GiftIcon } from '../components/Icons';
import { NavTabKey } from '../types/navigation';
import { getMonthlyStats, getYearlyStats, getAllStats, getAvailableYears, type MonthlyStats } from '../database/queries';
import { type EventTypeKey } from '../constants/eventTypes';

export type PeriodFilter = 'month' | 'year' | 'all';
type AmountTab = 'sent' | 'received';

interface CategoryData {
  label: string;
  type: EventTypeKey;
  amount: number;
  count: number;
  chartColor: string;
}

interface DetailItem {
  id: string;
  name: string;
  phone: string;
  type: EventTypeKey;
  amount: number;
  date: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const end = endAngle >= 360 ? 359.9999 : endAngle;
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, end);
  const largeArc = end - startAngle > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

const TYPE_COLORS: Record<string, string> = {
  wedding: '#AEE3D2',
  funeral: '#ffdb8a',
  birthday: '#F6B3AE',
  firstBirthday: '#C9B8FF',
  birth: '#A7C7FF',
  other: '#D1D5DB',
};

function toChartColor(type: EventTypeKey): string {
  return TYPE_COLORS[type] ?? '#FB923C';
}

interface StatsScreenProps {
  onNavPress?: (tab: NavTabKey) => void;
  onAddPress?: () => void;
  onBackPress?: () => void;
  onDetailPress?: (name: string, phone: string) => void;
  initialActivePeriod?: PeriodFilter;
  onActivePeriodChange?: (p: PeriodFilter) => void;
  initialSelectedYear?: number;
  onSelectedYearChange?: (y: number) => void;
  initialSelectedMonth?: number;
  onSelectedMonthChange?: (m: number) => void;
  initialSelectedYearTab?: number;
  onSelectedYearTabChange?: (y: number) => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  onNavPress,
  onAddPress,
  onBackPress,
  onDetailPress,
  initialActivePeriod,
  onActivePeriodChange,
  initialSelectedYear,
  onSelectedYearChange,
  initialSelectedMonth,
  onSelectedMonthChange,
  initialSelectedYearTab,
  onSelectedYearTabChange,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(initialSelectedYear ?? today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialSelectedMonth ?? today.getMonth() + 1);
  const [selectedYearTab, setSelectedYearTab] = useState(initialSelectedYearTab ?? today.getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showYearTabPicker, setShowYearTabPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const [yearOptions, setYearOptions] = useState<number[]>([today.getFullYear()]);
  const [activePeriod, setActivePeriod] = useState<PeriodFilter>(initialActivePeriod ?? 'month');

  const handleActivePeriod = (p: PeriodFilter) => { setActivePeriod(p); onActivePeriodChange?.(p); };
  const handleSelectedYear = (y: number) => { setSelectedYear(y); onSelectedYearChange?.(y); };
  const handleSelectedMonth = (m: number) => { setSelectedMonth(m); onSelectedMonthChange?.(m); };
  const handleSelectedYearTab = (y: number) => { setSelectedYearTab(y); onSelectedYearTabChange?.(y); };
  const [amountTab, setAmountTab] = useState<AmountTab>('sent');
  const [stats, setStats] = useState<MonthlyStats>({
    sentAmount: 0,
    receivedAmount: 0,
    sentCategories: [],
    receivedCategories: [],
    sentDetails: [],
    receivedDetails: [],
  });

  useEffect(() => {
    getAvailableYears().then(years => {
      if (years.length > 0) setYearOptions(years);
    });
  }, []);

  // Navigate arrows only through years that have data
  const prevYearInOptions = (current: number, setter: (y: number) => void) => {
    const idx = yearOptions.indexOf(current);
    if (idx < yearOptions.length - 1) setter(yearOptions[idx + 1]); // yearOptions is descending
  };
  const nextYearInOptions = (current: number, setter: (y: number) => void) => {
    const idx = yearOptions.indexOf(current);
    if (idx > 0) setter(yearOptions[idx - 1]);
  };

  const loadStats = useCallback(async () => {
    let data: MonthlyStats;
    if (activePeriod === 'year') data = await getYearlyStats(selectedYearTab);
    else if (activePeriod === 'all') data = await getAllStats();
    else data = await getMonthlyStats(selectedYear, selectedMonth);
    setStats(data);
  }, [activePeriod, selectedYearTab, selectedYear, selectedMonth]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const sentCategories: CategoryData[] = stats.sentCategories.map(c => ({
    ...c,
    chartColor: toChartColor(c.type),
  }));
  const receivedCategories: CategoryData[] = stats.receivedCategories.map(c => ({
    ...c,
    chartColor: toChartColor(c.type),
  }));
  const sentDetails: DetailItem[] = stats.sentDetails;
  const receivedDetails: DetailItem[] = stats.receivedDetails;

  const sentAmount = stats.sentAmount;
  const receivedAmount = stats.receivedAmount;

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

  const getCategoryIcon = (type: EventTypeKey) => {
    if (type === 'wedding') return <WeddingIcon size={isTablet ? 24 : 20} color="#EC4899" />;
    if (type === 'funeral') return <FuneralIcon size={isTablet ? 24 : 20} color="#3B82F6" />;
    return <GiftIcon size={isTablet ? 24 : 20} color="#F59E0B" />;
  };

  const getCategoryIconBg = (type: EventTypeKey) => {
    if (type === 'wedding') return '#FDF2F8';
    if (type === 'funeral') return '#EFF6FF';
    return '#FFFBEB';
  };

  const svgCx = chartSize / 2;
  const svgCy = chartSize / 2;
  const svgR = (chartSize - strokeWidth) / 2;

  const donutSegments = (() => {
    if (currentTotal === 0 || currentCategories.length === 0) return [];
    let cumulative = 0;
    return currentCategories.map(cat => {
      const startAngle = (cumulative / currentTotal) * 360;
      cumulative += cat.amount;
      const endAngle = (cumulative / currentTotal) * 360;
      return { color: cat.chartColor, startAngle, endAngle };
    });
  })();

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
          {/* Summary Cards */}
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
          <View style={styles.filterContainer}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.filterTab,
                  activePeriod === period.key && styles.filterTabActive,
                  activePeriod === period.key && { borderBottomColor: currentColor },
                ]}
                onPress={() => handleActivePeriod(period.key)}
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
            {/* Date Selectors — hidden on 전체 tab */}
            {activePeriod !== 'all' && <View style={styles.dateSelectorRow}>
              {activePeriod === 'year' ? (
                /* Year tab: independent year selector */
                <View style={styles.dateSelector}>
                  <TouchableOpacity onPress={() => prevYearInOptions(selectedYearTab, handleSelectedYearTab)} style={styles.arrowBtn}>
                    <Text style={styles.arrowText}>{'‹'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowYearTabPicker(true)} activeOpacity={0.7} style={styles.dateSelectorTextBtn}>
                    <Text style={[styles.dateSelectorText, isTablet && styles.dateSelectorTextTablet]}>
                      {selectedYearTab}년
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => nextYearInOptions(selectedYearTab, handleSelectedYearTab)} style={styles.arrowBtn}>
                    <Text style={styles.arrowText}>{'›'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Month/All tab: year selector + month selector */
                <>
                  <View style={styles.dateSelector}>
                    <TouchableOpacity onPress={() => prevYearInOptions(selectedYear, handleSelectedYear)} style={styles.arrowBtn}>
                      <Text style={styles.arrowText}>{'‹'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowMonthPicker(false); setShowYearPicker(true); }} activeOpacity={0.7} style={styles.dateSelectorTextBtn}>
                      <Text style={[styles.dateSelectorText, isTablet && styles.dateSelectorTextTablet]}>
                        {selectedYear}년
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => nextYearInOptions(selectedYear, handleSelectedYear)} style={styles.arrowBtn}>
                      <Text style={styles.arrowText}>{'›'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateSelector}>
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedMonth === 1) { prevYearInOptions(selectedYear, handleSelectedYear); handleSelectedMonth(12); }
                        else { handleSelectedMonth(selectedMonth - 1); }
                      }}
                      style={styles.arrowBtn}
                    >
                      <Text style={styles.arrowText}>{'‹'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowYearPicker(false); setShowMonthPicker(true); }} activeOpacity={0.7} style={styles.dateSelectorTextBtn}>
                      <Text style={[styles.dateSelectorText, isTablet && styles.dateSelectorTextTablet]}>
                        {selectedMonth}월
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedMonth === 12) { nextYearInOptions(selectedYear, handleSelectedYear); handleSelectedMonth(1); }
                        else { handleSelectedMonth(selectedMonth + 1); }
                      }}
                      style={styles.arrowBtn}
                    >
                      <Text style={styles.arrowText}>{'›'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>}

            {/* Year tab picker modal */}
            <Modal transparent visible={showYearTabPicker} animationType="fade" onRequestClose={() => setShowYearTabPicker(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowYearTabPicker(false)}>
                <View style={styles.pickerContainer}>
                  <FlatList
                    data={yearOptions}
                    keyExtractor={(item) => String(item)}
                    initialScrollIndex={Math.max(0, yearOptions.indexOf(selectedYearTab))}
                    getItemLayout={(_, index) => ({ length: 50, offset: 50 * index, index })}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.pickerItem, item === selectedYearTab && styles.pickerItemSelected]}
                        onPress={() => { handleSelectedYearTab(item); setShowYearTabPicker(false); }}
                      >
                        <Text style={[styles.pickerItemText, item === selectedYearTab && styles.pickerItemTextSelected]}>
                          {item}년
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Month tab year picker modal */}
            <Modal transparent visible={showYearPicker} animationType="fade" onRequestClose={() => setShowYearPicker(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowYearPicker(false)}>
                <View style={styles.pickerContainer}>
                  <FlatList
                    data={yearOptions}
                    keyExtractor={(item) => String(item)}
                    initialScrollIndex={Math.max(0, yearOptions.indexOf(selectedYear))}
                    getItemLayout={(_, index) => ({ length: 50, offset: 50 * index, index })}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.pickerItem, item === selectedYear && styles.pickerItemSelected]}
                        onPress={() => { handleSelectedYear(item); setShowYearPicker(false); }}
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

            {/* Month picker modal */}
            <Modal transparent visible={showMonthPicker} animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMonthPicker(false)}>
                <View style={styles.pickerContainer}>
                  <FlatList
                    data={monthOptions}
                    keyExtractor={(item) => String(item)}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.pickerItem, item === selectedMonth && styles.pickerItemSelected]}
                        onPress={() => { handleSelectedMonth(item); setShowMonthPicker(false); }}
                      >
                        <Text style={[styles.pickerItemText, item === selectedMonth && styles.pickerItemTextSelected]}>
                          {item}월
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>

            {currentCategories.length === 0 ? (
              <Text style={styles.emptyText}>내역이 없습니다</Text>
            ) : (
              <>
                {/* Chart Row */}
                <View style={styles.chartRow}>
                  {/* Donut Chart */}
                  <View style={[styles.donutContainer, { width: chartSize, height: chartSize }]}>
                    <Svg width={chartSize} height={chartSize} style={{ position: 'absolute' }}>
                      {/* Background ring */}
                      <Circle
                        cx={svgCx} cy={svgCy} r={svgR}
                        stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none"
                      />
                      {/* Segments */}
                      {donutSegments.map((seg, i) => (
                        <Path
                          key={`${amountTab}-${i}`}
                          d={arcPath(svgCx, svgCy, svgR, seg.startAngle, seg.endAngle)}
                          stroke={seg.color}
                          strokeWidth={strokeWidth}
                          fill="none"
                          strokeLinecap="butt"
                        />
                      ))}
                    </Svg>
                    <View style={styles.donutCenter}>
                      <Text
                        style={[styles.donutCenterAmount, isTablet && styles.donutCenterAmountTablet]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        ₩{currentTotal.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Legend */}
                  <View style={styles.chartLegend}>
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
                          <View style={[styles.legendDot, { backgroundColor: cat.chartColor }]} />
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

                <View style={styles.sectionDivider} />

                <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>
                  {currentLabel}
                </Text>

                {currentDetails.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => onDetailPress?.(item.name, item.phone)}
                    activeOpacity={0.7}
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
                          {item.name}
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
                  </TouchableOpacity>
                ))}
              </>
            )}
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

  // Date Selectors
  dateSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 0,
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
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: '#6366F1',
    fontWeight: '700',
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
    marginTop: 14,
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
    marginVertical: 28,
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

  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
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
