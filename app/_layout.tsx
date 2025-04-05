import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@react-navigation/native';
import { lightTheme, darkTheme } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <ThemeProvider value={theme}>
      <Slot />
    </ThemeProvider>
  );
} 