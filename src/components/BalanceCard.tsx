import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';

interface MonthlyData {
  month: string;
  sent: number;
  received: number;
}

interface BalanceCardProps {
  sentAmount?: number;
  receivedAmount?: number;
  monthlyData?: MonthlyData[];
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  sentAmount = 0,
  receivedAmount = 0,
  monthlyData = [],
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  const maxValue = monthlyData.length > 0
    ? Math.max(...monthlyData.flatMap(d => [d.sent, d.received]))
    : 0;

  const MIN_BAR_GROUP_WIDTH = 40;
  const totalMinWidth = MIN_BAR_GROUP_WIDTH * monthlyData.length;

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <View style={[styles.balanceSection, isTablet && styles.balanceSectionTablet]}>
        <View style={styles.amountItem}>
          <Text style={[styles.label, isTablet && styles.labelTablet]}>보낸 금액</Text>
          <Text style={[styles.amount, styles.sentAmount, isTablet && styles.amountTablet]}>
            {formatCurrency(sentAmount)}
          </Text>
        </View>
        <View style={[styles.divider, isTablet && styles.dividerTablet]} />
        <View style={styles.amountItem}>
          <Text style={[styles.label, isTablet && styles.labelTablet]}>받은 금액</Text>
          <Text style={[styles.amount, styles.receivedAmount, isTablet && styles.amountTablet]}>
            {formatCurrency(receivedAmount)}
          </Text>
        </View>
      </View>

      <View style={[styles.chartSection, isTablet && styles.chartSectionTablet]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContent}
        >
          <View style={[styles.chartContainer, { minWidth: totalMinWidth }]}>
            {monthlyData.map((data, index) => (
              <View key={index} style={styles.barGroup}>
                <View style={styles.barsContainer}>
                  <View
                    style={[
                      styles.bar,
                      styles.sentBar,
                      { height: maxValue > 0 ? (data.sent / maxValue) * (isTablet ? 80 : 60) : 0 },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      styles.receivedBar,
                      { height: maxValue > 0 ? (data.received / maxValue) * (isTablet ? 80 : 60) : 0 },
                    ]}
                  />
                </View>
                <Text style={[styles.monthLabel, isTablet && styles.monthLabelTablet]}>
                  {data.month}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  containerTablet: {
    marginHorizontal: 32,
    padding: 28,
    maxWidth: 736,
    alignSelf: 'center',
    width: '100%',
  },
  balanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceSectionTablet: {
    marginBottom: 8,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  labelTablet: {
    fontSize: 16,
    marginBottom: 10,
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
  },
  amountTablet: {
    fontSize: 28,
  },
  sentAmount: {
    color: '#818CF8',
  },
  receivedAmount: {
    color: '#34D399',
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  dividerTablet: {
    height: 60,
    marginHorizontal: 24,
  },
  chartSection: {
    marginTop: 8,
  },
  chartSectionTablet: {
    marginTop: 16,
  },
  chartScrollContent: {
    flexGrow: 1,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flex: 1,
    height: 100,
    paddingTop: 20,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 6,
  },
  bar: {
    width: 10,
    borderRadius: 3,
  },
  sentBar: {
    backgroundColor: '#818CF8',
  },
  receivedBar: {
    backgroundColor: '#34D399',
  },
  monthLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  monthLabelTablet: {
    fontSize: 12,
  },
});
