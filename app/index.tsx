import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Modal } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { eventsService, Event } from '../services/events';
import { journalsService, Journal } from '../services/journals';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [recentJournals, setRecentJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [eventsResponse, journals] = await Promise.all([
        eventsService.getEvents(1, 3),
        journalsService.getJournals(),
      ]);
            
      if (!Array.isArray(journals)) {
        throw new Error('Formato de respuesta inválido');
      }
      
      const sortedJournals = [...journals].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      setEvents(eventsResponse.data);
      setRecentJournals(sortedJournals.slice(0, 3));
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('No se pudieron cargar los datos');
      setEvents([]);
      setRecentJournals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const groupEventsByMonth = (events: Event[]) => {
    const grouped = events.reduce((acc, event) => {
      const date = new Date(event.event_date || event.created_at);
      const key = format(date, 'MMM yyyy', { locale: es });
      
      if (!acc[key]) {
        acc[key] = {
          title: key,
          data: []
        };
      }
      
      acc[key].data.push(event);
      return acc;
    }, {} as Record<string, { title: string; data: Event[] }>);

    return Object.values(grouped);
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const date = new Date(item.event_date || item.created_at);
    const day = format(date, 'dd', { locale: es });
    const month = format(date, 'MMM', { locale: es });

    return (
      <TouchableOpacity 
        style={[styles.eventItem, { backgroundColor: '#e7d3c1' }]}
        onPress={() => router.push(`/event/${item.id}`)}
      >
        <View style={styles.dateContainer}>
          <Text style={styles.dayText}>{day}</Text>
          <Text style={styles.monthText}>{month}</Text>
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={styles.eventDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          <View style={styles.eventMetadata}>
            <View style={styles.metadataRow}>
              {item.type === 'time' && (
                <View style={styles.badge}>
                  <Ionicons name="time" size={12} color="#e16b5c" />
                  <Text style={[styles.badgeText, { color: '#e16b5c' }]}>
                    {EVENT_TYPES.find(t => t.id === item.type)?.label || item.type}
                  </Text>
                </View>
              )}
              {item.category && (
                <View style={styles.badge}>
                  <Ionicons name="pricetag" size={12} color="#6177c2" />
                  <Text style={[styles.badgeText, { color: '#6177c2' }]}>
                    {CATEGORY_LABELS[item.category] || item.category}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.metadataRow}>
              {item.shared_journal && (
                <View style={[styles.badge, styles.journalBadge]}>
                  <Ionicons name="book" size={12} color="#e16b5c" />
                  <Text style={[styles.badgeText, { color: '#e16b5c' }]}>
                    {item.shared_journal.name}
                  </Text>
                </View>
              )}
              {item.user && (
                <View style={[styles.badge, styles.userBadge]}>
                  <Ionicons name="person" size={12} color="#202024" />
                  <Text style={[styles.badgeText, { color: '#202024' }]}>
                    {item.user.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMonthSection = ({ item }: { item: { title: string; data: Event[] } }) => {
    return (
      <View style={styles.monthSection}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>{item.title}</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/events')}
          >
            <Text style={styles.viewAllButtonText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {item.data.map((event) => (
          <View key={event.id} style={styles.eventWrapper}>
            {renderEventItem({ item: event })}
          </View>
        ))}
      </View>
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

  const renderMenuModal = () => (
    <Modal
      visible={showMenu}
      transparent
      animationType="slide"
      onRequestClose={() => setShowMenu(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowMenu(false)}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Opciones</Text>
            <TouchableOpacity onPress={() => setShowMenu(false)}>
              <Ionicons name="close" size={24} color="#202024" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              router.push('/suggested-events');
            }}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="flash" size={24} color="#e16b5c" />
            </View>
            <Text style={styles.menuItemText}>Eventos Sugeridos</Text>
            <Ionicons name="chevron-forward" size={20} color="#202024" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              router.push('/shared-journals');
            }}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="book" size={24} color="#e16b5c" />
            </View>
            <Text style={styles.menuItemText}>Bitácoras</Text>
            <Ionicons name="chevron-forward" size={20} color="#202024" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              router.push('/create-event');
            }}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="add-circle" size={24} color="#e16b5c" />
            </View>
            <Text style={styles.menuItemText}>Crear Evento</Text>
            <Ionicons name="chevron-forward" size={20} color="#202024" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

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

  const groupedEvents = groupEventsByMonth(events);

  return (
    <View style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
      <ScrollView>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: '#202024' }]}>
              Eventos Recientes
            </Text>
          </View>
          
          {groupedEvents?.length > 0 ? (
            <View>
              {groupedEvents.map((monthGroup) => (
                <View key={monthGroup.title} style={styles.monthSection}>
                  <View style={styles.monthHeader}>
                    <Text style={styles.monthTitle}>{monthGroup.title}</Text>
                    <TouchableOpacity
                      style={styles.viewAllButton}
                      onPress={() => router.push('/events')}
                    >
                      <Text style={styles.viewAllButtonText}>Ver todos</Text>
                    </TouchableOpacity>
                  </View>
                  {monthGroup.data.map((event) => (
                    <View key={event.id} style={styles.eventWrapper}>
                      {renderEventItem({ item: event })}
                    </View>
                  ))}
                </View>
              ))}
            </View>
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
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: '#202024' }]}>
              Mis Bitácoras
            </Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/shared-journals')}
            >
              <Text style={styles.viewAllButtonText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {recentJournals.length > 0 ? (
            <View>
              {recentJournals.map((journal) => (
                <View key={journal.id} style={styles.journalWrapper}>
                  {renderJournalItem({ item: journal })}
                </View>
              ))}
            </View>
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
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowMenu(true)}
      >
        <Ionicons name="menu" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {renderMenuModal()}
    </View>
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
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    opacity: 0.8,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202024',
    textTransform: 'capitalize',
  },
  viewAllButton: {
    backgroundColor: '#e16b5c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewAllButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  eventWrapper: {
    marginBottom: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  dateContainer: {
    alignItems: 'center',
    marginRight: 16,
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
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
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
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e16b5c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#f7f5f2',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e7d3c1',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#202024',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e7d3c1',
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
    flex: 1,
    fontSize: 16,
    color: '#202024',
  },
  journalItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  journalInfo: {
    flex: 1,
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  journalDate: {
    fontSize: 12,
    opacity: 0.8,
  },
  journalWrapper: {
    marginBottom: 8,
  },
}); 