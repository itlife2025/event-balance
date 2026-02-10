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
import { DetailScreen } from './DetailScreen';
import { SettingsScreen } from './SettingsScreen';
import { ListScreen } from './ListScreen';
import { StatsScreen } from './StatsScreen';
import { initDatabase } from '../database/database';
import { getYearlyTotals, getMonthlyBreakdown, getRecentRecords, getUpcomingEvents, type MonthlyData, type RecentRecord, type UpcomingEvent } from '../database/queries';

import { NavTabKey } from '../types/navigation';



export const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTabKey>('home');
  const [showDetailScreen, setShowDetailScreen] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
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
    // Event pressed
  };

  const handleRecordPress = (record: Record) => {
    // Record pressed
  };

  const handleTabPress = (tab: NavTabKey) => {
    setActiveTab(tab);
    setShowDetailScreen(false);
  };

  const handleAddPress = () => {
    setActiveTab('register');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'register':
        return (
          <RegisterScreen
            onClose={() => setActiveTab('home')}
          />
        );
      case 'settings':
        return (
          <SettingsScreen />
        );
      case 'stats':
        return (
          <StatsScreen />
        );
      case 'list':
        return (
          <ListScreen
            onTransactionPress={() => setShowDetailScreen(true)}
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
                <UpcomingEvents events={upcomingEvents} onEventPress={handleEventPress} />
                <RecentRecords records={recentRecords} onRecordPress={handleRecordPress} />
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
          onClose={() => {
            setShowDetailScreen(false);
            setActiveTab('home');
          }}
        />
      ) : (
        <>
          {/* Main Content Area */}
          <View style={{ flex: 1, paddingBottom: 60 }}>
            {renderContent()}
          </View>

          {/* Global Bottom Navigation */}
          {/* Register 화면 등 네비게이션이 필요한 모든 화면에 공통 적용 */}
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
