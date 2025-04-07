import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Event } from '../services/events';

// Tipos de eventos disponibles
const EVENT_TYPES = [
  { id: 'text', icon: 'text', label: 'Texto' },
  { id: 'image', icon: 'image', label: 'Imagen' },
  { id: 'audio', icon: 'mic', label: 'Audio' },
  { id: 'video', icon: 'videocam', label: 'Video' },
  { id: 'mixed', icon: 'albums', label: 'Mixto' },
  { id: 'time', icon: 'time', label: 'Tiempo' },
];

// Mapeo de categorías en español
const CATEGORY_LABELS: Record<string, string> = {
  'life-diary': 'Diario de Vida',
  'health': 'Salud',
  'work': 'Trabajo',
  'study': 'Estudio',
  'social': 'Social',
  'hobby': 'Pasatiempos',
  'travel': 'Viajes',
  'food': 'Comida',
  'sports': 'Deportes',
  'entertainment': 'Entretenimiento',
  'other': 'Otros',
  'fitness': 'Fitness',
  'meditation': 'Meditación',
  'reading': 'Lectura',
  'writing': 'Escritura',
  'art': 'Arte',
  'music': 'Música',
  'family': 'Familia',
  'friends': 'Amigos',
  'dating': 'Citas',
  'eat': 'Comida',
};

interface EventCardProps {
  event: Event;
  onPress: (eventId: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const date = new Date(event.event_date || event.created_at);
  const day = format(date, 'dd', { locale: es });
  const month = format(date, 'MMM', { locale: es });

  return (
    <TouchableOpacity 
      style={[styles.eventItem, { backgroundColor: '#ffffff' }]}
      onPress={() => onPress(event.id)}
    >
      <View style={styles.dateContainer}>
        <Text style={styles.dayText}>{day}</Text>
        <Text style={styles.monthText}>{month}</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>
        {event.description && (
          <Text style={styles.eventDescription} numberOfLines={1}>
            {event.description}
          </Text>
        )}
        <View style={styles.eventMetadata}>
          <View style={styles.metadataRow}>
            {event.type === 'time' && (
              <View style={styles.badge}>
                <Ionicons name="time" size={12} color="#e16b5c" />
                <Text style={[styles.badgeText, { color: '#e16b5c' }]}>
                  {EVENT_TYPES.find(t => t.id === event.type)?.label || event.type}
                </Text>
              </View>
            )}
            {event.category && (
              <View style={styles.badge}>
                <Ionicons name="pricetag" size={12} color="#6177c2" />
                <Text style={[styles.badgeText, { color: '#6177c2' }]}>
                  {CATEGORY_LABELS[event.category] || event.category}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.metadataRow}>
            {event.shared_journal && (
              <View style={[styles.badge, styles.journalBadge]}>
                <Ionicons name="book" size={12} color="#e16b5c" />
                <Text style={[styles.badgeText, { color: '#e16b5c' }]}>
                  {event.shared_journal.name}
                </Text>
              </View>
            )}
            {event.user && (
              <View style={[styles.badge, styles.userBadge]}>
                <Ionicons name="person" size={12} color="#202024" />
                <Text style={[styles.badgeText, { color: '#202024' }]}>
                  {event.user.name}
                </Text>
              </View>
            )}
            {event.media && event.media.length > 0 && (
              <View style={[styles.badge, styles.mediaBadge]}>
                <Ionicons name="albums" size={12} color="#6177c2" />
                <Text style={[styles.badgeText, { color: '#6177c2' }]}>
                  Multimedia
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  dateContainer: {
    alignItems: 'center',
    marginRight: 16,
    paddingRight: 16,
  },
  dayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202024',
  },
  monthText: {
    fontSize: 16,
    color: '#202024',
    textTransform: 'uppercase',
  },
  separator: {
    width: 1,
    backgroundColor: '#202024',
    opacity: 0.2,
    marginRight: 16,
    height: '100%',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202024',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#202024',
    opacity: 0.7,
    marginBottom: 8,
  },
  eventMetadata: {
    gap: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  journalBadge: {
    backgroundColor: '#FFE4E1',
  },
  userBadge: {
    backgroundColor: '#F5F5F5',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mediaBadge: {
    backgroundColor: '#E8EEFF',
  },
}); 