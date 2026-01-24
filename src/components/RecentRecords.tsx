import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ListIcon, WeddingIcon, FuneralIcon, ChevronRightIcon } from './Icons';
import { EventType } from './UpcomingEvents';

export interface Record {
  id: string;
  name: string;
  type: EventType;
  date: string;
  amount: number;
  isSent: boolean;
}

interface RecentRecordsProps {
  records?: Record[];
  onRecordPress?: (record: Record) => void;
  onMorePress?: () => void;
}

const defaultRecords: Record[] = [
  {
    id: '1',
    name: '김민수 결혼식',
    type: 'wedding',
    date: '2024.04.15 (금)',
    amount: 200000,
    isSent: true,
  },
  {
    id: '2',
    name: '이영호 조의금',
    type: 'funeral',
    date: '2023.03.30 (목)',
    amount: 100000,
    isSent: true,
  },
];

export const RecentRecords: React.FC<RecentRecordsProps> = ({
  records = defaultRecords,
  onRecordPress,
  onMorePress,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  const getRecordIcon = (type: EventType) => {
    if (type === 'wedding') {
      return <WeddingIcon size={isTablet ? 24 : 20} color="#EC4899" />;
    }
    return <FuneralIcon size={isTablet ? 24 : 20} color="#3B82F6" />;
  };

  const getIconBgColor = (type: EventType) => {
    return type === 'wedding' ? '#FDF2F8' : '#EFF6FF';
  };

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <TouchableOpacity
        style={styles.header}
        onPress={onMorePress}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <ListIcon size={isTablet ? 22 : 18} color="#6B7280" />
          <Text style={[styles.title, isTablet && styles.titleTablet]}>
            최근 기록
          </Text>
        </View>
        <ChevronRightIcon size={isTablet ? 28 : 24} color="#9CA3AF" />
      </TouchableOpacity>

      <View style={[styles.recordsContainer, isTablet && styles.recordsContainerTablet]}>
        {records.map((record, index) => (
          <TouchableOpacity
            key={record.id}
            style={[
              styles.recordItem,
              isTablet && styles.recordItemTablet,
              index < records.length - 1 && styles.recordItemBorder,
            ]}
            onPress={() => onRecordPress?.(record)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                isTablet && styles.iconContainerTablet,
                { backgroundColor: getIconBgColor(record.type) },
              ]}
            >
              {getRecordIcon(record.type)}
            </View>
            <View style={styles.recordInfo}>
              <Text style={[styles.recordName, isTablet && styles.recordNameTablet]}>
                {record.name}
              </Text>
              <Text style={[styles.recordDate, isTablet && styles.recordDateTablet]}>
                {record.date}
              </Text>
            </View>
            <Text style={[styles.recordAmount, isTablet && styles.recordAmountTablet]}>
              {record.isSent ? '-' : '+'}{formatCurrency(record.amount)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  containerTablet: {
    paddingHorizontal: 32,
    marginTop: 32,
    paddingBottom: 120,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  titleTablet: {
    fontSize: 18,
  },
  recordsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recordsContainerTablet: {
    borderRadius: 20,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  recordItemTablet: {
    padding: 20,
  },
  recordItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerTablet: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  recordInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recordName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  recordNameTablet: {
    fontSize: 16,
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  recordDateTablet: {
    fontSize: 14,
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  recordAmountTablet: {
    fontSize: 18,
  },
});
