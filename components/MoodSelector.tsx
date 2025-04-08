import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform, Alert } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { moods } from '../services/moods';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MoodOption {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const moodOptions: MoodOption[] = [
  { id: 'happy', label: 'Feliz', icon: 'emoticon-happy-outline' },
  { id: 'excited', label: 'Emocionado', icon: 'emoticon-excited-outline' },
  { id: 'neutral', label: 'Neutral', icon: 'emoticon-neutral-outline' },
  { id: 'sad', label: 'Triste', icon: 'emoticon-sad-outline' },
  { id: 'angry', label: 'Enojado', icon: 'emoticon-angry-outline' },
  { id: 'tired', label: 'Cansado', icon: 'sleep' },
  { id: 'sick', label: 'Enfermo', icon: 'emoticon-sick-outline' },
  { id: 'anxious', label: 'Ansioso', icon: 'head-sync' },
];

export const MoodSelector = () => {
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [androidStep, setAndroidStep] = useState<'mood' | 'date' | 'time'>('mood');

  const handleMoodSelect = (mood: MoodOption) => {
    setSelectedMood(mood);
    if (Platform.OS === 'android') {
      setAndroidStep('date');
    } else {
      setShowDateModal(true);
    }
  };

  const handleDateChange = async (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate) {
        if (androidStep === 'date') {
          // Actualizar la fecha y cambiar al paso de hora
          const newDate = new Date(date);
          newDate.setFullYear(selectedDate.getFullYear());
          newDate.setMonth(selectedDate.getMonth());
          newDate.setDate(selectedDate.getDate());
          setDate(newDate);
          setAndroidStep('time');
        } else if (androidStep === 'time') {
          // Actualizar la hora y guardar el estado de ánimo
          const newDate = new Date(date);
          newDate.setHours(selectedDate.getHours());
          newDate.setMinutes(selectedDate.getMinutes());
          setDate(newDate);
          
          if (selectedMood) {
            setLoading(true);
            try {
              await moods.create(selectedMood.id, newDate);
              Alert.alert(
                '¡Éxito!',
                'Tu estado de ánimo ha sido guardado correctamente',
                [{ text: 'OK' }]
              );
              setSelectedMood(null);
              setAndroidStep('mood');
            } catch (error) {
              console.error('Error al guardar el estado de ánimo:', error);
              Alert.alert(
                'Error',
                'No se pudo guardar tu estado de ánimo. Por favor, intenta nuevamente.',
                [{ text: 'OK' }]
              );
              setSelectedMood(null);
              setAndroidStep('mood');
            } finally {
              setLoading(false);
            }
          }
        }
      } else if (event.type === 'dismissed') {
        // Si se cancela, volver al paso anterior o cerrar
        if (androidStep === 'time') {
          setAndroidStep('date');
        } else if (androidStep === 'date') {
          setSelectedMood(null);
          setAndroidStep('mood');
        }
      }
    } else {
      // En iOS, actualizar la fecha y cerrar el modal
      if (selectedDate) {
        setDate(selectedDate);
      }
      setShowDateModal(false);
    }
  };

  const handleCancel = () => {
    setSelectedMood(null);
    if (Platform.OS === 'android') {
      setAndroidStep('mood');
    } else {
      setShowDateModal(false);
    }
  };

  const handleSaveMood = async () => {
    if (selectedMood) {
      setLoading(true);
      try {
        await moods.create(selectedMood.id, date);
        Alert.alert(
          '¡Éxito!',
          'Tu estado de ánimo ha sido guardado correctamente',
          [{ text: 'OK' }]
        );
        setSelectedMood(null);
        setShowDateModal(false);
      } catch (error) {
        console.error('Error al guardar el estado de ánimo:', error);
        Alert.alert(
          'Error',
          'No se pudo guardar tu estado de ánimo. Por favor, intenta nuevamente.',
          [{ text: 'OK' }]
        );
        setSelectedMood(null);
        setShowDateModal(false);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cómo te sientes?</Text>
      
      {Platform.OS === 'android' && androidStep === 'mood' && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {moodOptions.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.moodItem,
                selectedMood?.id === mood.id && styles.selectedMood,
              ]}
              onPress={() => handleMoodSelect(mood)}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name={mood.icon}
                size={32}
                color={selectedMood?.id === mood.id ? '#fff' : '#202024'}
              />
              <Text style={[
                styles.moodLabel,
                selectedMood?.id === mood.id && styles.selectedMoodLabel
              ]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {Platform.OS === 'android' && androidStep === 'date' && (
        <View style={styles.androidStepperContainer}>
          <Text style={styles.stepperTitle}>Selecciona la fecha</Text>
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        </View>
      )}

      {Platform.OS === 'android' && androidStep === 'time' && (
        <View style={styles.androidStepperContainer}>
          <Text style={styles.stepperTitle}>Selecciona la hora</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <MaterialCommunityIcons name="loading" size={24} color="#8b5cf6" style={styles.loadingIcon} />
              <Text style={styles.loadingText}>Guardando tu estado de ánimo...</Text>
            </View>
          ) : (
            <DateTimePicker
              value={date}
              mode="time"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>
      )}

      {Platform.OS === 'ios' && (
        <>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {moodOptions.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodItem,
                  selectedMood?.id === mood.id && styles.selectedMood,
                ]}
                onPress={() => handleMoodSelect(mood)}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name={mood.icon}
                  size={32}
                  color={selectedMood?.id === mood.id ? '#fff' : '#202024'}
                />
                <Text style={[
                  styles.moodLabel,
                  selectedMood?.id === mood.id && styles.selectedMoodLabel
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {showDateModal && (
            <Modal
              visible={showDateModal}
              transparent={true}
              animationType="slide"
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Seleccionar Fecha y Hora</Text>
                    <TouchableOpacity onPress={handleCancel}>
                      <Text style={styles.modalCloseButton}>×</Text>
                    </TouchableOpacity>
                  </View>
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <MaterialCommunityIcons name="loading" size={24} color="#8b5cf6" style={styles.loadingIcon} />
                      <Text style={styles.loadingText}>Guardando tu estado de ánimo...</Text>
                    </View>
                  ) : (
                    <>
                      <DateTimePicker
                        value={date}
                        mode="datetime"
                        display="spinner"
                        onChange={handleDateChange}
                        style={styles.dateTimePicker}
                      />
                      <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={handleSaveMood}
                        disabled={loading}
                      >
                        <Text style={styles.saveButtonText}>
                          {loading ? 'Guardando...' : 'Guardar'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </Modal>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#202024',
  },
  scrollContent: {
    paddingRight: 16,
  },
  moodItem: {
    width: 80,
    height: 100,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginRight: 12,
  },
  selectedMood: {
    backgroundColor: '#8b5cf6',
  },
  moodLabel: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    color: '#202024',
  },
  selectedMoodLabel: {
    color: '#fff',
  },
  androidStepperContainer: {
    padding: 16,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    marginTop: 16,
  },
  stepperTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#202024',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202024',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#202024',
    padding: 8,
  },
  dateTimePicker: {
    height: 200,
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loadingIcon: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#202024',
    textAlign: 'center',
  },
}); 