import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, SafeAreaView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface HelpItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
}

export default function HelpScreen() {
  const { colors } = useTheme();

  const helpItems: HelpItem[] = [
    {
      id: 'faq',
      title: 'Preguntas Frecuentes',
      description: 'Encuentra respuestas a las preguntas más comunes',
      icon: 'help-circle-outline',
      action: () => {
        // TODO: Implementar navegación a FAQ
        console.log('Ir a FAQ');
      },
    },
    {
      id: 'contact',
      title: 'Contactar Soporte',
      description: 'Envía un correo al equipo de soporte',
      icon: 'mail-outline',
      action: () => {
        Linking.openURL('mailto:soporte@mehistory.com');
      },
    },
    {
      id: 'feedback',
      title: 'Enviar Comentarios',
      description: 'Ayúdanos a mejorar la aplicación',
      icon: 'chatbubble-outline',
      action: () => {
        // TODO: Implementar formulario de feedback
        console.log('Enviar feedback');
      },
    },
    {
      id: 'terms',
      title: 'Términos y Condiciones',
      description: 'Lee nuestros términos de servicio',
      icon: 'document-text-outline',
      action: () => {
        // TODO: Implementar navegación a términos
        console.log('Ir a términos');
      },
    },
    {
      id: 'privacy',
      title: 'Política de Privacidad',
      description: 'Conoce cómo manejamos tus datos',
      icon: 'shield-outline',
      action: () => {
        // TODO: Implementar navegación a privacidad
        console.log('Ir a privacidad');
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Ayuda y Soporte
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {helpItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.helpItem, { borderBottomColor: colors.border }]}
            onPress={item.action}
          >
            <View style={styles.helpItemContent}>
              <Ionicons name={item.icon} size={24} color={colors.text} />
              <View style={styles.helpItemInfo}>
                <Text style={[styles.helpItemTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.helpItemDescription, { color: colors.text }]}>
                  {item.description}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        ))}

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.text }]}>
            Versión 1.0.0
          </Text>
        </View>
      </ScrollView>
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
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  helpItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 16,
  },
  helpItemInfo: {
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  helpItemDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    opacity: 0.5,
  },
}); 