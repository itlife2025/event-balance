import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { ChevronRightIcon, ChevronLeftIcon, WeddingIcon, FuneralIcon, GiftIcon } from '../components/Icons';
import { Header } from '../components/Header';
import { getUpcomingEvents, type UpcomingEvent } from '../database/queries';
import { type EventTypeKey } from '../constants/eventTypes';

interface CalendarScreenProps {
  onBackPress?: () => void;
  onRegisterSchedule?: () => void;
  onEventPress?: (event: UpcomingEvent) => void;
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

function getCalendarDays(year: number, month: number) {
  const rawFirstDay = new Date(year, month, 1).getDay();
  const firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { day: number; currentMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, currentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, currentMonth: true });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, currentMonth: false });
    }
  }

  return days;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  onBackPress,
  onRegisterSchedule,
  onEventPress,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getUpcomingEvents();
      setEvents(data);
    })();
  }, []);

  const calendarDays = useMemo(
    () => getCalendarDays(calendarYear, calendarMonth),
    [calendarYear, calendarMonth]
  );

  // Parse event dates to find which days have events
  const eventDatesInMonth = useMemo(() => {
    const dates = new Set<number>();
    for (const event of events) {
      // event.date format: "2026.02.16 (월)" - extract the date part
      const datePart = event.date.split(' ')[0];
      const [y, m, d] = datePart.split('.').map(Number);
      if (y === calendarYear && m === calendarMonth + 1) {
        dates.add(d);
      }
    }
    return dates;
  }, [events, calendarYear, calendarMonth]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    const selY = selectedDate.getFullYear();
    const selM = selectedDate.getMonth() + 1;
    const selD = selectedDate.getDate();

    return events.filter(event => {
      const datePart = event.date.split(' ')[0];
      const [y, m, d] = datePart.split('.').map(Number);
      return y === selY && m === selM && d === selD;
    });
  }, [events, selectedDate]);

  const goToPrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear(calendarYear - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(calendarYear + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleDayPress = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return;
    const newDate = new Date(calendarYear, calendarMonth, day);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  };

  const isSelectedDay = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return false;
    return (
      selectedDate.getFullYear() === calendarYear &&
      selectedDate.getMonth() === calendarMonth &&
      selectedDate.getDate() === day
    );
  };

  const isTodayDay = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return false;
    return (
      today.getFullYear() === calendarYear &&
      today.getMonth() === calendarMonth &&
      today.getDate() === day
    );
  };

  const hasEvent = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return false;
    return eventDatesInMonth.has(day);
  };

  const getEventIcon = (type: EventTypeKey) => {
    const size = isTablet ? 24 : 20;
    if (type === 'wedding') return <WeddingIcon size={size} color="#EC4899" />;
    if (type === 'funeral') return <FuneralIcon size={size} color="#3B82F6" />;
    return <GiftIcon size={size} color="#F59E0B" />;
  };

  const getEventIconBg = (type: EventTypeKey) => {
    if (type === 'wedding') return '#FDF2F8';
    if (type === 'funeral') return '#EFF6FF';
    return '#FFFBEB';
  };

  const cellSize = 32;

  return (
    <View style={styles.container}>
      <Header title="일정" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <View style={[styles.calendarContainer, isTablet && styles.calendarContainerTablet]}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.calendarNavButton}>
              <ChevronLeftIcon size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text style={[styles.calendarTitle, isTablet && styles.calendarTitleTablet]}>
              {calendarYear}년 {calendarMonth + 1}월
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
              <ChevronRightIcon size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.calendarWeekdays}>
            {WEEKDAYS.map((day) => (
              <View key={day} style={[styles.calendarCell, { height: cellSize * 0.7 }]}>
                <Text style={[styles.calendarWeekdayText, isTablet && styles.calendarWeekdayTextTablet]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.calendarDaysGrid}>
            {calendarDays.map((item, index) => {
              const selected = isSelectedDay(item.day, item.currentMonth);
              const isToday = isTodayDay(item.day, item.currentMonth);
              const eventDay = hasEvent(item.day, item.currentMonth);

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.calendarCell, { height: cellSize + 8 }]}
                  onPress={() => handleDayPress(item.day, item.currentMonth)}
                  disabled={!item.currentMonth}
                  activeOpacity={0.6}
                >
                  <View style={[
                    styles.calendarDayInner,
                    { width: cellSize, height: cellSize, borderRadius: cellSize / 2 },
                    selected && styles.calendarDaySelected,
                    isToday && !selected && styles.calendarDayToday,
                  ]}>
                    <Text style={[
                      styles.calendarDayText,
                      isTablet && styles.calendarDayTextTablet,
                      !item.currentMonth && styles.calendarDayTextDisabled,
                      selected && styles.calendarDayTextSelected,
                    ]}>
                      {item.day}
                    </Text>
                  </View>
                  {eventDay && (
                    <View style={styles.eventDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Date Events */}
        <View style={[styles.eventsSection, isTablet && styles.eventsSectionTablet]}>
          <View style={styles.eventsSectionHeader}>
            <Text style={[styles.eventsSectionTitle, isTablet && styles.eventsSectionTitleTablet]}>
              {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
            </Text>
            <TouchableOpacity
              style={[styles.registerButton, isTablet && styles.registerButtonTablet]}
              onPress={onRegisterSchedule}
              activeOpacity={0.7}
            >
              <Text style={[styles.registerButtonText, isTablet && styles.registerButtonTextTablet]}>
                일정 등록
              </Text>
            </TouchableOpacity>
          </View>

          {selectedDateEvents.length === 0 ? (
            <View style={styles.emptyEvents}>
              <Text style={styles.emptyEventsText}>등록된 일정이 없습니다.</Text>
            </View>
          ) : (
            selectedDateEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventItem, isTablet && styles.eventItemTablet]}
                onPress={() => onEventPress?.(event)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.eventIcon,
                  isTablet && styles.eventIconTablet,
                  { backgroundColor: getEventIconBg(event.type) },
                ]}>
                  {getEventIcon(event.type)}
                </View>
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventName, isTablet && styles.eventNameTablet]} numberOfLines={1}>
                    {event.name}
                  </Text>
                  <Text style={[styles.eventDate, isTablet && styles.eventDateTablet]}>
                    {event.date}{event.relationship ? ` · ${event.relationship}` : ''}
                  </Text>
                  {!!event.memo && (
                    <Text style={[styles.eventMemo, isTablet && styles.eventMemoTablet]} numberOfLines={2}>
                      {event.memo}
                    </Text>
                  )}
                </View>
                <View style={[styles.eventBadge, { backgroundColor: getEventIconBg(event.type) }]}>
                  <Text style={styles.eventBadgeText}>D-{event.daysLeft}</Text>
                </View>
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  scrollContentTablet: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },

  // Calendar
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  calendarContainerTablet: {
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  calendarTitleTablet: {
    fontSize: 18,
  },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarCell: {
    width: '14.285%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  calendarWeekdayTextTablet: {
    fontSize: 13,
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDaySelected: {
    backgroundColor: '#6366F1',
  },
  calendarDayToday: {
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  calendarDayTextTablet: {
    fontSize: 14,
  },
  calendarDayTextDisabled: {
    color: '#D1D5DB',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6366F1',
    marginTop: 2,
  },

  // Events Section
  eventsSection: {
    marginBottom: 20,
  },
  eventsSectionTablet: {
    marginBottom: 24,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  eventsSectionTitleTablet: {
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  registerButtonTablet: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  registerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registerButtonTextTablet: {
    fontSize: 13,
  },
  emptyEvents: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyEventsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  eventItemTablet: {
    padding: 16,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventIconTablet: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  eventNameTablet: {
    fontSize: 15,
  },
  eventDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  eventDateTablet: {
    fontSize: 13,
  },
  eventMemo: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  eventMemoTablet: {
    fontSize: 12,
  },
  eventBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
});
