import { useColorScheme } from 'react-native';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    primary: '#007AFF',
    background: isDark ? '#000000' : '#FFFFFF',
    card: isDark ? '#1C1C1E' : '#F2F2F7',
    text: isDark ? '#FFFFFF' : '#000000',
    border: isDark ? '#38383A' : '#C6C6C8',
    notification: isDark ? '#FF453A' : '#FF3B30',
    error: '#FF3B30',
  };

  return {
    colors,
    isDark,
  };
}; 