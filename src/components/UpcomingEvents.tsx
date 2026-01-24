import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {
  CalendarIcon,
  WeddingIcon,
  FuneralIcon,
  ChevronRightIcon,
} from './Icons';

export type EventType = 'wedding' | 'funeral';

export interface Event {
  id: string;
  name: string;
  type: EventType;
  date: string;
  daysLeft: number;
}

interface UpcomingEventsProps {
  events?: Event[];
  onEventPress?: (event: Event) => void;
  onMorePress?: () => void;
}

const defaultEvents: Event[] = [
  {
    id: '1',
    name: '김민수 결혼식',
    type: 'wedding',
    date: '2024.04.22 (월)',
    daysLeft: 5,
  },
  {
    id: '2',
    name: '이영호 상',
    type: 'funeral',
    date: '2024.04.29',
    daysLeft: 12,
  },
  {
    id: '3',
    name: '박서연 결혼식',
    type: 'wedding',
    date: '2024.05.05 (일)',
    daysLeft: 18,
  },
  {
    id: '4',
    name: '최준혁 결혼식',
    type: 'wedding',
    date: '2024.05.12 (일)',
    daysLeft: 25,
  },
];

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events = defaultEvents,
  onEventPress,
  onMorePress,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const getEventIcon = (type: EventType) => {
    if (type === 'wedding') {
      return <WeddingIcon size={isTablet ? 28 : 24} color="#EC4899" />;
    }
    return <FuneralIcon size={isTablet ? 28 : 24} color="#3B82F6" />;
  };

  const getEventStyle = (type: EventType) => {
    if (type === 'wedding') {
      return {
        iconBg: '#FDF2F8',
        badgeBg: '#FDF2F8',
        badgeText: '#EC4899',
      };
    }
    return {
      iconBg: '#EFF6FF',
      badgeBg: '#EFF6FF',
      badgeText: '#3B82F6',
    };
  };

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <TouchableOpacity
        style={styles.header}
        onPress={onMorePress}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <CalendarIcon size={isTablet ? 22 : 18} color="#6B7280" />
          <Text style={[styles.title, isTablet && styles.titleTablet]}>
            다가오는 경조사
          </Text>
        </View>
        <ChevronRightIcon size={isTablet ? 28 : 24} color="#9CA3AF" />
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.eventsContainer,
          isTablet && styles.eventsContainerTablet,
        ]}
      >
        {events.map((event) => {
          const eventStyle = getEventStyle(event.type);
          return (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, isTablet && styles.eventCardTablet]}
              onPress={() => onEventPress?.(event)}
              activeOpacity={0.7}
            >
              <View style={styles.eventContent}>
                <View
                  style={[
                    styles.iconContainer,
                    isTablet && styles.iconContainerTablet,
                    { backgroundColor: eventStyle.iconBg },
                  ]}
                >
                  {getEventIcon(event.type)}
                </View>
                <View style={styles.eventInfo}>
                  <Text
                    style={[styles.eventName, isTablet && styles.eventNameTablet]}
                    numberOfLines={1}
                  >
                    {event.name}
                  </Text>
                  <Text
                    style={[styles.eventDate, isTablet && styles.eventDateTablet]}
                  >
                    {event.date}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      isTablet && styles.badgeTablet,
                      { backgroundColor: eventStyle.badgeBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isTablet && styles.badgeTextTablet,
                        { color: eventStyle.badgeText },
                      ]}
                    >
                      D-{event.daysLeft}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  containerTablet: {
    paddingHorizontal: 32,
    marginTop: 32,
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
  eventsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  eventsContainerTablet: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventCardTablet: {
    padding: 20,
    minWidth: 200,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerTablet: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventNameTablet: {
    fontSize: 16,
    marginBottom: 6,
  },
  eventDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  eventDateTablet: {
    fontSize: 14,
    marginBottom: 10,
  },
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTablet: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextTablet: {
    fontSize: 14,
  },
});
