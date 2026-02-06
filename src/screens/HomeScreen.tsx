import React, { useState } from 'react';
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

type TabKey = 'home' | 'list' | 'register' | 'stats' | 'settings';

const sampleEvents: Event[] = [
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

const sampleRecords: Record[] = [
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

const sampleMonthlyData = [
  { month: '2025년 8월', sent: 45, received: 60 },
  { month: '2025년 9월', sent: 30, received: 50 },
  { month: '2025년 10월', sent: 55, received: 40 },
  { month: '2025년 11월', sent: 70, received: 45 },
  { month: '2025년 12월', sent: 60, received: 80 },
  { month: '2026년 1월', sent: 35, received: 55 },
];

export const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [showDetailScreen, setShowDetailScreen] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const handleNotificationPress = () => {
    // Notification pressed
  };

  const handleEventPress = (event: Event) => {
    // Event pressed
  };

  const handleRecordPress = (record: Record) => {
    // Record pressed
  };

  const handleTabPress = (tab: TabKey) => {
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
            onNavPress={handleTabPress}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onNavPress={handleTabPress}
            onAddPress={handleAddPress}
          />
        );
      case 'stats':
        return (
          <StatsScreen
          // onNavPress={handleTabPress}
          // onAddPress={handleAddPress}
          />
        );
      case 'list':
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
                <ListScreen onTransactionPress={() => setShowDetailScreen(true)} />
              </View>
            </ScrollView>
          </View>
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
                  sentAmount={850000}
                  receivedAmount={1200000}
                  monthlyData={sampleMonthlyData}
                />
                <UpcomingEvents events={sampleEvents} onEventPress={handleEventPress} />
                <RecentRecords records={sampleRecords} onRecordPress={handleRecordPress} />
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
          onNavPress={handleTabPress}
          onAddPress={() => setActiveTab('register')}
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
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  scrollContentTablet: {
    paddingTop: 16,
    maxWidth: 800,
    width: '100%',
  },
  contentWrapper: {
    maxWidth: 800,
    width: '100%',
  },
});
