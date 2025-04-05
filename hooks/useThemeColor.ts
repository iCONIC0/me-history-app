/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';

export type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}

const tintColorLight = '#e16b5c';
const tintColorDark = '#e16b5c';

export const Colors = {
  light: {
    text: '#202024',
    textSecondary: '#6177c2',
    background: '#f7f5f2',
    backgroundAlt: '#e7d3c1',
    tint: tintColorLight,
    tabIconDefault: '#6177c2',
    tabIconSelected: tintColorLight,
    primary: '#e16b5c',
    secondary: '#6177c2',
    success: '#7ec4aa',
    error: '#e16b5c',
    border: '#e7d3c1',
  },
  dark: {
    text: '#f7f5f2',
    textSecondary: '#6177c2',
    background: '#202024',
    backgroundAlt: '#2a2a2e',
    tint: tintColorDark,
    tabIconDefault: '#6177c2',
    tabIconSelected: tintColorDark,
    primary: '#e16b5c',
    secondary: '#6177c2',
    success: '#7ec4aa',
    error: '#e16b5c',
    border: '#2a2a2e',
  },
} as const;
