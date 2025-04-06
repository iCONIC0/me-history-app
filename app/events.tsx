import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { eventsService, Event } from '../services/events';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SafeAreaView } from 'react-native-safe-area-context';

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

// Componente de elemento de evento optimizado con memo
const EventItem = memo(({ item, onPress }: { item: Event; onPress: () => void }) => {
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <TouchableOpacity 
      style={[styles.eventItem, { backgroundColor: '#e7d3c1' }]}
      onPress={onPress}
    >
      <View style={styles.eventInfo}>
        <Text style={[styles.eventTitle, { color: '#202024' }]}>{item.title}</Text>
        <Text style={[styles.eventId, { color: '#202024' }]}>ID: {item.id}</Text>
        {item.description && (
          <Text style={[styles.eventDescription, { color: '#202024' }]}>
            {truncateText(item.description, 100)}
          </Text>
        )}
        <Text style={[styles.eventDate, { color: '#202024' }]}>
          {format(new Date(item.event_date || item.created_at), "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
        </Text>
        <View style={styles.eventMetadata}>
          {item.type === 'time' && (
            <View style={styles.eventBadge}>
              <Ionicons name="time" size={12} color="#e16b5c" />
              <Text style={[styles.eventBadgeText, { color: '#e16b5c' }]}>
                {EVENT_TYPES.find(t => t.id === item.type)?.label || item.type}
              </Text>
            </View>
          )}
          {item.shared_journal && (
            <View style={styles.eventBadge}>
              <Ionicons name="book" size={12} color="#e16b5c" />
              <Text style={[styles.eventBadgeText, { color: '#e16b5c' }]}>
                {item.shared_journal.name}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#202024" />
    </TouchableOpacity>
  );
});

export default function EventsScreen() {
  const { colors } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadEvents = async (page: number = 1, shouldRefresh: boolean = false) => {
    try {
      if (shouldRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      setError(null);
      const response = await eventsService.getEvents(page);
      
      if (shouldRefresh) {
        setEvents(response.data);
      } else {
        setEvents(prev => page === 1 ? response.data : [...prev, ...response.data]);
      }
      setHasMorePages(response.pagination.current_page < response.pagination.last_page);
      setCurrentPage(response.pagination.current_page);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
      setError('No se pudieron cargar los eventos');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents(1);
  }, []);

  const onRefresh = () => {
    loadEvents(1, true);
  };

  const loadMore = () => {
    if (!isLoadingMore && hasMorePages) {
      loadEvents(currentPage + 1);
    }
  };

  const handleEventPress = useCallback((eventId: number) => {
    router.push(`/event/${eventId}`);
  }, []);

  const renderEventItem = useCallback(({ item }: { item: Event }) => {
    return (
      <EventItem 
        item={item} 
        onPress={() => handleEventPress(item.id)} 
      />
    );
  }, [handleEventPress]);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#e16b5c" />
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
        <ActivityIndicator size="large" color="#e16b5c" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
        <Text style={[styles.errorText, { color: '#FF3B30' }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: '#e16b5c' }]}
          onPress={() => loadEvents(1)}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#202024" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#202024' }]}>Todos los Eventos</Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e16b5c']}
            tintColor="#e16b5c"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#202024" />
            <Text style={[styles.emptyStateText, { color: '#202024' }]}>
              No hay eventos
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: '#202024' }]}>
              Registra un evento para comenzar
            </Text>
          </View>
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e7d3c1',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventId: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  eventMetadata: {
    flexDirection: 'row',
    gap: 8,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF40',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  eventBadgeText: {
    fontSize: 12,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
}); 