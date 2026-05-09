import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Svg, { Path, Rect, Ellipse } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// Profile/User Icon (PNG)
export const ProfileIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Image
    source={require('../../assets/profile-icon.png')}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

// Plus Icon
export const PlusIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.plusHorizontal, {
      width: size * 0.6, height: size * 0.12, backgroundColor: color,
    }]} />
    <View style={[styles.plusVertical, {
      width: size * 0.12, height: size * 0.6, backgroundColor: color,
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
      width: size * 0.2, height: size * 0.4, backgroundColor: color, left: size * 0.1,
    }]} />
    <View style={[styles.chartBar, {
      width: size * 0.2, height: size * 0.65, backgroundColor: color, left: size * 0.4,
    }]} />
    <View style={[styles.chartBar, {
      width: size * 0.2, height: size * 0.5, backgroundColor: color, left: size * 0.7,
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
      width: 2, height: size * 0.15, backgroundColor: color,
      left: size * 0.25, top: size * 0.05
    }]} />
    <View style={[styles.calendarHook, {
      width: 2, height: size * 0.15, backgroundColor: color,
      right: size * 0.25, top: size * 0.05
    }]} />
  </View>
);

// Wedding Icon (PNG)
export const WeddingIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Image
    source={require('../../assets/wedding-icon.png')}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

// Funeral Icon (PNG)
export const FuneralIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Image
    source={require('../../assets/funeral-icon.png')}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

// Birth Icon (PNG)
export const BirthIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Image
    source={require('../../assets/birth-icon.png')}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

// Birthday Icon (PNG)
export const BirthdayIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Image
    source={require('../../assets/birthday-icon.png')}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

// First Birthday Icon (PNG)
export const FirstBirthdayIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Image
    source={require('../../assets/firstBirthday-icon.png')}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

// Other/Etc Icon (PNG)
export const OtherIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Image
    source={require('../../assets/etc-icon.png')}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
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

// Bell Icon (PNG)
interface BellIconProps extends IconProps {
  hasNotification?: boolean;
}
export const BellIcon: React.FC<BellIconProps> = ({ size = 24, hasNotification = false }) => (
  <Image
    source={
      hasNotification
        ? require('../../assets/bell-on-icon.png')
        : require('../../assets/bell-off-icon.png')
    }
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

// Bell Icon Colored (SVG) - for settings menu
export const BellIconColored: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M11 4C11 2.5 13 2.5 13 4" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    <Path d="M12 4.5C7.5 4.5 4 8.5 4 14V16.5H20V14C20 8.5 16.5 4.5 12 4.5Z" fill={color} />
    <Rect x={2.5} y={16.5} width={19} height={2} rx={1} fill={color} />
    <Ellipse cx={12} cy={21} rx={2.2} ry={1.8} fill={color} />
  </Svg>
);

// Search Icon (SVG) - magnifying glass with theme color support
export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M10 4C6.68629 4 4 6.68629 4 10C4 13.3137 6.68629 16 10 16C13.3137 16 16 13.3137 16 10C16 6.68629 13.3137 4 10 4Z"
      stroke={color}
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M14.5 14.5L20 20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// Phone Icon (SVG) - phone with theme color support
export const PhoneIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M5 4H9L11 9L8.5 10.5C9.57096 12.6715 11.3285 14.429 13.5 15.5L15 13L20 15V19C20 19.5304 19.7893 20.0391 19.4142 20.4142C19.0391 20.7893 18.5304 21 18 21C14.0993 20.763 10.4202 19.1065 7.65683 16.3432C4.8935 13.5798 3.23705 9.90074 3 6C3 5.46957 3.21071 4.96086 3.58579 4.58579C3.96086 4.21071 4.46957 4 5 4Z"
      stroke={color}
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Schedule List Icon — calendar with list lines
export const ScheduleListIcon: React.FC<IconProps> = ({ size = 24, color = '#6B7280' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={{
      position: 'absolute',
      width: size * 0.78,
      height: size * 0.68,
      borderWidth: Math.max(1.5, size * 0.08),
      borderColor: color,
      borderRadius: size * 0.09,
      bottom: size * 0.02,
      overflow: 'hidden',
    }}>
      <View style={{ backgroundColor: color, height: size * 0.21, width: '100%' }} />
      <View style={{
        position: 'absolute',
        width: '64%',
        height: Math.max(1.5, size * 0.08),
        backgroundColor: color,
        borderRadius: 1,
        top: size * 0.28,
        left: '13%',
      }} />
      <View style={{
        position: 'absolute',
        width: '46%',
        height: Math.max(1.5, size * 0.08),
        backgroundColor: color,
        borderRadius: 1,
        top: size * 0.43,
        left: '13%',
      }} />
    </View>
    <View style={{
      position: 'absolute',
      width: size * 0.08,
      height: size * 0.16,
      backgroundColor: color,
      borderRadius: 1,
      left: size * 0.23,
      top: size * 0.03,
    }} />
    <View style={{
      position: 'absolute',
      width: size * 0.08,
      height: size * 0.16,
      backgroundColor: color,
      borderRadius: 1,
      right: size * 0.23,
      top: size * 0.03,
    }} />
  </View>
);

// Chevron Left Icon (<)
export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 24, color = '#9CA3AF' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.chevronLeft, {
      width: size * 0.35,
      height: size * 0.35,
      borderLeftWidth: size * 0.1,
      borderBottomWidth: size * 0.1,
      borderColor: color,
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
  chevronLeft: {
    transform: [{ rotate: '45deg' }],
  },
  chevronRight: {
    transform: [{ rotate: '-45deg' }],
  },
});
