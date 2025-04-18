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

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.password_confirmation) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setLoading(true);
      const response = await usersService.register(formData);
      await login(response.access_token, response.user);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.log(error);
      Alert.alert(
        'Error de registro',
        error.response?.data?.message || 'No se pudo completar el registro. Por favor intenta de nuevo.'
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
        <Text style={[styles.title, { color: '#202024' }]}>Crear cuenta</Text>
        <Text style={[styles.subtitle, { color: '#202024' }]}>
          Regístrate para comenzar a crear tus recuerdos
        </Text>

        <View style={styles.form}>
          <View style={[styles.inputContainer, { borderColor: '#e7d3c1' }]}>
            <Ionicons name="person-outline" size={20} color="#202024" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: '#202024' }]}
              placeholder="Nombre completo"
              placeholderTextColor="#20202480"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={[styles.inputContainer, { borderColor: '#e7d3c1' }]}>
            <Ionicons name="mail-outline" size={20} color="#202024" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: '#202024' }]}
              placeholder="Correo electrónico"
              placeholderTextColor="#20202480"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
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
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
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

          <View style={[styles.inputContainer, { borderColor: '#e7d3c1' }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#202024" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: '#202024' }]}
              placeholder="Confirmar contraseña"
              placeholderTextColor="#20202480"
              value={formData.password_confirmation}
              onChangeText={(text) => setFormData({ ...formData, password_confirmation: text })}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#202024"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#e16b5c' }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: '#202024' }]}>
              ¿Ya tienes una cuenta?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={[styles.loginLink, { color: '#e16b5c' }]}>
                  Inicia sesión
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 