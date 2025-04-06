import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { router } from 'expo-router';
import { usersService, User } from '../services/users';
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
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await usersService.logout();
              logout();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Editar Perfil',
      onPress: () => setIsEditing(!isEditing),
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
      onPress: () => router.push('/profile/about'),
    },
    {
      icon: 'log-out-outline',
      title: 'Cerrar Sesión',
      onPress: handleLogout,
      color: '#e16b5c',
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e16b5c" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
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
              style={styles.editImageButton}
              onPress={handleImagePick}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.name}>
            {profile?.name || 'Usuario'}
          </Text>
          <Text style={styles.email}>
            {profile?.email || 'usuario@ejemplo.com'}
          </Text>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Tu nombre"
                placeholderTextColor="#20202480"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Tu email"
                placeholderTextColor="#20202480"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña actual</Text>
              <TextInput
                style={styles.input}
                value={formData.current_password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, current_password: text }))}
                placeholder="Tu contraseña actual"
                placeholderTextColor="#20202480"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nueva contraseña</Text>
              <TextInput
                style={styles.input}
                value={formData.new_password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, new_password: text }))}
                placeholder="Nueva contraseña"
                placeholderTextColor="#20202480"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar nueva contraseña</Text>
              <TextInput
                style={styles.input}
                value={formData.new_password_confirmation}
                onChangeText={(text) => setFormData(prev => ({ ...prev, new_password_confirmation: text }))}
                placeholder="Confirmar nueva contraseña"
                placeholderTextColor="#20202480"
                secureTextEntry
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconContainer, item.color && { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={24} color={item.color || '#6177c2'} />
                  </View>
                  <Text style={[styles.menuItemText, item.color && { color: item.color }]}>
                    {item.title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#202024" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5f2',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e7d3c1',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e16b5c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202024',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#202024',
    opacity: 0.7,
  },
  editForm: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#202024',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e7d3c1',
    backgroundColor: '#e7d3c1',
    color: '#202024',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#6177c2',
  },
  saveButton: {
    backgroundColor: '#e16b5c',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#202024',
  },
}); 