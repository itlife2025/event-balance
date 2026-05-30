import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavTabKey } from '../types/navigation';
import { HomeIcon, ChartIcon, ListIcon, SettingsIcon, PlusIcon } from './Icons';
import { useTheme } from '../theme/ThemeContext';

interface BottomNavigationProps {
  activeTab?: NavTabKey;
  onTabPress?: (tab: NavTabKey) => void;
  onAddPress?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = 'home',
  onTabPress,
  onAddPress,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, isTablet ? 24 : 12);

  const renderTab = (
    key: NavTabKey,
    label: string,
    Icon: React.FC<{ size: number; color: string }>
  ) => {
    const isActive = activeTab === key;
    const color = isActive ? colors.primary : colors.textTertiary;

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
          <View style={[styles.activeIndicator, isTablet && styles.activeIndicatorTablet, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, isTablet && styles.containerTablet, { backgroundColor: colors.card, borderTopColor: colors.borderLight, paddingBottom: bottomPadding }]}>
      <View style={[styles.navigation, isTablet && styles.navigationTablet]}>
        {renderTab('home', '홈', HomeIcon)}
        {renderTab('list', '리스트', ListIcon)}

        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            onPress={onAddPress}
            activeOpacity={0.8}
            style={[
              styles.addButton,
              isTablet && styles.addButtonTablet,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
              activeTab === 'register' && { backgroundColor: colors.primaryDark },
            ]}
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
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  containerTablet: {},
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
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelTablet: {
    fontSize: 16,
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
    backgroundColor: '#6366F1', // keep consistent brand color
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -26,
    shadowColor: '#6366F1', // keep consistent brand color
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
  addButtonActive: {
    backgroundColor: '#4338CA',
    transform: [{ scale: 1.05 }],
  },
});
