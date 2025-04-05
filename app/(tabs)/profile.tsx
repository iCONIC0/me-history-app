import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { router } from 'expo-router';
import { usersService, User } from '../../services/users';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
      const userProfile = await usersService.getProfile();
      setProfile(userProfile);
      setFormData(prev => ({
        ...prev,
        name: userProfile.name,
        email: userProfile.email,
      }));
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('avatar', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        const updatedUser = await usersService.updateProfile({ avatar: formData as any });
        setProfile(updatedUser);
        Alert.alert('Éxito', 'Imagen de perfil actualizada');
      }
    } catch (error) {
      console.error('Error al actualizar avatar:', error);
      Alert.alert('Error', 'No se pudo actualizar la imagen de perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    try {
      setIsLoading(true);
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.current_password && formData.new_password) {
        if (formData.new_password !== formData.new_password_confirmation) {
          Alert.alert('Error', 'Las contraseñas no coinciden');
          return;
        }
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
        updateData.new_password_confirmation = formData.new_password_confirmation;
      }

      const updatedUser = await usersService.updateProfile(updateData);
      setProfile(updatedUser);
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await usersService.logout();
      logout();
      router.replace('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Editar Perfil',
      onPress: () => router.push('/profile/edit'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notificaciones',
      onPress: () => router.push('/profile/notifications'),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Privacidad',
      onPress: () => router.push('/profile/privacy'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Ayuda y Soporte',
      onPress: () => router.push('/profile/help'),
    },
    {
      icon: 'information-circle-outline',
      title: 'Acerca de',
      onPress: () => console.log('Acerca de'),
    },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/100' }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={[styles.editImageButton, { backgroundColor: colors.primary }]}
              onPress={handleImagePick}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.name, { color: colors.text }]}>
            {profile?.name || 'Usuario'}
          </Text>
          <Text style={[styles.email, { color: colors.text }]}>
            {profile?.email || 'usuario@ejemplo.com'}
          </Text>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                value={formData.name}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Tu nombre"
                placeholderTextColor={colors.text}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                value={formData.email}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Tu email"
                placeholderTextColor={colors.text}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Contraseña actual</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                value={formData.current_password}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, current_password: text }))}
                placeholder="Tu contraseña actual"
                placeholderTextColor={colors.text}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nueva contraseña</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                value={formData.new_password}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, new_password: text }))}
                placeholder="Nueva contraseña"
                placeholderTextColor={colors.text}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Confirmar nueva contraseña</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                value={formData.new_password_confirmation}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, new_password_confirmation: text }))}
                placeholder="Confirmar nueva contraseña"
                placeholderTextColor={colors.text}
                secureTextEntry
              />
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.buttonText}>Guardar cambios</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.card }]}
                onPress={() => {
                  setIsEditing(false);
                  loadProfile();
                }}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemContent}>
                  <Ionicons name={item.icon as any} size={24} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    {item.title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.text} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.primary }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
  },
  editForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 