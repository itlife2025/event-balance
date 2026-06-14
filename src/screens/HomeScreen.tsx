import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Header } from '../components/Header';
import { BalanceCard } from '../components/BalanceCard';
import { UpcomingEvents, Event } from '../components/UpcomingEvents';
import { RecentRecords, Record } from '../components/RecentRecords';
import { BottomNavigation } from '../components/BottomNavigation';
import { RegisterScreen, type RegisterInitialData } from './RegisterScreen';
import { RegisterScheduleScreen, type ScheduleData } from './RegisterScheduleScreen';
import { CalendarScreen } from './CalendarScreen';
import { DetailScreen } from './DetailScreen';
import { SettingsScreen } from './SettingsScreen';
import { ListScreen } from './ListScreen';
import { StatsScreen } from './StatsScreen';
import { getYearlyTotals, getMonthlyBreakdown, getRecentRecords, getUpcomingEvents, hasAnySchedule, getScheduleById, formatDate, deleteSchedule, unlinkEventsByScheduleId, type MonthlyData, type RecentRecord, type UpcomingEvent } from '../database/queries';
import { withDbRetry } from '../database/database';
import type { PeriodFilter } from './StatsScreen';
import { useNotifications, type NotificationItem } from '../context/NotificationContext';
import { NotificationPanel } from '../components/NotificationPanel';
import { scheduleAllNotifications, dismissScheduleNotifications } from '../services/NotificationService';

const refreshUpcomingEvents = async (setter: (events: UpcomingEvent[]) => void) => {
  const events = await getUpcomingEvents();
  setter(events);
};

import { NavTabKey } from '../types/navigation';



interface NavState {
  activeTab: NavTabKey;
  showDetailScreen: boolean;
  showRegisterSchedule: boolean;
  showCalendar: boolean;
  scheduleInitialData?: ScheduleData;
  registerInitialData?: RegisterInitialData;
}

const getDefaultNavState = (): NavState => ({
  activeTab: 'home',
  showDetailScreen: false,
  showRegisterSchedule: false,
  showCalendar: false,
  scheduleInitialData: undefined,
  registerInitialData: undefined,
});

