import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

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

const defaultMonthlyData: MonthlyData[] = [
  { month: '2025년 8월', sent: 45, received: 60 },
  { month: '2025년 9월', sent: 30, received: 50 },
  { month: '2025년 10월', sent: 55, received: 40 },
  { month: '2025년 11월', sent: 70, received: 45 },
  { month: '2025년 12월', sent: 60, received: 80 },
  { month: '2026년 1월', sent: 35, received: 55 },
];

export const BalanceCard: React.FC<BalanceCardProps> = ({
  sentAmount = 850000,
  receivedAmount = 1200000,
  monthlyData = defaultMonthlyData,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  const maxValue = Math.max(
    ...monthlyData.flatMap(d => [d.sent, d.received])
  );

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
        <View style={styles.chartContainer}>
          {monthlyData.map((data, index) => (
            <View key={index} style={styles.barGroup}>
              <View style={styles.barsContainer}>
                <View
                  style={[
                    styles.bar,
                    styles.sentBar,
                    { height: (data.sent / maxValue) * (isTablet ? 80 : 60) },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    styles.receivedBar,
                    { height: (data.received / maxValue) * (isTablet ? 80 : 60) },
                  ]}
                />
              </View>
              <Text style={[styles.monthLabel, isTablet && styles.monthLabelTablet]}>
                {data.month}
              </Text>
            </View>
          ))}
        </View>
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
    marginBottom: 20,
  },
  balanceSectionTablet: {
    marginBottom: 28,
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
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: 20,
  },
  barGroup: {
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 8,
  },
  bar: {
    width: 16,
    borderRadius: 4,
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
