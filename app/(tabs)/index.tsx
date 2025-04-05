import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { eventsService, Event } from '../../services/events';
import { journalsService, Journal } from '../../services/journals';
import { useAuth } from '../../hooks/useAuth';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentJournals, setRecentJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [events, journals] = await Promise.all([
        eventsService.getEvents(),
        journalsService.getJournals(),
      ]);
            
      // Asegurarnos de que events y journals son arrays
      if (!Array.isArray(events) || !Array.isArray(journals)) {
        throw new Error('Formato de respuesta inválido');
      }
      
      // Ordenar por fecha de creación (más reciente primero)
      const sortedEvents = [...events].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const sortedJournals = [...journals].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      setRecentEvents(sortedEvents.slice(0, 5));
      setRecentJournals(sortedJournals.slice(0, 3));
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('No se pudieron cargar los datos');
      setRecentEvents([]);
      setRecentJournals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    return (
      <TouchableOpacity 
        style={[styles.eventItem, { backgroundColor: '#e7d3c1' }]}
        onPress={() => router.push(`/event/${item.id}`)}
      >
        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { color: '#202024' }]}>{item.title}</Text>
          <Text style={[styles.eventDate, { color: '#202024' }]}>
            {new Date(item.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#202024" />
      </TouchableOpacity>
    );
  };

  const renderJournalItem = ({ item }: { item: Journal }) => {
    return (
      <TouchableOpacity 
        style={[styles.journalItem, { backgroundColor: '#e7d3c1' }]}
        onPress={() => router.push(`/journal/${item.id}`)}
      >
        <View style={styles.journalInfo}>
          <Text style={[styles.journalTitle, { color: '#202024' }]}>{item.name}</Text>
          <Text style={[styles.journalDate, { color: '#202024' }]}>
            {new Date(item.updated_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#202024" />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
        <ActivityIndicator size="large" color="#e16b5c" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
        <Text style={[styles.errorText, { color: '#FF3B30' }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: '#e16b5c' }]}
          onPress={loadData}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: '#202024' }]}>
          ¡Hola, {user?.name || 'Usuario'}!
        </Text>
        <Text style={[styles.date, { color: '#202024' }]}>
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#e16b5c' }]}
          onPress={() => router.push('/suggested-events')}
        >
          <Ionicons name="flash" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Eventos Sugeridos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#e16b5c' }]}
          onPress={() => router.push('/shared-journals')}
        >
          <Ionicons name="book" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Bitácoras</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addEventButtonContainer}>
        <TouchableOpacity
          style={[styles.addEventButton, { backgroundColor: '#e16b5c' }]}
          onPress={() => router.push('/create-event')}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addEventButtonText}>Agregar Evento</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#202024' }]}>
          Eventos Recientes
        </Text>
        
        {recentEvents.length > 0 ? (
          <FlatList
            data={recentEvents}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#202024" />
            <Text style={[styles.emptyStateText, { color: '#202024' }]}>
              No hay eventos recientes
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: '#202024' }]}>
              Registra un evento para comenzar
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: '#e16b5c' }]}
          onPress={() => router.push('/events')}
        >
          <Text style={styles.viewAllButtonText}>Ver todos los eventos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#202024' }]}>
          Mis Bitácoras
        </Text>
        
        {recentJournals.length > 0 ? (
          <FlatList
            data={recentJournals}
            renderItem={renderJournalItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#202024" />
            <Text style={[styles.emptyStateText, { color: '#202024' }]}>
              No tienes bitácoras
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: '#202024' }]}>
              Crea una bitácora para comenzar
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: '#e16b5c' }]}
          onPress={() => router.push('/shared-journals')}
        >
          <Text style={styles.viewAllButtonText}>Ver todas las bitácoras</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    opacity: 0.7,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    width: '45%',
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  addEventButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  addEventButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
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
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  journalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  journalInfo: {
    flex: 1,
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  journalDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  viewAllButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  viewAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
