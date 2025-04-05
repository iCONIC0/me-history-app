import { DarkTheme, DefaultTheme } from '@react-navigation/native';

export type CustomTheme = typeof lightTheme;

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    card: '#F2F2F7',
    text: '#000000',
    border: '#C6C6C8',
    notification: '#FF3B30',
  },
} as const;

export const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    border: '#38383A',
    notification: '#FF453A',
  },
} as const; 