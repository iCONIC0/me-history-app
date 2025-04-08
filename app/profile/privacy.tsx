import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'profile_visibility',
      title: 'Perfil Público',
      description: 'Permite que otros usuarios vean tu perfil y actividad',
      enabled: false,
    },
    {
      id: 'journal_sharing',
      title: 'Compartir Bitácoras',
      description: 'Permite que otros usuarios te inviten a sus bitácoras',
      enabled: true,
    },
    {
      id: 'activity_feed',
      title: 'Feed de Actividad',
      description: 'Muestra tu actividad en el feed de tus amigos',
      enabled: true,
    },
    {
      id: 'location_sharing',
      title: 'Compartir Ubicación',
      description: 'Incluye la ubicación en tus Registros y momentos',
      enabled: false,
    },
  ]);

  const handleToggle = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // TODO: Implementar eliminación de cuenta
            console.log('Eliminar cuenta');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons name="arrow-back" size={24} color="#202024" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#202024' }]}>
          Privacidad
        </Text>
      </View>

      <View style={styles.content}>
        {settings.map((setting) => (
          <View
            key={setting.id}
            style={[styles.settingItem, { borderBottomColor: '#e7d3c1' }]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: '#202024' }]}>
                {setting.title}
              </Text>
              <Text style={[styles.settingDescription, { color: '#202024' }]}>
                {setting.description}
              </Text>
            </View>
            <Switch
              value={setting.enabled}
              onValueChange={() => handleToggle(setting.id)}
              trackColor={{ false: '#e7d3c1', true: '#e16b5c' }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: '#FF3B30' }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          <Text style={[styles.deleteButtonText, { color: '#FF3B30' }]}>
            Eliminar Cuenta
          </Text>
        </TouchableOpacity>
      </View>
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
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 