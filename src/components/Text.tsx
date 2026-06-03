import React from 'react';
import { Text as RNText, TextProps, StyleSheet, Platform } from 'react-native';

const FONT_ADJUST = Platform.OS === 'android' ? -2 : 2;

export const Text: React.FC<TextProps> = ({ style, ...props }) => {
  const flat = StyleSheet.flatten(style);
  const adjusted =
    flat?.fontSize != null
      ? [style, { fontSize: flat.fontSize + FONT_ADJUST }]
      : style;
  return <RNText style={adjusted} {...props} />;
};
