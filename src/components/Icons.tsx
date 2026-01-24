import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

// Profile/User Icon
export const ProfileIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.profileHead, {
      width: size * 0.4,
      height: size * 0.4,
      borderRadius: size * 0.2,
      backgroundColor: color,
      top: size * 0.1
    }]} />
    <View style={[styles.profileBody, {
      width: size * 0.7,
      height: size * 0.35,
      borderTopLeftRadius: size * 0.35,
      borderTopRightRadius: size * 0.35,
      backgroundColor: color,
      bottom: 0
    }]} />
  </View>
);

// Plus Icon
export const PlusIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.plusHorizontal, {
      width: size * 0.6,
      height: size * 0.12,
      backgroundColor: color,
    }]} />
    <View style={[styles.plusVertical, {
      width: size * 0.12,
      height: size * 0.6,
      backgroundColor: color,
    }]} />
  </View>
);

// Home Icon
export const HomeIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.homeRoof, {
      borderLeftWidth: size * 0.4,
      borderRightWidth: size * 0.4,
      borderBottomWidth: size * 0.35,
      borderBottomColor: color,
    }]} />
    <View style={[styles.homeBody, {
      width: size * 0.6,
      height: size * 0.4,
      backgroundColor: color,
      bottom: size * 0.05
    }]} />
    <View style={[styles.homeDoor, {
      width: size * 0.2,
      height: size * 0.25,
      backgroundColor: '#fff',
      bottom: size * 0.05
    }]} />
  </View>
);

// Chart/Statistics Icon
export const ChartIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <View style={[styles.chartContainer, { width: size, height: size }]}>
    <View style={[styles.chartBar, {
      width: size * 0.2,
      height: size * 0.4,
      backgroundColor: color,
      left: size * 0.1,
    }]} />
    <View style={[styles.chartBar, {
      width: size * 0.2,
      height: size * 0.65,
      backgroundColor: color,
      left: size * 0.4,
    }]} />
    <View style={[styles.chartBar, {
      width: size * 0.2,
      height: size * 0.5,
      backgroundColor: color,
      left: size * 0.7,
    }]} />
  </View>
);

// List Icon
export const ListIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <View style={[styles.listContainer, { width: size, height: size }]}>
    <View style={[styles.listLine, { width: size * 0.8, height: 2, backgroundColor: color, top: size * 0.2 }]} />
    <View style={[styles.listLine, { width: size * 0.8, height: 2, backgroundColor: color, top: size * 0.45 }]} />
    <View style={[styles.listLine, { width: size * 0.8, height: 2, backgroundColor: color, top: size * 0.7 }]} />
  </View>
);

// Settings/Gear Icon
export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.settingsOuter, {
      width: size * 0.7,
      height: size * 0.7,
      borderRadius: size * 0.35,
      borderWidth: size * 0.12,
      borderColor: color,
    }]} />
    <View style={[styles.settingsInner, {
      width: size * 0.25,
      height: size * 0.25,
      borderRadius: size * 0.125,
      backgroundColor: color,
    }]} />
  </View>
);

// Calendar Icon
export const CalendarIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.calendarBody, {
      width: size * 0.8,
      height: size * 0.7,
      borderWidth: 2,
      borderColor: color,
      borderRadius: 3,
      bottom: 0
    }]}>
      <View style={[styles.calendarHeader, {
        backgroundColor: color,
        height: size * 0.2,
      }]} />
    </View>
    <View style={[styles.calendarHook, {
      width: 2,
      height: size * 0.15,
      backgroundColor: color,
      left: size * 0.25,
      top: size * 0.05
    }]} />
    <View style={[styles.calendarHook, {
      width: 2,
      height: size * 0.15,
      backgroundColor: color,
      right: size * 0.25,
      top: size * 0.05
    }]} />
  </View>
);

// Wedding/Heart Icon
export const WeddingIcon: React.FC<IconProps> = ({ size = 24, color = '#F472B6' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <Text style={{ fontSize: size * 0.8, color, lineHeight: size }}>
      ♥
    </Text>
  </View>
);

// Funeral/Condolence Icon
export const FuneralIcon: React.FC<IconProps> = ({ size = 24, color = '#60A5FA' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <Text style={{ fontSize: size * 0.8, color, lineHeight: size }}>
      ✟
    </Text>
  </View>
);

// Arrow Up Icon
export const ArrowUpIcon: React.FC<IconProps> = ({ size = 16, color = '#22C55E' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.arrowUp, {
      borderLeftWidth: size * 0.35,
      borderRightWidth: size * 0.35,
      borderBottomWidth: size * 0.5,
      borderBottomColor: color,
    }]} />
  </View>
);

// Bell Icon
export const BellIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.bellBody, {
      width: size * 0.55,
      height: size * 0.5,
      backgroundColor: color,
      borderTopLeftRadius: size * 0.275,
      borderTopRightRadius: size * 0.275,
      top: size * 0.1,
    }]} />
    <View style={[styles.bellBottom, {
      width: size * 0.7,
      height: size * 0.12,
      backgroundColor: color,
      borderRadius: size * 0.06,
      top: size * 0.58,
    }]} />
    <View style={[styles.bellClapper, {
      width: size * 0.15,
      height: size * 0.15,
      backgroundColor: color,
      borderRadius: size * 0.075,
      top: size * 0.72,
    }]} />
  </View>
);

// Chevron Right Icon (>)
export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, color = '#9CA3AF' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.chevronRight, {
      width: size * 0.35,
      height: size * 0.35,
      borderRightWidth: size * 0.1,
      borderBottomWidth: size * 0.1,
      borderColor: color,
    }]} />
  </View>
);

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileHead: {
    position: 'absolute',
  },
  profileBody: {
    position: 'absolute',
  },
  plusHorizontal: {
    position: 'absolute',
    borderRadius: 2,
  },
  plusVertical: {
    position: 'absolute',
    borderRadius: 2,
  },
  homeRoof: {
    position: 'absolute',
    top: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  homeBody: {
    position: 'absolute',
  },
  homeDoor: {
    position: 'absolute',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
  },
  chartBar: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 2,
  },
  listContainer: {
    position: 'relative',
  },
  listLine: {
    position: 'absolute',
    left: '10%',
    borderRadius: 1,
  },
  settingsOuter: {
    position: 'absolute',
  },
  settingsInner: {
    position: 'absolute',
  },
  calendarBody: {
    position: 'absolute',
    overflow: 'hidden',
  },
  calendarHeader: {
    width: '100%',
  },
  calendarHook: {
    position: 'absolute',
  },
  arrowUp: {
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  bellBody: {
    position: 'absolute',
  },
  bellBottom: {
    position: 'absolute',
  },
  bellClapper: {
    position: 'absolute',
  },
  chevronRight: {
    transform: [{ rotate: '-45deg' }],
  },
});
