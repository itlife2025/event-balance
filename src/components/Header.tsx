import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { BellIcon, ChevronLeftIcon } from './Icons';

interface HeaderProps {
  title?: string;
  onNotificationPress?: () => void;
  onBackPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = '경조사 관리',
  onNotificationPress,
  onBackPress,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      {onBackPress ? (
        <TouchableOpacity
          style={[styles.iconButton, isTablet && styles.iconButtonTablet]}
          onPress={onBackPress}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon size={isTablet ? 28 : 24} color="#6B7280" />
        </TouchableOpacity>
      ) : (
        <View style={[styles.iconButton, isTablet && styles.iconButtonTablet, styles.placeholder]} />
      )}

      <Text style={[styles.title, isTablet && styles.titleTablet]}>{title}</Text>

      <TouchableOpacity
        style={[styles.iconButton, isTablet && styles.iconButtonTablet]}
        onPress={onNotificationPress}
        activeOpacity={0.7}
      >
        <BellIcon size={isTablet ? 28 : 24} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  containerTablet: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonTablet: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  placeholder: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  titleTablet: {
    fontSize: 22,
  },
});
