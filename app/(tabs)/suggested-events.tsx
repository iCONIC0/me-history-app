import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Switch,
  Image,
  Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { eventsService, Event, SuggestedEvent, SuggestedEventsResponse, CreateEventData } from '../../services/events';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Video, ResizeMode } from 'expo-av';
import DateTimePicker from '@react-native-community/datetimepicker';
import { journalsService, Journal } from '../../services/journals';

// Tipos de eventos disponibles
const EVENT_TYPES = [
  { id: 'text', icon: 'text', label: 'Texto' },
  { id: 'image', icon: 'image', label: 'Imagen' },
  { id: 'audio', icon: 'mic', label: 'Audio' },
  { id: 'video', icon: 'videocam', label: 'Video' },
  { id: 'mixed', icon: 'albums', label: 'Mixto' },
  { id: 'time', icon: 'time-outline', label: 'Tiempo' },
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
};

// Definición de campos adicionales por tipo de evento
const EVENT_TYPE_FIELDS = {
  text: [
    { id: 'content', label: 'Contenido', type: 'textarea', required: true },
  ],
  image: [
    { id: 'image_url', label: 'URL de la imagen', type: 'text', required: true },
  ],
  audio: [
    { id: 'audio_url', label: 'URL del audio', type: 'text', required: true },
  ],
  video: [
    { id: 'video_url', label: 'URL del video', type: 'text', required: true },
  ],
  mixed: [
    { id: 'content', label: 'Contenido', type: 'textarea', required: true },
    { id: 'media_urls', label: 'URLs de medios (separadas por comas)', type: 'textarea', required: false },
  ],
  time: [
    { id: 'time', label: 'Hora', type: 'time', required: true },
  ],
};

