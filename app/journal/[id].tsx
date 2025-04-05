import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';
import { journalsService } from '../../services/journals';
import { Ionicons } from '@expo/vector-icons';
import type { Journal, User } from '../../services/journals';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JournalDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJournal();
  }, [id]);

  const loadJournal = async () => {
    try {
      setIsLoading(true);
      const data = await journalsService.getJournal(parseInt(id));
      setJournal(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar la bitácora');
      console.error('Error loading journal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !journal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error || 'Bitácora no encontrada'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadJournal}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {journal.name}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.text }]}>
            {journal.description || 'Sin descripción'}
          </Text>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="people" size={20} color={colors.text} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {journal.users.length} {journal.users.length === 1 ? 'miembro' : 'miembros'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color={colors.text} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Última actualización: {new Date(journal.updated_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="person" size={20} color={colors.text} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Propietario: {journal.owner.name}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="lock-closed" size={20} color={colors.text} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {journal.is_public ? 'Pública' : 'Privada'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="key" size={20} color={colors.text} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Código de invitación: {journal.invitation_code}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Miembros
            </Text>
            {journal.users.map((user: User) => (
              <View key={user.id} style={[styles.memberItem, { backgroundColor: colors.card }]}>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.text }]}>
                    {user.name}
                  </Text>
                  <Text style={[styles.memberEmail, { color: colors.text }]}>
                    {user.email}
                  </Text>
                </View>
                {user.pivot && (
                  <Text style={[styles.memberRole, { color: colors.text }]}>
                    {user.pivot.role}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {journal.events.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Eventos
              </Text>
              {journal.events.map((event: { id: number; title: string; created_at: string }) => (
                <View key={event.id} style={[styles.eventItem, { backgroundColor: colors.card }]}>
                  <Text style={[styles.eventTitle, { color: colors.text }]}>
                    {event.title}
                  </Text>
                  <Text style={[styles.eventDate, { color: colors.text }]}>
                    {new Date(event.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              ))}
            </View>
          )}
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  infoContainer: {
    gap: 16,
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  memberRole: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  eventItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 