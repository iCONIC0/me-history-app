import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useColorScheme, View, TouchableOpacity, StyleSheet, Text, StatusBar, Platform } from 'react-native';
import { ThemeProvider } from '@react-navigation/native';
import { lightTheme, darkTheme } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [showHeader, setShowHeader] = useState(true);
  const [showBackButton, setShowBackButton] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, segments, isLoading]);

  // Efecto para controlar la visibilidad del header según la ruta actual
  useEffect(() => {
    const currentPath = segments.join('/');
    console.log('currentPath', currentPath);
    // Ocultar header en estas rutas
    if (currentPath === 'create-event') {
      setShowHeader(false);
      setShowBackButton(false);
    } else if (currentPath === 'profile') {
      setShowHeader(false);
      setShowBackButton(true);
    } else if (currentPath.startsWith('profile/')) {
      setShowHeader(false);
      setShowBackButton(false);
    } else {
      setShowHeader(true);
      setShowBackButton(false);
    }
  }, [segments]);

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <ThemeProvider value={theme}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f7f5f2" />
        {showHeader && (
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerGreeting}>
                  ¡Hola, {user?.name || 'Usuario'}!
                </Text>
                <Text style={styles.headerDate}>
                  {getCurrentDate()}
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/create-event')}
                >
                  <Ionicons name="add-circle-outline" size={28} color="#6177c2" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={() => router.push('/profile')}
                >
                  <Ionicons name="person-circle-outline" size={28} color="#6177c2" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        {showBackButton && (
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <Ionicons name="arrow-back" size={24} color="#6177c2" />
            </TouchableOpacity>
          </View>
        )}
        <Slot />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5f2',
  },
  header: {
    backgroundColor: '#f7f5f2',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e7d3c1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202024',
    marginBottom: 2,
  },
  headerDate: {
    fontSize: 14,
    color: '#202024',
    opacity: 0.8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 8,
  },
  profileButton: {
    padding: 8,
  },
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
}); 