import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'daily_reminder',
      title: 'Recordatorio Diario',
      description: 'Recibe un recordatorio diario para registrar tus momentos',
      enabled: true,
    },
    {
      id: 'journal_updates',
      title: 'Actualizaciones de Bitácoras',
      description: 'Notificaciones cuando alguien actualiza una bitácora compartida',
      enabled: true,
    },
    {
      id: 'suggested_events',
      title: 'Registros Sugeridos',
      description: 'Recordatorios para Registros sugeridos programados',
      enabled: true,
    },
    {
      id: 'achievements',
      title: 'Logros',
      description: 'Notificaciones cuando desbloqueas nuevos logros',
      enabled: true,
    },
  ]);

  const handleToggle = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#202024" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#202024' }]}>
          Notificaciones
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
}); 