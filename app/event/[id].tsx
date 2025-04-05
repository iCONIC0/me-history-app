import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';
import { eventsService, Event } from '../../services/events';
import { Ionicons } from '@expo/vector-icons';

export default function EventDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      const data = await eventsService.getEvent(parseInt(id));
      if (!data) {
        throw new Error('Evento no encontrado');
      }
      setEvent(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar el evento');
      console.error('Error loading event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: '#FF3B30' }]}>
          {error || 'Evento no encontrado'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadEvent}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {event.title}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.eventInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {new Date(event.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          {event.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {event.location}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {event.type} - {event.category}
            </Text>
          </View>
        </View>

        {event.description && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionTitle, { color: colors.text }]}>
              Descripción
            </Text>
            <Text style={[styles.description, { color: colors.text }]}>
              {event.description}
            </Text>
          </View>
        )}

        {event.media && event.media.length > 0 && (
          <View style={styles.mediaContainer}>
            <Text style={[styles.mediaTitle, { color: colors.text }]}>
              Multimedia
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {event.media.map((media) => (
                <Image
                  key={media.id}
                  source={{ uri: media.file_path }}
                  style={styles.mediaImage}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  eventInfo: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  mediaContainer: {
    marginBottom: 24,
  },
  mediaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginRight: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
}); 