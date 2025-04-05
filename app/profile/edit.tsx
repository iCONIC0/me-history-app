import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { usersService } from '../../services/users';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await usersService.getProfile();
      setName(profile.name || '');
      setEmail(profile.email || '');
      setAvatar(profile.avatar_url || '');
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    try {
      setIsLoading(true);
      const updateData: any = {
        name: name.trim(),
        email: email.trim(),
      };

      if (showPasswordFields) {
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.new_password_confirmation) {
          Alert.alert('Error', 'Por favor completa todos los campos de contraseña');
          return;
        }
        if (passwordData.new_password !== passwordData.new_password_confirmation) {
          Alert.alert('Error', 'Las contraseñas no coinciden');
          return;
        }
        updateData.current_password = passwordData.current_password;
        updateData.new_password = passwordData.new_password;
        updateData.new_password_confirmation = passwordData.new_password_confirmation;
      }

      await usersService.updateProfile(updateData);
      router.push('/(tabs)/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text }]}>
                Editar Perfil
              </Text>
            </View>

            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: avatar || 'https://via.placeholder.com/100' }}
                  style={styles.avatar}
                />
                <TouchableOpacity
                  style={[styles.changeAvatarButton, { backgroundColor: colors.primary }]}
                  onPress={handlePickImage}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Tu nombre"
                    placeholderTextColor={colors.text + '80'}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    placeholderTextColor={colors.text + '80'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.passwordButton, { borderColor: colors.border }]}
                  onPress={() => setShowPasswordFields(!showPasswordFields)}
                >
                  <Text style={[styles.passwordButtonText, { color: colors.text }]}>
                    {showPasswordFields ? 'Ocultar cambio de contraseña' : 'Cambiar contraseña'}
                  </Text>
                </TouchableOpacity>

                {showPasswordFields && (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { color: colors.text }]}>Contraseña actual</Text>
                      <TextInput
                        style={[styles.input, { 
                          backgroundColor: colors.card,
                          color: colors.text,
                          borderColor: colors.border,
                        }]}
                        value={passwordData.current_password}
                        onChangeText={(text) => setPasswordData(prev => ({ ...prev, current_password: text }))}
                        placeholder="Tu contraseña actual"
                        placeholderTextColor={colors.text + '80'}
                        secureTextEntry
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { color: colors.text }]}>Nueva contraseña</Text>
                      <TextInput
                        style={[styles.input, { 
                          backgroundColor: colors.card,
                          color: colors.text,
                          borderColor: colors.border,
                        }]}
                        value={passwordData.new_password}
                        onChangeText={(text) => setPasswordData(prev => ({ ...prev, new_password: text }))}
                        placeholder="Nueva contraseña"
                        placeholderTextColor={colors.text + '80'}
                        secureTextEntry
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { color: colors.text }]}>Confirmar nueva contraseña</Text>
                      <TextInput
                        style={[styles.input, { 
                          backgroundColor: colors.card,
                          color: colors.text,
                          borderColor: colors.border,
                        }]}
                        value={passwordData.new_password_confirmation}
                        onChangeText={(text) => setPasswordData(prev => ({ ...prev, new_password_confirmation: text }))}
                        placeholder="Confirmar nueva contraseña"
                        placeholderTextColor={colors.text + '80'}
                        secureTextEntry
                      />
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  changeAvatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  passwordButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  passwordButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 