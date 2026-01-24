import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { HomeIcon, ChartIcon, ListIcon, SettingsIcon, PlusIcon } from './Icons';

type TabKey = 'home' | 'list' | 'stats' | 'settings';

interface BottomNavigationProps {
  activeTab?: TabKey;
  onTabPress?: (tab: TabKey) => void;
  onAddPress?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = 'home',
  onTabPress,
  onAddPress,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const renderTab = (
    key: TabKey,
    label: string,
    Icon: React.FC<{ size: number; color: string }>
  ) => {
    const isActive = activeTab === key;
    const color = isActive ? '#6366F1' : '#9CA3AF';

    return (
      <TouchableOpacity
        key={key}
        style={styles.tabItem}
        onPress={() => onTabPress?.(key)}
        activeOpacity={0.7}
      >
        <Icon size={isTablet ? 28 : 24} color={color} />
        <Text
          style={[
            styles.tabLabel,
            isTablet && styles.tabLabelTablet,
            { color },
            isActive && styles.tabLabelActive,
          ]}
        >
          {label}
        </Text>
        {isActive && (
          <View style={[styles.activeIndicator, isTablet && styles.activeIndicatorTablet]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <View style={[styles.navigation, isTablet && styles.navigationTablet]}>
        {renderTab('home', '홈', HomeIcon)}
        {renderTab('list', '리스트', ListIcon)}

        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={[styles.addButton, isTablet && styles.addButtonTablet]}
            onPress={onAddPress}
            activeOpacity={0.8}
          >
            <PlusIcon size={isTablet ? 28 : 24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {renderTab('stats', '통계', ChartIcon)}
        {renderTab('settings', '설정', SettingsIcon)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  containerTablet: {
    paddingBottom: 24,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
  },
  navigationTablet: {
    paddingTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelTablet: {
    fontSize: 13,
    marginTop: 6,
  },
  tabLabelActive: {
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  activeIndicatorTablet: {
    width: 32,
    height: 4,
  },
  addButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -26,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonTablet: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -30,
  },
});