export default function SuggestedEventsScreen() {
  const { colors } = useTheme();
  const [frequentEvents, setFrequentEvents] = useState<SuggestedEvent[]>([]);
  const [predefinedEvents, setPredefinedEvents] = useState<SuggestedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'frequent' | 'predefined'>('frequent');
  
  // Estados para el modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SuggestedEvent | null>(null);
  const [description, setDescription] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [useJournal, setUseJournal] = useState(false);
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  
  // Estados para fecha y hora
  const [date, setDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [datePickerStep, setDatePickerStep] = useState<'date' | 'time'>('date');
  
  // Estados para manejo de medios
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<'photo' | 'video'>('photo');
  
  // Referencias para temporizadores
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      opacity: 0.7,
    },
    tabsContainer: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      gap: 8,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '500',
    },
    categoriesSection: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    categoriesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingHorizontal: 5,
    },
    categoryButton: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      padding: 10,
    },
    categoryText: {
      marginTop: 8,
      fontSize: 14,
      textAlign: 'center',
    },
    suggestedEventsSection: {
      padding: 20,
    },
    eventItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    eventIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    eventInfo: {
      flex: 1,
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    eventDescription: {
      fontSize: 14,
      opacity: 0.7,
    },
    usageCount: {
      fontSize: 12,
      opacity: 0.5,
      marginTop: 4,
    },
    separator: {
      height: 8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '500',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
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
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    modalBody: {
      maxHeight: '80%',
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
    },
    input: {
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    createButton: {
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 40,
    },
    createButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    mediaContainer: {
      marginTop: 8,
    },
    mediaOptions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    mediaOption: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mediaOptionText: {
      marginTop: 8,
      fontSize: 14,
    },
    mediaPreview: {
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: 8,
    },
    audioPreview: {
      width: '100%',
      height: 100,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    audioPreviewText: {
      fontSize: 16,
    },
    videoPreview: {
      width: '100%',
      height: 100,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    videoPreviewText: {
      fontSize: 16,
    },
    removeMediaButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 12,
    },
    recordingInfo: {
      fontSize: 12,
      marginTop: 8,
      fontStyle: 'italic',
    },
    datePickerContainer: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    datePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    datePickerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    datePickerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      padding: 10,
    },
    calendarDayHeader: {
      width: '14.28%',
      textAlign: 'center',
      padding: 10,
      fontSize: 14,
      fontWeight: '500',
    },
    calendarDay: {
      width: '14.28%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
    },
    calendarDayText: {
      fontSize: 16,
    },
    timePickerContainer: {
      flex: 1,
    },
    timePickerControls: {
      flexDirection: 'row',
      flex: 1,
      gap: 20,
    },
    timePickerColumn: {
      flex: 1,
    },
    timePickerLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 10,
      textAlign: 'center',
    },
    timePickerScroll: {
      flex: 1,
    },
    timePickerOption: {
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    timePickerOptionText: {
      fontSize: 16,
    },
    timePickerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 20,
      gap: 10,
    },
    datePickerBackButton: {
      flex: 1,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    datePickerBackButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    confirmButton: {
      flex: 1,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '500',
    },
    nextButton: {
      margin: 20,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    nextButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '500',
    },
    cameraContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'black',
      zIndex: 1000,
    },
    cameraPlaceholder: {
      flex: 1,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraControls: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    cameraButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mediaPreviewContainer: {
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
    },
    retakeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 12,
    },
    mediaButton: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mediaButtonText: {
      marginTop: 8,
      fontSize: 14,
    },
    recordingContainer: {
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
    },
    recordingIndicator: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recordingDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#007AFF',
      marginBottom: 8,
    },
    recordingText: {
      fontSize: 16,
      fontWeight: '500',
    },
    stopButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#007AFF',
      borderRadius: 12,
    },
    audioPreviewContainer: {
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
    },
    videoPreviewContainer: {
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
    },
    videoOptionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 8,
    },
    timeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    timeButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    journalsContainer: {
      marginTop: 10,
    },
    journalButton: {
      padding: 10,
      borderRadius: 8,
      marginBottom: 5,
    },
    journalButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
  });

  useEffect(() => {
    loadSuggestedEvents();
    requestPermissions();
  }, []);
  
  // Solicitar permisos para cámara, audio y galería
  const requestPermissions = async () => {
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    const { status: imageStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (cameraStatus !== 'granted' || audioStatus !== 'granted' || imageStatus !== 'granted') {
      Alert.alert(
        'Permisos necesarios',
        'Se requieren permisos para acceder a la cámara, micrófono y galería para crear eventos con medios.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadSuggestedEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await eventsService.getSuggestedEvents();
      
      if (!response || !response.frequent || !response.predefined) {
        throw new Error('Formato de respuesta inválido');
      }
      
      setFrequentEvents(response.frequent);
      setPredefinedEvents(response.predefined);
    } catch (err) {
      console.error('Error al cargar eventos sugeridos:', err);
      setError('No se pudieron cargar los eventos sugeridos');
      setFrequentEvents([]);
      setPredefinedEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedEvent = (event: SuggestedEvent) => {
    // Inicializar con valores por defecto consistentes
    setSelectedEvent(event);
    setDescription(event.description || '');
    setMetadata({});
    setUseJournal(false);
    setSelectedJournalId(null);
    setDate(new Date()); // Fecha actual por defecto
    setImageUri(null);
    setAudioUri(null);
    setVideoUri(null);
    setShowEventModal(true);
    // Cargar las bitácoras cuando se abre el modal
    loadJournals();
  };

  // Función para cargar las bitácoras
  const loadJournals = async () => {
    try {
      const userJournals = await journalsService.getJournals();
      setJournals(userJournals);
    } catch (error) {
      console.error('Error al cargar bitácoras:', error);
      Alert.alert('Error', 'No se pudieron cargar las bitácoras');
    }
  };

  // Funciones para manejo de fecha y hora
  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    if (datePickerStep === 'date') {
      setDatePickerStep('time');
    } else {
      setShowDateModal(false);
    }
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setDate(newDate);
    setShowDateModal(false);
  };

  const handleDatePickerClose = () => {
    setShowDateModal(false);
    setDatePickerStep('date');
  };

  // Funciones para manejo de medios
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        handleMetadataChange('image_url', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      setShowCamera(false);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere permiso para acceder a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        handleMetadataChange('image_url', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const startAudioRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere permiso para acceder al micrófono');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setIsRecording(true);
      setRecordingDuration(0);

      // Iniciar temporizador para limitar la duración a 1 minuto
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 60) {
            stopAudioRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error al iniciar grabación de audio:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación de audio');
    }
  };

  const stopAudioRecording = async () => {
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      setIsRecording(false);
      // Aquí iría la lógica para guardar el audio grabado
      // Por ahora, simulamos una URI
      const audioUri = 'file:///audio/recording.m4a';
      setAudioUri(audioUri);
      handleMetadataChange('audio_url', audioUri);
    } catch (error) {
      console.error('Error al detener grabación de audio:', error);
      Alert.alert('Error', 'No se pudo detener la grabación de audio');
    }
  };

  const startVideoRecording = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere permiso para acceder a la cámara');
        return;
      }

      setShowCamera(false);
      setIsVideoRecording(true);
      setVideoDuration(0);

      // Iniciar temporizador para limitar la duración a 1 minuto
      videoTimerRef.current = setInterval(() => {
        setVideoDuration(prev => {
          if (prev >= 60) {
            stopVideoRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error al iniciar grabación de video:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación de video');
    }
  };

  const stopVideoRecording = async () => {
    try {
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
        videoTimerRef.current = null;
      }

      setShowCamera(false);
      setIsVideoRecording(false);
      // Aquí iría la lógica para guardar el video grabado
      // Por ahora, simulamos una URI
      const videoUri = 'file:///video/recording.mp4';
      setVideoUri(videoUri);
      handleMetadataChange('video_url', videoUri);
    } catch (error) {
      console.error('Error al detener grabación de video:', error);
      Alert.alert('Error', 'No se pudo detener la grabación de video');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setVideoUri(result.assets[0].uri);
        handleMetadataChange('video_url', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar video:', error);
      Alert.alert('Error', 'No se pudo seleccionar el video');
    }
  };

  const handleCreateEvent = async () => {
    if (!selectedEvent) return;

    try {
      // Proporcionar feedback táctil
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Validar campos requeridos
      const requiredFields = EVENT_TYPE_FIELDS[selectedEvent.type as keyof typeof EVENT_TYPE_FIELDS]?.filter(field => field.required) || [];
      const missingFields = requiredFields.filter(field => !metadata[field.id]);
      
      if (missingFields.length > 0) {
        Alert.alert('Error', `Por favor completa los campos requeridos: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }

      // Crear un evento basado en la sugerencia con valores consistentes
      const eventData: CreateEventData = {
        title: selectedEvent.title,
        description: description.trim() || undefined,
        type: selectedEvent.type,
        category: selectedEvent.category,
        // Usar la fecha actual para todos los tipos de eventos
        event_date: new Date().toISOString(),
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };

      // Solo agregar shared_journal_id si se ha seleccionado una bitácora
      if (useJournal && selectedJournalId) {
        (eventData as any).shared_journal_id = selectedJournalId;
      }

      const newEvent = await eventsService.createEvent(eventData);
      
      if (!newEvent) {
        throw new Error('No se pudo crear el evento');
      }
      
      // Recargar eventos sugeridos
      loadSuggestedEvents();
      
      // Cerrar modal
      setShowEventModal(false);
      
      // Proporcionar feedback de éxito
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Error al crear evento sugerido:', err);
      Alert.alert('Error', 'No se pudo registrar el evento');
      
      // Proporcionar feedback de error
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleMetadataChange = (fieldId: string, value: string) => {
    setMetadata(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const renderTypeSpecificFields = () => {
    switch (selectedEvent?.type) {
      case 'image':
        return (
          <View style={styles.mediaContainer}>
            {imageUri ? (
              <View style={styles.mediaPreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={() => {
                    setImageUri(null);
                    handleMetadataChange('image_url', '');
                  }}
                >
                  <Ionicons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mediaOptions}>
                <TouchableOpacity 
                  style={[styles.mediaOption, { backgroundColor: colors.primary }]}
                  onPress={pickImage}
                >
                  <Ionicons name="images" size={24} color="#fff" />
                  <Text style={[styles.mediaOptionText, { color: '#fff' }]}>Seleccionar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.mediaOption, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setCameraType('photo');
                    setShowCamera(true);
                  }}
                >
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={[styles.mediaOptionText, { color: '#fff' }]}>Tomar foto</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      case 'audio':
        return (
          <View style={styles.mediaContainer}>
            {audioUri ? (
              <View style={styles.audioPreviewContainer}>
                <View style={styles.audioPreview}>
                  <Text style={styles.audioPreviewText}>Reproducir audio</Text>
                </View>
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={() => {
                    setAudioUri(null);
                    handleMetadataChange('audio_url', '');
                  }}
                >
                  <Ionicons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.recordingContainer}>
                {isRecording ? (
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>Grabando...</Text>
                    <Text style={styles.recordingInfo}>
                      {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity 
                      style={styles.stopButton}
                      onPress={stopAudioRecording}
                    >
                      <Ionicons name="stop-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.mediaOption, { backgroundColor: colors.primary }]}
                    onPress={startAudioRecording}
                  >
                    <Ionicons name="mic" size={24} color="#fff" />
                    <Text style={[styles.mediaOptionText, { color: '#fff' }]}>Grabar audio</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      case 'video':
        return (
          <View style={styles.mediaContainer}>
            {videoUri ? (
              <View style={styles.videoPreviewContainer}>
                <View style={styles.videoPreview}>
                  <Text style={styles.videoPreviewText}>Reproducir video</Text>
                </View>
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={() => {
                    setVideoUri(null);
                    handleMetadataChange('video_url', '');
                  }}
                >
                  <Ionicons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.videoOptionsContainer}>
                <TouchableOpacity 
                  style={[styles.mediaOption, { backgroundColor: colors.primary }]}
                  onPress={pickVideo}
                >
                  <Ionicons name="videocam" size={24} color="#fff" />
                  <Text style={[styles.mediaOptionText, { color: '#fff' }]}>Seleccionar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.mediaOption, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setCameraType('video');
                    setShowCamera(true);
                  }}
                >
                  <Ionicons name="videocam" size={24} color="#fff" />
                  <Text style={[styles.mediaOptionText, { color: '#fff' }]}>Grabar video</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      case 'time':
        return (
          <View style={styles.timeContainer}>
            <View style={styles.timeButton}>
              <Ionicons name="calendar" size={24} color={colors.primary} />
              <Text style={[styles.timeButtonText, { color: colors.text }]}>
                {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderEventModal = () => {
    if (!selectedEvent) return null;

    return (
      <Modal
        visible={showEventModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#f7f5f2' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#202024' }]}>
                {selectedEvent.title}
              </Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Ionicons name="close" size={24} color="#202024" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Mostrar fecha y hora actual */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: '#202024' }]}>Fecha y hora</Text>
                <View style={[styles.input, { backgroundColor: '#e7d3c1' }]}>
                  <Text style={{ color: '#202024' }}>
                    {format(new Date(), "EEEE d 'de' MMMM 'de' yyyy, h:mm a", { locale: es })}
                  </Text>
                </View>
              </View>

              {/* Descripción */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: '#202024' }]}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: '#e7d3c1', color: '#202024' }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Descripción del evento (opcional)"
                  placeholderTextColor="#20202480"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Opción para agregar a bitácora */}
              <View style={styles.formGroup}>
                <View style={styles.switchContainer}>
                  <Text style={[styles.label, { color: '#202024' }]}>Agregar a una bitácora</Text>
                  <Switch
                    value={useJournal}
                    onValueChange={setUseJournal}
                    trackColor={{ false: '#767577', true: '#e16b5c80' }}
                    thumbColor={useJournal ? '#e16b5c' : '#f4f3f4'}
                  />
                </View>
              </View>

              {useJournal && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: '#202024' }]}>Seleccionar Bitácora</Text>
                  <View style={styles.journalsContainer}>
                    {journals.map((journal) => (
                      <TouchableOpacity
                        key={journal.id}
                        style={[
                          styles.journalButton,
                          { backgroundColor: '#e7d3c1' },
                          selectedJournalId === journal.id && { borderColor: '#e16b5c', borderWidth: 2 }
                        ]}
                        onPress={() => setSelectedJournalId(journal.id)}
                      >
                        <Text style={[styles.journalButtonText, { color: '#202024' }]}>
                          {journal.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Campos específicos según el tipo */}
              {renderTypeSpecificFields()}

              {/* Botón de crear */}
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: '#e16b5c' }]}
                onPress={handleCreateEvent}
              >
                <Text style={styles.createButtonText}>Crear Evento</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEventItem = ({ item }: { item: SuggestedEvent }) => {
    // Usar un icono genérico para evitar errores con iconos no válidos
    const iconName = "calendar-outline";
    
    return (
      <TouchableOpacity 
        style={[styles.eventItem, { backgroundColor: '#e7d3c1' }]}
        onPress={() => handleSuggestedEvent(item)}
      >
        <View style={styles.eventIconContainer}>
          <Ionicons name={iconName} size={24} color="#e16b5c" />
        </View>
        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { color: '#202024' }]}>{item.title}</Text>
          <Text style={[styles.eventDescription, { color: '#202024' }]}>
            {item.description || 'Sin descripción'}
          </Text>
          {item.usage_count && (
            <Text style={[styles.usageCount, { color: '#202024' }]}>
              Usado {item.usage_count} veces
            </Text>
          )}
        </View>
        <Ionicons name="add-circle-outline" size={24} color="#e16b5c" />
      </TouchableOpacity>
    );
  };

  // Obtener categorías únicas de los eventos según la pestaña activa
  const getCategories = () => {
    const events = activeTab === 'frequent' ? frequentEvents : predefinedEvents;
    return [...new Set(events.map(event => event.category))];
  };

  // Filtrar eventos por categoría seleccionada según la pestaña activa
  const getFilteredEvents = () => {
    const events = activeTab === 'frequent' ? frequentEvents : predefinedEvents;
    return selectedCategory
      ? events.filter(event => event.category === selectedCategory)
      : events;
  };

  const renderCategoryButton = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        { backgroundColor: '#e7d3c1' },
        selectedCategory === category && { backgroundColor: '#e16b5c' }
      ]}
      onPress={() => setSelectedCategory(selectedCategory === category ? null : category)}
    >
      <Ionicons name="pricetag-outline" size={24} color={selectedCategory === category ? '#FFFFFF' : '#202024'} />
      <Text style={[styles.categoryText, { color: selectedCategory === category ? '#FFFFFF' : '#202024' }]}>
        {CATEGORY_LABELS[category] || category}
      </Text>
    </TouchableOpacity>
  );

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
          onPress={loadSuggestedEvents}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const categories = getCategories();
  const filteredEvents = getFilteredEvents();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: '#202024' }]}>Eventos Sugeridos</Text>
          <Text style={[styles.subtitle, { color: '#202024' }]}>
            Descubre eventos que podrían interesarte
          </Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: '#e7d3c1' },
              activeTab === 'frequent' && { backgroundColor: '#e16b5c' }
            ]}
            onPress={() => {
              setActiveTab('frequent');
              setSelectedCategory(null);
            }}
          >
            <Ionicons name="time-outline" size={20} color={activeTab === 'frequent' ? '#FFFFFF' : '#202024'} />
            <Text style={[styles.tabText, { color: activeTab === 'frequent' ? '#FFFFFF' : '#202024' }]}>
              Frecuentes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: '#e7d3c1' },
              activeTab === 'predefined' && { backgroundColor: '#e16b5c' }
            ]}
            onPress={() => {
              setActiveTab('predefined');
              setSelectedCategory(null);
            }}
          >
            <Ionicons name="star-outline" size={20} color={activeTab === 'predefined' ? '#FFFFFF' : '#202024'} />
            <Text style={[styles.tabText, { color: activeTab === 'predefined' ? '#FFFFFF' : '#202024' }]}>
              Predefinidos
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: '#202024' }]}>
            Categorías
          </Text>
          <View style={styles.categoriesContainer}>
            {categories.map(renderCategoryButton)}
          </View>
        </View>

        <View style={styles.suggestedEventsSection}>
          <Text style={[styles.sectionTitle, { color: '#202024' }]}>
            {activeTab === 'frequent' ? 'Eventos Frecuentes' : 'Eventos Predefinidos'}
          </Text>
          
          {filteredEvents.length > 0 ? (
            <FlatList
              data={filteredEvents}
              renderItem={renderEventItem}
              keyExtractor={(item) => `event_${item.id}`}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#202024" />
              <Text style={[styles.emptyStateText, { color: '#202024' }]}>
                No hay eventos sugeridos
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: '#202024' }]}>
                {selectedCategory 
                  ? 'No hay eventos en esta categoría' 
                  : activeTab === 'frequent' 
                    ? 'No tienes eventos frecuentes' 
                    : 'No hay eventos predefinidos disponibles'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      {renderEventModal()}
      
      {/* Modal de selección de fecha y hora */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={handleDatePickerClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#f7f5f2' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#202024' }]}>
                {datePickerStep === 'date' ? 'Seleccionar Fecha' : 'Seleccionar Hora'}
              </Text>
              <TouchableOpacity onPress={handleDatePickerClose}>
                <Ionicons name="close" size={24} color="#202024" />
              </TouchableOpacity>
            </View>

            {datePickerStep === 'date' ? (
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Text style={[styles.datePickerTitle, { color: '#202024' }]}>
                    {format(date, "MMMM yyyy", { locale: es })}
                  </Text>
                  <View style={styles.datePickerControls}>
                    <TouchableOpacity
                      onPress={() => {
                        const newDate = new Date(date);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setDate(newDate);
                      }}
                    >
                      <Ionicons name="chevron-back" size={24} color="#202024" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const newDate = new Date(date);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setDate(newDate);
                      }}
                    >
                      <Ionicons name="chevron-forward" size={24} color="#202024" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.calendarGrid}>
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                    <Text key={day} style={[styles.calendarDayHeader, { color: '#202024' }]}>
                      {day}
                    </Text>
                  ))}
                  {Array.from({ length: 42 }, (_, i) => {
                    const currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
                    const firstDay = currentDate.getDay();
                    const day = i - firstDay + 1;
                    const isCurrentMonth = day > 0 && day <= new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                    const isSelected = isCurrentMonth && day === date.getDate();
                    const isToday = isCurrentMonth && day === new Date().getDate() && 
                                  date.getMonth() === new Date().getMonth() && 
                                  date.getFullYear() === new Date().getFullYear();

                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.calendarDay,
                          isSelected && { backgroundColor: '#e16b5c' },
                          isToday && !isSelected && { borderColor: '#e16b5c', borderWidth: 1 }
                        ]}
                        onPress={() => {
                          if (isCurrentMonth) {
                            const newDate = new Date(date);
                            newDate.setDate(day);
                            setDate(newDate);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            { color: isCurrentMonth ? '#202024' : '#20202440' },
                            isSelected && { color: '#FFFFFF' }
                          ]}
                        >
                          {isCurrentMonth ? day : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.nextButton, { backgroundColor: '#e16b5c' }]}
                  onPress={() => setDatePickerStep('time')}
                >
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerControls}>
                  <View style={styles.timePickerColumn}>
                    <Text style={[styles.timePickerLabel, { color: '#202024' }]}>Hora</Text>
                    <ScrollView style={styles.timePickerScroll}>
                      {Array.from({ length: 24 }, (_, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.timePickerOption,
                            date.getHours() === i && { backgroundColor: '#e16b5c' }
                          ]}
                          onPress={() => handleTimeChange(i, date.getMinutes())}
                        >
                          <Text
                            style={[
                              styles.timePickerOptionText,
                              { color: '#202024' },
                              date.getHours() === i && { color: '#FFFFFF' }
                            ]}
                          >
                            {i.toString().padStart(2, '0')}:00
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.timePickerColumn}>
                    <Text style={[styles.timePickerLabel, { color: '#202024' }]}>Minutos</Text>
                    <ScrollView style={styles.timePickerScroll}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.timePickerOption,
                            date.getMinutes() === i * 5 && { backgroundColor: '#e16b5c' }
                          ]}
                          onPress={() => handleTimeChange(date.getHours(), i * 5)}
                        >
                          <Text
                            style={[
                              styles.timePickerOptionText,
                              { color: '#202024' },
                              date.getMinutes() === i * 5 && { color: '#FFFFFF' }
                            ]}
                          >
                            {(i * 5).toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.timePickerActions}>
                  <TouchableOpacity
                    style={[styles.datePickerBackButton, { backgroundColor: '#e7d3c1' }]}
                    onPress={() => setDatePickerStep('date')}
                  >
                    <Text style={[styles.datePickerBackButtonText, { color: '#202024' }]}>Atrás</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: '#e16b5c' }]}
                    onPress={handleDatePickerClose}
                  >
                    <Text style={styles.confirmButtonText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Modal de cámara */}
      {showCamera && (
        <View style={styles.cameraContainer}>
          <View style={styles.cameraPlaceholder}>
            <Text style={{ color: 'white', fontSize: 18 }}>Vista previa de cámara</Text>
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={cameraType === 'photo' ? takePhoto : stopVideoRecording}
              >
                <Ionicons name={cameraType === 'photo' ? "camera" : "stop-circle"} size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
} 