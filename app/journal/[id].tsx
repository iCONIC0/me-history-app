import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';
import { journalsService } from '../../services/journals';
import { Ionicons } from '@expo/vector-icons';
import type { Journal, User } from '../../services/journals';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { EventCard } from '../../components/EventCard';

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
      <SafeAreaView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
        <ActivityIndicator size="large" color="#e16b5c" />
      </SafeAreaView>
    );
  }

  if (error || !journal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
        <Text style={[styles.errorText, { color: '#202024' }]}>
          {error || 'Bitácora no encontrada'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: '#e16b5c' }]}
          onPress={loadJournal}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#202024" />
          </TouchableOpacity>
          <Text style={[styles.title, { color: '#202024' }]}>
            {journal.name}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.description, { color: '#202024' }]}>
            {journal.description || 'Sin descripción'}
          </Text>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="people" size={20} color="#202024" />
                <Text style={[styles.infoText, { color: '#202024' }]}>
                  {journal.users.length} {journal.users.length === 1 ? 'miembro' : 'miembros'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color="#202024" />
                <Text style={[styles.infoText, { color: '#202024' }]}>
                  Última actualización: {new Date(journal.updated_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="person" size={20} color="#202024" />
                <Text style={[styles.infoText, { color: '#202024' }]}>
                  Propietario: {journal.owner.name}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="lock-closed" size={20} color="#202024" />
                <Text style={[styles.infoText, { color: '#202024' }]}>
                  {journal.is_public ? 'Pública' : 'Privada'}
                </Text>
              </View>
            </View>

            <View style={styles.invitationCodeContainer}>
              <View style={styles.invitationCodeInfo}>
                <Ionicons name="key" size={20} color="#6177c2" />
                <Text style={[styles.invitationCodeText, { color: '#6177c2' }]}>
                  Código de invitación: {journal.invitation_code}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={async () => {
                  try {
                    await Clipboard.setStringAsync(journal.invitation_code);
                    Alert.alert('Éxito', 'Código de invitación copiado al portapapeles');
                  } catch (error) {
                    console.error('Error al copiar código:', error);
                    Alert.alert('Error', 'No se pudo copiar el código de invitación');
                  }
                }}
              >
                <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
                <Text style={styles.copyButtonText}>Copiar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#202024' }]}>
              Miembros
            </Text>
            {journal.users.map((user: User) => (
              <View key={user.id} style={[styles.memberItem, { backgroundColor: '#e7d3c1' }]}>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: '#202024' }]}>
                    {user.name}
                  </Text>
                  <Text style={[styles.memberEmail, { color: '#202024' }]}>
                    {user.email}
                  </Text>
                </View>
                {user.pivot && (
                  <Text style={[styles.memberRole, { color: '#202024' }]}>
                    {user.pivot.role}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {journal.events.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#202024' }]}>
                Registros
              </Text>
              {journal.events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={(eventId) => router.push(`/event/${eventId}`)}
                />
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: '45%',
  },
  infoText: {
    fontSize: 16,
  },
  invitationCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e7d3c1',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  invitationCodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  invitationCodeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6177c2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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