export const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTabKey>('home');
  const [showDetailScreen, setShowDetailScreen] = useState(false);
  const [showRegisterSchedule, setShowRegisterSchedule] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [scheduleInitialData, setScheduleInitialData] = useState<ScheduleData | undefined>(undefined);
  const [registerInitialData, setRegisterInitialData] = useState<RegisterInitialData | undefined>(undefined);
  const [detailName, setDetailName] = useState('');
  const [detailPhone, setDetailPhone] = useState('');
  const [listSelectedYear, setListSelectedYear] = useState(new Date().getFullYear());
  const [listActiveFilter, setListActiveFilter] = useState<'all' | 'received' | 'sent'>('all');
  const [listSearchQuery, setListSearchQuery] = useState('');

  // Stats screen state — preserved when navigating to detail and back
  const today = new Date();
  const [statsActivePeriod, setStatsActivePeriod] = useState<PeriodFilter>('month');
  const [statsSelectedYear, setStatsSelectedYear] = useState(today.getFullYear());
  const [statsSelectedMonth, setStatsSelectedMonth] = useState(today.getMonth() + 1);
  const [statsSelectedYearTab, setStatsSelectedYearTab] = useState(today.getFullYear());
  const [statsAmountTab, setStatsAmountTab] = useState<'sent' | 'received'>('sent');
  const [navHistory, setNavHistory] = useState<NavState[]>([]);
  const { notifications, isPanelOpen, closePanel, clearAll, dismissNotification } = useNotifications();

  const pushNavState = () => {
    setNavHistory(prev => [...prev, {
      activeTab,
      showDetailScreen,
      showRegisterSchedule,
      showCalendar,
      scheduleInitialData,
      registerInitialData,
    }]);
  };

  const goBack = () => {
    setNavHistory(prev => {
      if (prev.length === 0) {
        // No history, go to home
        setActiveTab('home');
        setShowDetailScreen(false);
        setShowRegisterSchedule(false);
        setShowCalendar(false);
        setScheduleInitialData(undefined);
        setRegisterInitialData(undefined);
        return [];
      }
      const newHistory = [...prev];
      const last = newHistory.pop()!;
      setActiveTab(last.activeTab);
      setShowDetailScreen(last.showDetailScreen);
      setShowRegisterSchedule(last.showRegisterSchedule);
      setShowCalendar(last.showCalendar);
      setScheduleInitialData(last.scheduleInitialData);
      setRegisterInitialData(last.registerInitialData);
      return newHistory;
    });
  };
  const [sentAmount, setSentAmount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [scheduleExists, setScheduleExists] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  // Nav bar height (~52) + nav bottom padding (insets.bottom or min 12)
  const navBarHeight = 52 + 8 + Math.max(insets.bottom, isTablet ? 24 : 12);

  const currentYear = new Date().getFullYear();

  const refreshHomeData = async () => {
    try {
      await withDbRetry(async () => {
        const [totals, monthly, records, events, anySchedule] = await Promise.all([
          getYearlyTotals(currentYear),
          getMonthlyBreakdown(currentYear),
          getRecentRecords(3),
          getUpcomingEvents(),
          hasAnySchedule(),
        ]);
        setSentAmount(totals.sentAmount);
        setReceivedAmount(totals.receivedAmount);
        setMonthlyData(monthly);
        setRecentRecords(records);
        setUpcomingEvents(events);
        setScheduleExists(anySchedule);
      });
    } catch (error) {
      console.error('Data refresh error:', error);
    }
  };

  useEffect(() => {
    refreshHomeData();
  }, [currentYear]);

  // 홈 탭으로 돌아올 때 데이터 새로고침
  useEffect(() => {
    if (activeTab === 'home' && !showDetailScreen && !showRegisterSchedule && !showCalendar) {
      refreshHomeData();
    }
  }, [activeTab, showDetailScreen, showRegisterSchedule, showCalendar]);

  // Android 뒤로가기 버튼 처리
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      // 서브 화면이 열려있으면 goBack 실행
      if (showDetailScreen || showRegisterSchedule || showCalendar || showSettingsScreen) {
        goBack();
        return true;
      }
      // 홈 탭이 아니면 홈으로 이동
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      // 홈 탭이면 기본 동작 (앱 종료)
      return false;
    });
    return () => handler.remove();
  }, [activeTab, showDetailScreen, showRegisterSchedule, showCalendar, showSettingsScreen]);

  const handleNotificationItemPress = async (item: NotificationItem) => {
    if (!item.scheduleId) return;
    dismissNotification(item.id);
    const record = await getScheduleById(item.scheduleId);
    if (!record) return;
    pushNavState();
    setScheduleInitialData({
      id: record.id,
      name: record.name,
      phone: record.phone,
      type: record.type as import('../components/UpcomingEvents').EventType,
      date: formatDate(record.date),
      relationship: record.relationship,
      memo: record.memo,
    });
    setShowRegisterSchedule(true);
  };

  const handleDeleteSchedule = (id: string) => {
    Alert.alert(
      '일정 삭제',
      '이 일정을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkEventsByScheduleId(id);
              await deleteSchedule(id);
              dismissScheduleNotifications(id).catch(() => {});
              scheduleAllNotifications().catch(() => {});
              refreshHomeData();
            } catch (error) {
              console.error('Failed to delete schedule:', error);
            }
          },
        },
      ],
    );
  };

  const handleEventPress = (event: Event) => {
    pushNavState();
    setScheduleInitialData({
      id: event.id,
      name: event.name,
      phone: event.phone,
      type: event.type,
      date: event.date,
      relationship: event.relationship,
      memo: event.memo,
    });
    setShowRegisterSchedule(true);
  };

  const handleRecordPress = (record: Record) => {
    console.log('[HomeScreen] record:', JSON.stringify(record));
    pushNavState();
    setDetailName(record.name);
    setDetailPhone(record.phone);
    setShowDetailScreen(true);
  };

  const handleRecentRecordsMorePress = () => {
    pushNavState();
    setActiveTab('list');
    setShowDetailScreen(false);
    setShowRegisterSchedule(false);
    setShowCalendar(false);
  };

  const handleTabPress = (tab: NavTabKey) => {
    pushNavState();
    setActiveTab(tab);
    setShowDetailScreen(false);
    setShowRegisterSchedule(false);
    setShowCalendar(false);
    setScheduleInitialData(undefined);
    setRegisterInitialData(undefined);
  };

  const handleAddPress = () => {
    pushNavState();
    setActiveTab('register');
    setShowRegisterSchedule(false);
    setShowCalendar(false);
    setRegisterInitialData(undefined);
  };

  const renderContent = () => {
    if (showCalendar) {
      return (
        <CalendarScreen
          onBackPress={goBack}
          onEventDelete={async (eventId) => {
            try {
              await unlinkEventsByScheduleId(eventId);
              await deleteSchedule(eventId);
              dismissScheduleNotifications(eventId).catch(() => {});
              scheduleAllNotifications().catch(() => {});
              refreshHomeData();
            } catch (error) {
              console.error('Failed to delete schedule:', error);
            }
          }}
          onRegisterSchedule={() => {
            pushNavState();
            setShowCalendar(false);
            setScheduleInitialData(undefined);
            setShowRegisterSchedule(true);
          }}
          onEventPress={(event) => {
            pushNavState();
            setScheduleInitialData({
              id: event.id,
              name: event.name,
              phone: event.phone,
              type: event.type,
              date: event.date,
              relationship: event.relationship,
              memo: event.memo,
            });
            setShowCalendar(false);
            setShowRegisterSchedule(true);
          }}
        />
      );
    }

    if (showRegisterSchedule) {
      return (
        <RegisterScheduleScreen
          onClose={goBack}
          onSaved={() => {
            refreshUpcomingEvents(setUpcomingEvents);
          }}
          initialData={scheduleInitialData}
          onDelete={async (id) => {
            try {
              await unlinkEventsByScheduleId(id);
              await deleteSchedule(id);
              dismissScheduleNotifications(id).catch(() => {});
              scheduleAllNotifications().catch(() => {});
              refreshHomeData();
              goBack();
            } catch (error) {
              console.error('Failed to delete schedule:', error);
            }
          }}
          onRegisterEvent={(data) => {
            pushNavState();
            setRegisterInitialData({
              ...data,
              scheduleId: data.id,
            });
            setShowRegisterSchedule(false);
            setScheduleInitialData(undefined);
            setActiveTab('register');
          }}
        />
      );
    }

    switch (activeTab) {
      case 'register':
        return (
          <RegisterScreen
            onClose={goBack}
            onGoToList={() => {
              setActiveTab('list');
            }}
            initialData={registerInitialData}
          />
        );
      case 'settings':
        return (
          <SettingsScreen onBackPress={goBack} onDataReset={refreshHomeData} />
        );
      case 'stats':
        return (
          <StatsScreen
            onBackPress={goBack}
            onDetailPress={(name, phone) => {
              pushNavState();
              setDetailName(name);
              setDetailPhone(phone);
              setShowDetailScreen(true);
            }}
            initialActivePeriod={statsActivePeriod}
            onActivePeriodChange={setStatsActivePeriod}
            initialSelectedYear={statsSelectedYear}
            onSelectedYearChange={setStatsSelectedYear}
            initialSelectedMonth={statsSelectedMonth}
            onSelectedMonthChange={setStatsSelectedMonth}
            initialSelectedYearTab={statsSelectedYearTab}
            onSelectedYearTabChange={setStatsSelectedYearTab}
            initialAmountTab={statsAmountTab}
            onAmountTabChange={setStatsAmountTab}
          />
        );
      case 'list':
        return (
          <ListScreen
            selectedYear={listSelectedYear}
            onYearChange={setListSelectedYear}
            activeFilter={listActiveFilter}
            onFilterChange={setListActiveFilter}
            searchQuery={listSearchQuery}
            onSearchChange={setListSearchQuery}
            onTransactionPress={(transaction) => {
              console.log('[HomeScreen] transaction:', JSON.stringify(transaction));
              pushNavState();
              setDetailName(transaction.name);
              setDetailPhone(transaction.phone);
              setShowDetailScreen(true);
            }}
            onBackPress={goBack}
          />
        );
      case 'home':
      default:
        // 기본 홈 화면 컨텐츠
        return (
          <View style={[styles.container, isTablet && styles.containerTablet, { backgroundColor: colors.background }]}>
            <Header />
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                isTablet && styles.scrollContentTablet,
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.contentWrapper}>
                <BalanceCard
                  sentAmount={sentAmount}
                  receivedAmount={receivedAmount}
                  monthlyData={monthlyData}
                />
                <UpcomingEvents
                  events={upcomingEvents}
                  hasSchedules={scheduleExists}
                  onEventPress={handleEventPress}
                  onEventLongPress={(event) => handleDeleteSchedule(event.id)}
                  onAddPress={() => {
                    pushNavState();
                    setScheduleInitialData(undefined);
                    setShowRegisterSchedule(true);
                  }}
                  onMorePress={() => {
                    pushNavState();
                    setShowCalendar(true);
                  }}
                />
                <RecentRecords records={recentRecords} onRecordPress={handleRecordPress} onMorePress={handleRecentRecordsMorePress} />
              </View>
            </ScrollView>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {showDetailScreen ? (
        <DetailScreen
          name={detailName}
          phone={detailPhone}
          onClose={goBack}
          onEdit={(data) => {
            pushNavState();
            setRegisterInitialData({
              name: data.name,
              phone: data.phone,
              type: data.type,
              date: data.date,
              relationship: data.relationship,
              memo: data.memo,
              editId: data.id,
              amount: data.amount,
              amountType: data.isSent ? 'send' : 'received',
            });
            setShowDetailScreen(false);
            setActiveTab('register');
          }}
        />
      ) : (
        <>
          {/* Main Content Area */}
          <View style={{ flex: 1, paddingBottom: navBarHeight }}>
            {renderContent()}
          </View>

          {/* Global Bottom Navigation */}
          <BottomNavigation
            activeTab={activeTab}
            onTabPress={handleTabPress}
            onAddPress={handleAddPress}
          />
        </>
      )}

      <NotificationPanel
        visible={isPanelOpen}
        notifications={notifications}
        onClose={closePanel}
        onClearAll={clearAll}
        onNotificationPress={handleNotificationItemPress}
      />
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
    paddingTop: 8,
    paddingBottom: 20,
  },
  scrollContentTablet: {
    paddingTop: 16,
  },
  contentWrapper: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
});
