import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Header } from '../components/Header';
import { BalanceCard } from '../components/BalanceCard';
import { UpcomingEvents, Event } from '../components/UpcomingEvents';
import { RecentRecords, Record } from '../components/RecentRecords';
import { BottomNavigation } from '../components/BottomNavigation';
import { RegisterScreen } from './RegisterScreen';
import { RegisterScheduleScreen, type ScheduleData } from './RegisterScheduleScreen';
import { CalendarScreen } from './CalendarScreen';
import { DetailScreen } from './DetailScreen';
import { SettingsScreen } from './SettingsScreen';
import { ListScreen } from './ListScreen';
import { StatsScreen } from './StatsScreen';
import { initDatabase } from '../database/database';
import { getYearlyTotals, getMonthlyBreakdown, getRecentRecords, getUpcomingEvents, type MonthlyData, type RecentRecord, type UpcomingEvent } from '../database/queries';

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
  registerInitialData?: ScheduleData;
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
  const [registerInitialData, setRegisterInitialData] = useState<ScheduleData | undefined>(undefined);
  const [detailName, setDetailName] = useState('');
  const [listSelectedYear, setListSelectedYear] = useState(new Date().getFullYear());
  const [navHistory, setNavHistory] = useState<NavState[]>([]);

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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const totals = await getYearlyTotals(currentYear);
        setSentAmount(totals.sentAmount);
        setReceivedAmount(totals.receivedAmount);
        const monthly = await getMonthlyBreakdown(currentYear);
        setMonthlyData(monthly);
        const records = await getRecentRecords(3);
        setRecentRecords(records);
        const events = await getUpcomingEvents();
        setUpcomingEvents(events);
      } catch (error) {
        console.error('DB init error:', error);
      }
    })();
  }, [currentYear]);

  const handleNotificationPress = () => {
    // Notification pressed
  };

  const handleEventPress = (event: Event) => {
    pushNavState();
    setScheduleInitialData({
      name: event.name,
      type: event.type,
      date: event.date,
      relationship: event.relationship,
      memo: event.memo,
    });
    setShowRegisterSchedule(true);
  };

  const handleRecordPress = (record: Record) => {
    pushNavState();
    setDetailName(record.name);
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
          onRegisterSchedule={() => {
            pushNavState();
            setShowCalendar(false);
            setScheduleInitialData(undefined);
            setShowRegisterSchedule(true);
          }}
          onEventPress={(event) => {
            pushNavState();
            setScheduleInitialData({
              name: event.name,
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
          onRegisterEvent={(data) => {
            pushNavState();
            setRegisterInitialData(data);
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
            onSaved={async () => {
              const [totals, monthly, records] = await Promise.all([
                getYearlyTotals(currentYear),
                getMonthlyBreakdown(currentYear),
                getRecentRecords(3),
              ]);
              setSentAmount(totals.sentAmount);
              setReceivedAmount(totals.receivedAmount);
              setMonthlyData(monthly);
              setRecentRecords(records);
              goBack();
            }}
            initialData={registerInitialData}
          />
        );
      case 'settings':
        return (
          <SettingsScreen onBackPress={goBack} />
        );
      case 'stats':
        return (
          <StatsScreen onBackPress={goBack} />
        );
      case 'list':
        return (
          <ListScreen
            selectedYear={listSelectedYear}
            onYearChange={setListSelectedYear}
            onTransactionPress={(transaction) => {
              pushNavState();
              setDetailName(transaction.name);
              setShowDetailScreen(true);
            }}
            onBackPress={goBack}
          />
        );
      case 'home':
      default:
        // 기본 홈 화면 컨텐츠
        return (
          <View style={[styles.container, isTablet && styles.containerTablet]}>
            <Header onNotificationPress={handleNotificationPress} />
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
                  onEventPress={handleEventPress}
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      {showDetailScreen ? (
        <DetailScreen
          name={detailName}
          onClose={goBack}
        />
      ) : (
        <>
          {/* Main Content Area */}
          <View style={{ flex: 1, paddingBottom: 60 }}>
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
