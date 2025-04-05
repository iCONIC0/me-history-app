import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { usersService } from '../../services/users';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      const response = await usersService.login({ email, password });
      await login(response.access_token, response.user);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.log(error);
      Alert.alert(
        'Error de inicio de sesión',
        error.response?.data?.message || 'No se pudo iniciar sesión. Por favor intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: '#f7f5f2' }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: '#202024' }]}>¡Bienvenido de nuevo!</Text>
        <Text style={[styles.subtitle, { color: '#202024' }]}>
          Inicia sesión para continuar
        </Text>

        <View style={styles.form}>
          <View style={[styles.inputContainer, { borderColor: '#e7d3c1' }]}>
            <Ionicons name="mail-outline" size={20} color="#202024" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: '#202024' }]}
              placeholder="Correo electrónico"
              placeholderTextColor="#20202480"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={[styles.inputContainer, { borderColor: '#e7d3c1' }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#202024" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: '#202024' }]}
              placeholder="Contraseña"
              placeholderTextColor="#20202480"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#202024"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.forgotPassword, { opacity: loading ? 0.5 : 1 }]}
            onPress={() => router.push('/forgot-password' as any)}
            disabled={loading}
          >
            <Text style={[styles.forgotPasswordText, { color: '#e16b5c' }]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#e16b5c' }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: '#202024' }]}>
              ¿No tienes una cuenta?{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={[styles.registerLink, { color: '#e16b5c' }]}>
                  Regístrate
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 