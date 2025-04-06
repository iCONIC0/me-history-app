import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { journalsService, Journal } from '../../services/journals';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

export default function SharedJournalsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [newJournalTitle, setNewJournalTitle] = useState('');
  const [newJournalDescription, setNewJournalDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await journalsService.getJournals();
      setJournals(data);
    } catch (err) {
      console.error('Error al cargar bitácoras:', err);
      setError('No se pudieron cargar las bitácoras');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJournal = async () => {
    if (!newJournalTitle.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }

    try {
      await journalsService.createJournal({
        name: newJournalTitle.trim(),
        description: newJournalDescription.trim(),
        is_public: false,
      });
      
      setIsCreateModalVisible(false);
      setNewJournalTitle('');
      setNewJournalDescription('');
      loadJournals();
    } catch (err) {
      console.error('Error al crear bitácora:', err);
      Alert.alert('Error', 'No se pudo crear la bitácora');
    }
  };

  const handleJoinJournal = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'El código es requerido');
      return;
    }

    try {
      await journalsService.joinJournal(joinCode.trim());
      setIsJoinModalVisible(false);
      setJoinCode('');
      loadJournals();
    } catch (err) {
      console.error('Error al unirse a la bitácora:', err);
      Alert.alert('Error', 'No se pudo unirse a la bitácora');
    }
  };

  const handleDeleteJournal = async (journalId: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta bitácora? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await journalsService.deleteJournal(journalId);
              loadJournals();
            } catch (err) {
              console.error('Error al eliminar bitácora:', err);
              Alert.alert('Error', 'No se pudo eliminar la bitácora');
            }
          },
        },
      ]
    );
  };

  const renderJournalItem = ({ item }: { item: Journal }) => {
    const isOwner = item.owner_id === user?.id;
    const memberCount = item?.users?.length;
    const isAdmin = item?.users?.some(u => u.id === user?.id && u.pivot?.role === 'admin');
    
    const copyInvitationCode = async () => {
      try {
        await Clipboard.setStringAsync(item.invitation_code);
        Alert.alert('Éxito', 'Código de invitación copiado al portapapeles');
      } catch (error) {
        console.error('Error al copiar código:', error);
        Alert.alert('Error', 'No se pudo copiar el código de invitación');
      }
    };

    return (
      <TouchableOpacity
        style={[styles.journalItem, { backgroundColor: '#e7d3c1' }]}
        onPress={() => router.push(`/journal/${item.id}`)}
      >
        <View style={styles.journalHeader}>
          <View style={styles.journalTitleContainer}>
            <Ionicons name="book-outline" size={24} color="#e16b5c" />
            <Text style={[styles.journalTitle, { color: '#202024' }]}>{item.name}</Text>
          </View>
          {isOwner && (
            <TouchableOpacity
              onPress={() => handleDeleteJournal(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
        
        {(isOwner || isAdmin) && (
          <TouchableOpacity 
            style={styles.invitationCodeContainer}
            onPress={copyInvitationCode}
          >
            <Ionicons name="copy-outline" size={16} color="#6177c2" />
            <Text style={[styles.invitationCode, { color: '#6177c2' }]}>
              Código: {item.invitation_code}
            </Text>
          </TouchableOpacity>
        )}

        {item.description ? (
          <Text style={[styles.journalDescription, { color: '#202024' }]}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.journalFooter}>
          <View style={styles.journalInfo}>
            <View style={styles.memberCount}>
              <Ionicons name="people-outline" size={16} color="#202024" />
              <Text style={[styles.memberCountText, { color: '#202024' }]}>
                {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
              </Text>
            </View>
            <Text style={[styles.lastUpdate, { color: '#202024' }]}>
              Actualizado: {new Date(item.updated_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
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
          onPress={loadJournals}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: '#202024' }]}>Bitácoras Compartidas</Text>
        <Text style={[styles.subtitle, { color: '#202024' }]}>
          Colabora y comparte momentos con otros
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#e16b5c' }]}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Crear Bitácora</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#e16b5c' }]}
          onPress={() => setIsJoinModalVisible(true)}
        >
          <Ionicons name="enter-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Unirse</Text>
        </TouchableOpacity>
      </View>

      {journals?.length > 0 ? (
        <FlatList
          data={journals}
          renderItem={renderJournalItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color={colors.text} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No tienes bitácoras compartidas
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text }]}>
            Crea una nueva bitácora o únete a una existente
          </Text>
        </View>
      )}

      {/* Modal para crear bitácora */}
      <Modal
        visible={isCreateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: '#f7f5f2' }]}>
            <Text style={[styles.modalTitle, { color: '#202024' }]}>Crear Nueva Bitácora</Text>
            
            <TextInput
              style={[styles.input, { 
                borderColor: '#e7d3c1',
                color: '#202024',
                backgroundColor: '#e7d3c1'
              }]}
              placeholder="Título de la bitácora"
              placeholderTextColor="#20202480"
              value={newJournalTitle}
              onChangeText={setNewJournalTitle}
            />
            
            <TextInput
              style={[styles.input, styles.textArea, { 
                borderColor: '#e7d3c1',
                color: '#202024',
                backgroundColor: '#e7d3c1'
              }]}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#20202480"
              value={newJournalDescription}
              onChangeText={setNewJournalDescription}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: '#e7d3c1' }]}
                onPress={() => setIsCreateModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: '#202024' }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: '#e16b5c' }]}
                onPress={handleCreateJournal}
              >
                <Text style={styles.confirmButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para unirse a una bitácora */}
      <Modal
        visible={isJoinModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsJoinModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: '#f7f5f2' }]}>
            <Text style={[styles.modalTitle, { color: '#202024' }]}>Unirse a una Bitácora</Text>
            
            <TextInput
              style={[styles.input, { 
                borderColor: '#e7d3c1',
                color: '#202024',
                backgroundColor: '#e7d3c1'
              }]}
              placeholder="Código de invitación"
              placeholderTextColor="#20202480"
              value={joinCode}
              onChangeText={setJoinCode}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: '#e7d3c1' }]}
                onPress={() => setIsJoinModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: '#202024' }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: '#e16b5c' }]}
                onPress={handleJoinJournal}
              >
                <Text style={styles.confirmButtonText}>Unirse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 20,
  },
  journalItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  journalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  journalDescription: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  journalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 14,
  },
  lastUpdate: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    opacity: 0.5,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  invitationCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF40',
  },
  invitationCode: {
    fontSize: 12,
    fontWeight: '500',
  },
  journalInfo: {
    flexDirection: 'column',
    gap: 4,
  },
}); 