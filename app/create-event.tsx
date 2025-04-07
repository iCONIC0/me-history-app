import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  Image,
  Platform,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { eventsService, CreateEventData } from '../services/events';
import { journalsService, Journal } from '../services/journals';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Video, ResizeMode } from 'expo-av';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RichTextEditor } from '../components/RichTextEditor';

// Tipos de eventos disponibles
const EVENT_TYPES = [
  { id: 'text', icon: 'text', label: 'Texto' },
  { id: 'image', icon: 'image', label: 'Imagen' },
  { id: 'audio', icon: 'mic', label: 'Audio' },
  { id: 'video', icon: 'videocam', label: 'Video' },
  { id: 'mixed', icon: 'albums', label: 'Mixto' },
  { id: 'time', icon: 'time', label: 'Tiempo' },
];
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
// Categorías de eventos disponibles
const EVENT_CATEGORIES = [
  { id: 'life-diary', icon: 'book', label: 'Diario' },
  { id: 'health', icon: 'medical', label: 'Salud' },
  { id: 'fitness', icon: 'fitness', label: 'Ejercicio' },
  { id: 'family', icon: 'people', label: 'Familia' },
  { id: 'hobby', icon: 'game-controller', label: 'Hobby' },
  { id: 'travel', icon: 'airplane', label: 'Viajes' },
  { id: 'eat', icon: 'restaurant', label: 'Comida' },
];

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
  time: [], // Removemos el campo time ya que usamos date directamente
};

interface MediaFile {
  uri: string;
  type: 'image' | 'video' | 'audio';
  name?: string;
}

// Añadir el tipo para el DateTimePicker
type DateTimePickerComponent = any;

// Componente personalizado para el DateTimePicker
const CustomDateTimePicker = ({ 
  value, 
  onChange, 
  show,
  mode
}: { 
  value: Date; 
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
  show: boolean;
  mode?: 'date' | 'time';
}) => {
  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={value}
        mode="datetime"
        display="spinner"
        onChange={onChange}
        locale="es"
        style={{ width: '100%', height: 200 }}
        textColor="#202024"
      />
    );
  }

  // En Android, mostramos el picker nativo directamente
  if (show) {
    return (
      <DateTimePicker
        value={value}
        mode={mode || 'date'}
        onChange={onChange}
        locale="es"
      />
    );
  }
  
  return null;
};

export default function CreateEventScreen() {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('mixed');
  const [category, setCategory] = useState('life-diary');
  const [date, setDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);
  const [useJournal, setUseJournal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [datePickerStep, setDatePickerStep] = useState<'date' | 'time'>('date');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Estados para manejo de medios
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<any>(null);
  
  // Referencias
  const audioRecording = useRef<Audio.Recording | null>(null);
  const audioPlayer = useRef<Audio.Sound | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // Añadir el estado para el modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f7f5f2',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    backButton: {
      padding: 8,
      backgroundColor: '#F5F5F5',
      borderRadius: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '600',
      color: '#202024',
      marginLeft: 12,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: 16,
      width: '100%',
    },
    inputContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: '#666',
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    titleInput: {
      fontSize: 24,
      fontWeight: '500',
      color: '#202024',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#E5E5E5',
      backgroundColor: '#FFFFFF',
    },
    editorContainer: {
      minHeight: 200,
    },
    mediaButtonsContainer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#E5E5E5',
    },
    mediaButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'space-around',
      width: '100%',
      marginBottom:16
    },
    mediaButton: {
      width: '30%',
      backgroundColor: '#f7f5f2',
      borderRadius: 12,
      padding: 8,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    mediaButtonActive: {
      backgroundColor: '#e16b5c20',
    },
    mediaButtonText: {
      fontSize: 10,
      color: '#666',
      textAlign: 'center',
      marginTop: 2,
    },
    mediaPreviewsContainer: {
      marginBottom: 16,
    },
    mediaPreviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      paddingHorizontal: 4,
    },
    mediaPreviewItem: {
      position: 'relative',
      width: '31%',
      marginBottom: 6,
    },
    mediaPreview: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 8,
      backgroundColor: '#F0F0F0',
    },
    imagePreview: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 8,
      backgroundColor: '#F0F0F0',
    },
    videoPreview: {
      width: '100%',
      aspectRatio: 16/9,
      borderRadius: 8,
      backgroundColor: '#F0F0F0',
    },
    audioPreviewContainer: {
      width: '100%',
      backgroundColor: '#f7f5f2',
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    audioPlayerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    audioPlayButton: {
      padding: 4,
    },
    audioControls: {
      flex: 1,
    },
    audioTimeText: {
      fontSize: 12,
      color: '#666',
      marginBottom: 4,
    },
    audioProgressContainer: {
      height: 4,
      backgroundColor: '#E5E5E5',
      borderRadius: 2,
    },
    audioProgress: {
      height: '100%',
      backgroundColor: '#e16b5c',
      borderRadius: 2,
    },
    removeButton: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      padding: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 2,
    },
    submitButton: {
      backgroundColor: '#e16b5c',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginVertical: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    recordingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      backgroundColor: '#FF3B3020',
      borderRadius: 16,
      marginTop: 8,
      gap: 8,
    },
    recordingText: {
      color: '#FF3B30',
      fontSize: 12,
      fontWeight: '500',
    },
    audioPreview: {
      width: '100%',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    audioPlayerContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
    },
    audioTimeText: {
      fontSize: 14,
      marginBottom: 8,
    },
    audioProgressContainer: {
      width: '100%',
      height: 4,
      backgroundColor: '#E5E5E5',
      borderRadius: 2,
      marginBottom: 8,
    },
    audioPlayButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    audioSeekButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '60%',
      marginTop: 8,
    },
    audioSeekButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: '#F0F0F0',
    },
    formGroup: {
      marginBottom: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: '#E5E5E5',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      minHeight: 48,
    },
    textArea: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    mediaContainer: {
      borderWidth: 1,
      borderColor: '#E5E5E5',
      borderRadius: 8,
      overflow: 'hidden',
    },
    mediaOptions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 16,
    },
    mediaOption: {
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      minWidth: 100,
    },
    mediaOptionText: {
      marginTop: 8,
      fontSize: 14,
    },
    removeMediaButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 4,
    },
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E5E5',
    },
    selectButtonText: {
      fontSize: 16,
    },
    recordingInfo: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      padding: 20,
      borderRadius: 12,
      width: '90%',
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#202024',
    },
    modalCloseButton: {
      fontSize: 24,
      color: '#666',
      padding: 4,
    },
    dateTimePicker: {
      backgroundColor: '#FFFFFF',
      height: 200,
    },
    categorySelector: {
      marginBottom: 16,
    },
    categoryLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: '#666',
      marginBottom: 8,
    },
    categoryScrollContent: {
      paddingRight: 16,
    },
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginRight: 8,
    },
    categoryButtonActive: {
      backgroundColor: '#e16b5c',
    },
    categoryButtonText: {
      fontSize: 14,
      color: '#666',
      marginLeft: 4,
    },
    categoryButtonTextActive: {
      color: '#FFFFFF',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      width: '80%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#202024',
      textAlign: 'center',
      marginBottom: 20,
    },
    modalOptions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    modalOption: {
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: '#f7f5f2',
      width: '45%',
    },
    modalOptionText: {
      marginTop: 8,
      fontSize: 14,
      color: '#666',
    },
    modalCancelButton: {
      borderTopWidth: 1,
      borderTopColor: '#E5E5E5',
      paddingTop: 16,
      alignItems: 'center',
    },
    modalCancelText: {
      color: '#666',
      fontSize: 16,
      fontWeight: '500',
    },
    journalSelector: {
      marginTop: 16,
      marginBottom: 16, 
    },
    journalLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: '#666',
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    journalScrollContent: {
      paddingRight: 16,
    },
    journalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginRight: 8,
      gap: 4,
    },
    journalButtonActive: {
      backgroundColor: '#e16b5c',
    },
    journalButtonText: {
      fontSize: 14,
      color: '#666',
    },
    journalButtonTextActive: {
      color: '#FFFFFF',
    },
  });

  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = async () => {
    try {
      const userJournals = await journalsService.getJournals();
      setJournals(userJournals);
    } catch (error) {
      console.error('Error al cargar bitácoras:', error);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate) {
        if (datePickerStep === 'date') {
          // Actualizar la fecha y cambiar al paso de hora
          const newDate = new Date(date);
          newDate.setFullYear(selectedDate.getFullYear());
          newDate.setMonth(selectedDate.getMonth());
          newDate.setDate(selectedDate.getDate());
          setDate(newDate);
          setDatePickerStep('time');
        } else if (datePickerStep === 'time') {
          // Actualizar la hora y cerrar el picker
          const newDate = new Date(date);
          newDate.setHours(selectedDate.getHours());
          newDate.setMinutes(selectedDate.getMinutes());
          setDate(newDate);
          setShowDatePicker(false);
        }
      } else if (event.type === 'dismissed') {
        // Si se cancela, cerrar el picker
        setShowDatePicker(false);
      }
    } else {
      // En iOS, actualizar la fecha y cerrar el modal
      if (selectedDate) {
        setDate(selectedDate);
      }
      setShowDateModal(false);
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      setDatePickerStep('date');
      setShowDatePicker(true);
    } else {
      setShowDateModal(true);
    }
  };

  const getDateOptions = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    return [
      { label: 'Hoy', date: today },
      { label: 'Ayer', date: yesterday },
      { label: 'Última semana', date: lastWeek },
      { label: 'Último mes', date: lastMonth },
    ];
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setDate(newDate);
  };

  const handleMetadataChange = (fieldId: string, value: string) => {
    setMetadata(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleDatePickerClose = () => {
    setShowDateModal(false);
    setDatePickerStep('date');
  };

  // Solicitar permisos al cargar el componente
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
      if (audioPlayer.current) {
        audioPlayer.current.unloadAsync();
      }
    };
  }, []);

  // Función para seleccionar imagen de la galería
  const pickImage = async () => {
    if (mediaFiles.filter(f => f.type === 'image').length >= 3) {
      Alert.alert('Solo puedes subir hasta 3 imágenes');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaFiles(prev => [...prev, {
        uri: result.assets[0].uri,
        type: 'image'
      }]);
    }
  };

  // Función para tomar foto con la cámara
  const takePhoto = async () => {
    try {
      if (!hasPermission) {
        Alert.alert('Permiso denegado', 'Se requiere permiso para acceder a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setMediaFiles(prev => [...prev, {
          uri: result.assets[0].uri,
          type: 'image'
        }]);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Función para iniciar grabación de audio
  const startAudioRecording = async () => {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permiso denegado',
            'Se requiere permiso para acceder al micrófono para grabar audio.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Configuración', 
                onPress: () => Linking.openSettings() 
              }
            ]
          );
          return;
        }
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      audioRecording.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 60) {
            stopAudioRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error al iniciar grabación de audio:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación de audio. Por favor, intenta de nuevo.');
    }
  };

  // Función para detener grabación de audio
  const stopAudioRecording = async () => {
    try {
      if (!audioRecording.current) return;
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      
      await audioRecording.current.stopAndUnloadAsync();
      const uri = audioRecording.current.getURI();
      
      if (uri) {
        setMediaFiles(prev => [...prev, {
          uri: uri,
          type: 'audio'
        }]);
        
        // Cargar el audio para reproducirlo
        await loadAudioForPlayback(uri);
      }
      
      audioRecording.current = null;
      setIsRecording(false);
    } catch (error) {
      console.error('Error al detener grabación de audio:', error);
      Alert.alert('Error', 'No se pudo detener la grabación de audio');
    }
  };

  // Función para cargar el audio para reproducción
  const loadAudioForPlayback = async (uri: string) => {
    try {
      // Detener cualquier reproducción en curso
      if (audioPlayer.current) {
        await audioPlayer.current.unloadAsync();
        audioPlayer.current = null;
      }
      
      // Cargar el nuevo audio
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      audioPlayer.current = sound;
      setIsPlayingAudio(false);
      setAudioPosition(0);
    } catch (error) {
      console.error('Error al cargar audio para reproducción:', error);
    }
  };

  // Función para actualizar el estado de reproducción
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setAudioDuration(status.durationMillis / 1000);
      setAudioPosition(status.positionMillis / 1000);
      
      if (status.didJustFinish) {
        setIsPlayingAudio(false);
        if (playbackTimer.current) {
          clearInterval(playbackTimer.current);
          playbackTimer.current = null;
        }
      }
    }
  };

  // Función para reproducir/pausar audio
  const toggleAudioPlayback = async () => {
    if (!audioPlayer.current) return;
    
    if (isPlayingAudio) {
      await audioPlayer.current.pauseAsync();
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
        playbackTimer.current = null;
      }
    } else {
      await audioPlayer.current.playAsync();
      // Iniciar temporizador para actualizar la posición
      playbackTimer.current = setInterval(() => {
        audioPlayer.current?.getStatusAsync().then(status => {
          if (status.isLoaded) {
            setAudioPosition(status.positionMillis / 1000);
          }
        });
      }, 100);
    }
    
    setIsPlayingAudio(!isPlayingAudio);
  };

  // Función para cambiar la posición del audio
  const seekAudio = async (position: number) => {
    if (!audioPlayer.current) return;
    
    await audioPlayer.current.setPositionAsync(position * 1000);
    setAudioPosition(position);
  };

  // Función para formatear tiempo en segundos a formato mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Función para eliminar el audio grabado
  const removeAudio = () => {
    if (audioPlayer.current) {
      audioPlayer.current.unloadAsync();
      audioPlayer.current = null;
    }
    setMediaFiles(prev => prev.filter(f => f.type !== 'audio'));
    setIsPlayingAudio(false);
    setAudioPosition(0);
    setAudioDuration(0);
    
    // Eliminar de metadata
    const newMetadata = { ...metadata };
    delete newMetadata.audio_url;
    setMetadata(newMetadata);
  };

  // Función para iniciar grabación de video
  const startVideoRecording = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMediaFiles(prev => [...prev, {
          uri: result.assets[0].uri,
          type: 'video'
        }]);
        setMetadata(prev => ({
          ...prev,
          video_url: result.assets[0].uri
        }));
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error al grabar video:', error);
      Alert.alert('Error', 'No se pudo grabar el video');
    }
  };

  // Función para detener grabación de video
  const stopVideoRecording = async () => {
    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      setIsVideoRecording(false);
    } catch (error) {
      console.error('Error al detener grabación de video:', error);
      Alert.alert('Error', 'No se pudo detener la grabación de video');
    }
  };

  // Función para seleccionar video de la galería
  const pickVideo = async () => {
    if (mediaFiles.some(f => f.type === 'video')) {
      Alert.alert('Solo puedes subir un video');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setMediaFiles(prev => [...prev, {
        uri: result.assets[0].uri,
        type: 'video'
      }]);
      // Crear un objeto File a partir de la URI
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const file = new File([blob], 'video.mp4', { type: 'video/mp4' });
      
      // Actualizar metadata con el video
      setMetadata(prev => ({
        ...prev,
        video_url: result.assets[0].uri,
      }));
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const eventData = {
        title,
        type: 'mixed',
        event_date: date.toISOString(),
        category: selectedCategories[0] || 'life-diary',
        media: mediaFiles,
        description: description.trim() || undefined,
        ...(selectedJournalId && { shared_journal_id: selectedJournalId }),
      };

      const response = await eventsService.createEvent(eventData);
      
      if (response) {
        // Navegar al detalle del evento creado
        router.replace(`/event/${response.id}`);
      }
    } catch (error) {
      console.error('Error al crear el evento:', error);
      Alert.alert('Error', 'No se pudo crear el evento. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Navegar al inicio
    router.replace('/');
  };

  const getSelectedTypeLabel = () => {
    return EVENT_TYPES.find(t => t.id === type)?.label || 'Seleccionar tipo';
  };

  const getSelectedCategoryLabel = () => {
    return EVENT_CATEGORIES.find(c => c.id === category)?.label || 'Seleccionar categoría';
  };

  // Efecto para actualizar la fecha cuando se selecciona el tipo "tiempo"
  useEffect(() => {
    if (type === 'time') {
      setDate(new Date());
    }
  }, [type]);

  const renderTypeSpecificFields = () => {
    const fields = EVENT_TYPE_FIELDS[type as keyof typeof EVENT_TYPE_FIELDS] || [];
    
    if (type === 'image') {
      return (
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Imagen *</Text>
          <View style={styles.mediaContainer}>
            {imageUri ? (
              <View style={styles.mediaPreview}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mediaOptions}>
                <TouchableOpacity
                  style={[styles.mediaOption, { backgroundColor: colors.card }]}
                  onPress={() => setShowImageModal(true)}
                >
                  <Ionicons name="images-outline" size={24} color={colors.text} />
                  <Text style={[styles.mediaOptionText, { color: colors.text }]}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    }
    
    if (type === 'audio') {
      return (
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Audio (WAV) *</Text>
          <View style={styles.mediaContainer}>
            {audioUri ? (
              <View style={styles.mediaPreview}>
                <View style={[styles.audioPreview, { backgroundColor: colors.card }]}>
                  <View style={styles.audioPlayerContainer}>
                    <TouchableOpacity
                      style={styles.audioPlayButton}
                      onPress={toggleAudioPlayback}
                    >
                      <Ionicons 
                        name={isPlayingAudio ? "pause-circle" : "play-circle"} 
                        size={32} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                    
                    <View style={styles.audioControls}>
                      <Text style={[styles.audioTimeText, { color: colors.text }]}>
                        {formatTime(audioPosition)} / {formatTime(audioDuration)}
                      </Text>
                      
                      <View style={styles.audioProgressContainer}>
                        <View 
                          style={[
                            styles.audioProgress, 
                            { width: `${(audioPosition / audioDuration) * 100}%` }
                          ]} 
                        />
                      </View>
                      
                      <View style={styles.audioSeekButtons}>
                        <TouchableOpacity 
                          style={styles.audioSeekButton}
                          onPress={() => seekAudio(Math.max(0, audioPosition - 10))}
                        >
                          <Ionicons name="play-back" size={20} color={colors.text} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.audioSeekButton}
                          onPress={() => seekAudio(Math.min(audioDuration, audioPosition + 10))}
                        >
                          <Ionicons name="play-forward" size={20} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={removeAudio}
                >
                  <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mediaOptions}>
                <TouchableOpacity
                  style={[styles.mediaOption, { backgroundColor: colors.card }]}
                  onPress={() => {
                    Alert.alert(
                      'Imágenes',
                      '¿Qué deseas hacer?',
                      [
                        {
                          text: 'Galería',
                          onPress: pickImage
                        },
                        {
                          text: 'Cámara',
                          onPress: takePhoto
                        },
                        {
                          text: 'Cancelar',
                          style: 'cancel'
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="images-outline" size={24} color={colors.text} />
                  <Text style={[styles.mediaOptionText, { color: colors.text }]}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {isRecording && (
            <Text style={[styles.recordingInfo, { color: colors.text }]}>
              Máximo 1 minuto de grabación
            </Text>
          )}
        </View>
      );
    }
    
    if (type === 'video') {
      return (
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Video *</Text>
          <View style={styles.mediaContainer}>
            {videoUri ? (
              <View style={styles.mediaPreview}>
                <View style={[styles.videoPreview, { backgroundColor: colors.card }]}>
                  <Video
                    source={{ uri: videoUri }}
                    style={styles.videoPreview}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                  />
                </View>
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => {
                    setVideoUri(null);
                    setMetadata(prev => {
                      const newMetadata = { ...prev };
                      delete newMetadata.video_url;
                      return newMetadata;
                    });
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mediaOptions}>
                <TouchableOpacity
                  style={[styles.mediaOption, { backgroundColor: colors.card }]}
                  onPress={() => setShowVideoModal(true)}
                >
                  <Ionicons name="videocam-outline" size={24} color={colors.text} />
                  <Text style={[styles.mediaOptionText, { color: colors.text }]}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    }
    
    if (type === 'time') {
      return (
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Fecha y Hora *</Text>
          <TouchableOpacity
            style={[styles.input, { 
              backgroundColor: '#FFFFFF',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#E5E5E5',
              borderRadius: 8,
              minHeight: 48,
            }]}
            onPress={openDatePicker}
          >
            <Text style={{ color: '#202024', fontSize: 16 }}>
              {format(date, "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      );
    }
    
    return fields.map((field) => (
      <View key={field.id} style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          {field.label} {field.required ? '*' : ''}
        </Text>
        {field.type === 'textarea' ? (
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
            value={metadata[field.id] || ''}
            onChangeText={(value) => handleMetadataChange(field.id, value)}
            placeholder={`Ingresa ${field.label.toLowerCase()}`}
            placeholderTextColor={colors.text + '80'}
            multiline
            numberOfLines={4}
          />
        ) : (
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={metadata[field.id] || ''}
            onChangeText={(value) => handleMetadataChange(field.id, value)}
            placeholder={`Ingresa ${field.label.toLowerCase()}`}
            placeholderTextColor={colors.text + '80'}
          />
        )}
      </View>
    ));
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
      <View style={[
        styles.header, 
        Platform.OS === 'ios' && { paddingTop: 48 }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
        >
          <Ionicons name="arrow-back" size={24} color="#202024" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.input, { 
            backgroundColor: '#FFFFFF',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#E5E5E5',
            borderRadius: 8,
            minHeight: 48,
            flex: 1,
            marginHorizontal: 12,
          }]}
          onPress={openDatePicker}
        >
          <Text style={{ color: '#202024', fontSize: 16 }}>
            {format(date, "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.backButton, { opacity: isLoading ? 0.5 : 1 }]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#202024" />
          ) : (
            <Text style={{ color: '#202024', fontWeight: '600' }}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={[styles.content, { paddingBottom: 20 }]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.inputContainer, { marginBottom: 16 }]}>
          <View style={styles.categorySelector}>
            <Text style={styles.categoryLabel}>Categoría</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {EVENT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategories.includes(category.id) && styles.categoryButtonActive
                  ]}
                  onPress={() => {
                    if (selectedCategories.includes(category.id)) {
                      setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                    } else {
                      setSelectedCategories([...selectedCategories, category.id]);
                    }
                  }}
                >
                  <Ionicons 
                    name={category.icon as any} 
                    size={16} 
                    color={selectedCategories.includes(category.id) ? '#FFFFFF' : '#666'} 
                  />
                  <Text 
                    style={[
                      styles.categoryButtonText,
                      selectedCategories.includes(category.id) && styles.categoryButtonTextActive
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.journalSelector}>
            <Text style={styles.journalLabel}>Bitácora (opcional)</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.journalScrollContent}
            >
              {journals.map((journal) => (
                <TouchableOpacity
                  key={journal.id}
                  style={[
                    styles.journalButton,
                    selectedJournalId === journal.id && styles.journalButtonActive
                  ]}
                  onPress={() => {
                    if (selectedJournalId === journal.id) {
                      setSelectedJournalId(null);
                      setUseJournal(false);
                    } else {
                      setSelectedJournalId(journal.id);
                      setUseJournal(true);
                    }
                  }}
                >
                  <Ionicons 
                    name="book-outline" 
                    size={16} 
                    color={selectedJournalId === journal.id ? '#FFFFFF' : '#666'} 
                  />
                  <Text 
                    style={[
                      styles.journalButtonText,
                      selectedJournalId === journal.id && styles.journalButtonTextActive
                    ]}
                  >
                    {journal.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TextInput
            style={[styles.titleInput]}
            placeholder="¿Qué sucedió?"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />
          
          <View style={{ height: 1, backgroundColor: '#E5E5E5', marginVertical: 12 }} />
          
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Describe tu evento..."
          />

          <View style={[styles.mediaButtonsContainer, { marginTop: 16 }]}>
            {/* Mostrar solo el audio arriba */}
            {mediaFiles.some(f => f.type === 'audio') && (
              <View style={styles.mediaPreviewsContainer}>
                {mediaFiles.map((file, index) => {
                  if (file.type === 'audio') {
                    return (
                      <View key={index} style={styles.audioPreviewContainer}>
                        <View style={styles.audioPlayerContainer}>
                          <TouchableOpacity 
                            style={styles.audioPlayButton}
                            onPress={toggleAudioPlayback}
                          >
                            <Ionicons 
                              name={isPlayingAudio ? "pause-circle" : "play-circle"} 
                              size={32} 
                              color="#e16b5c" 
                            />
                          </TouchableOpacity>
                          <View style={styles.audioControls}>
                            <Text style={styles.audioTimeText}>
                              {formatTime(audioPosition)} / {formatTime(audioDuration)}
                            </Text>
                            <View style={styles.audioProgressContainer}>
                              <View 
                                style={[
                                  styles.audioProgress, 
                                  { width: `${(audioPosition / audioDuration) * 100}%` }
                                ]} 
                              />
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeMedia(index)}
                          >
                            <Ionicons name="close-circle" size={24} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
            )}

            <View style={styles.mediaButtons}>
              <TouchableOpacity 
                style={[
                  styles.mediaButton,
                  mediaFiles.some(f => f.type === 'image') && styles.mediaButtonActive
                ]} 
                onPress={() => setShowImageModal(true)}
              >
                <Ionicons 
                  name="images" 
                  size={20} 
                  color={mediaFiles.some(f => f.type === 'image') ? '#e16b5c' : '#666'} 
                />
                <Text style={styles.mediaButtonText}>Imágenes</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.mediaButton,
                  mediaFiles.some(f => f.type === 'video') && styles.mediaButtonActive
                ]} 
                onPress={() => setShowVideoModal(true)}
              >
                <Ionicons 
                  name="videocam" 
                  size={20} 
                  color={mediaFiles.some(f => f.type === 'video') ? '#e16b5c' : '#666'} 
                />
                <Text style={styles.mediaButtonText}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.mediaButton,
                  isRecording && styles.mediaButtonActive
                ]} 
                onPress={isRecording ? stopAudioRecording : startAudioRecording}
              >
                <Ionicons 
                  name={isRecording ? "stop-circle" : "mic"} 
                  size={20} 
                  color={isRecording ? '#e16b5c' : '#666'} 
                />
                <Text style={styles.mediaButtonText}>
                  {isRecording ? 'Detener' : 'Audio'}
                </Text>
              </TouchableOpacity>
            </View>

            {isRecording && (
              <View style={styles.recordingIndicator}>
                <Ionicons name="radio-button-on" size={16} color="#FF3B30" />
                <Text style={styles.recordingText}>
                  Grabando ({recordingDuration}s)
                </Text>
              </View>
            )}

            {/* Mostrar imágenes y videos debajo de los botones */}
            {(mediaFiles.some(f => f.type === 'image') || mediaFiles.some(f => f.type === 'video')) && (
              <View style={styles.mediaPreviewsContainer}>
                <View style={styles.mediaPreviewGrid}>
                  {mediaFiles.map((file, index) => {
                    if (file.type === 'image') {
                      return (
                        <View key={index} style={styles.mediaPreviewItem}>
                          <Image 
                            source={{ uri: file.uri }} 
                            style={styles.mediaPreview}
                          />
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeMedia(index)}
                          >
                            <Ionicons name="close-circle" size={24} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      );
                    }

                    if (file.type === 'video') {
                      return (
                        <View key={index} style={styles.mediaPreviewItem}>
                          <Video
                            source={{ uri: file.uri }}
                            style={styles.mediaPreview}
                            useNativeControls
                            resizeMode={ResizeMode.COVER}
                          />
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeMedia(index)}
                          >
                            <Ionicons name="close-circle" size={24} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      );
                    }
                    return null;
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Reemplazar el modal por el picker directo */}
      {Platform.OS === 'android' && showDatePicker && (
        <CustomDateTimePicker
          value={date}
          onChange={handleDateChange}
          show={showDatePicker}
          mode={datePickerStep}
        />
      )}

      {/* Mantener el modal solo para iOS */}
      {Platform.OS === 'ios' && showDateModal && (
        <Modal
          visible={showDateModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDateModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Fecha y Hora</Text>
                <TouchableOpacity onPress={() => setShowDateModal(false)}>
                  <Text style={styles.modalCloseButton}>×</Text>
                </TouchableOpacity>
              </View>
              <CustomDateTimePicker
                value={date}
                onChange={handleDateChange}
                show={showDateModal}
              />
            </View>
          </View>
        </Modal>
      )}

      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Imágenes</Text>
            <View style={styles.modalOptions}>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => {
                  setShowImageModal(false);
                  pickImage();
                }}
              >
                <Ionicons name="images-outline" size={24} color="#666" />
                <Text style={styles.modalOptionText}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => {
                  setShowImageModal(false);
                  takePhoto();
                }}
              >
                <Ionicons name="camera-outline" size={24} color="#666" />
                <Text style={styles.modalOptionText}>Cámara</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowImageModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showVideoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Video</Text>
            <View style={styles.modalOptions}>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => {
                  setShowVideoModal(false);
                  pickVideo();
                }}
              >
                <Ionicons name="videocam-outline" size={24} color="#666" />
                <Text style={styles.modalOptionText}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => {
                  setShowVideoModal(false);
                  startVideoRecording();
                }}
              >
                <Ionicons name="recording-outline" size={24} color="#666" />
                <Text style={styles.modalOptionText}>Grabar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowVideoModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showJournalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJournalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Bitácora</Text>
            <ScrollView style={styles.journalList}>
              {journals.map((journal) => (
                <TouchableOpacity
                  key={journal.id}
                  style={[
                    styles.journalItem,
                    selectedJournalId === journal.id && styles.journalItemActive
                  ]}
                  onPress={() => {
                    setSelectedJournalId(journal.id);
                    setUseJournal(true);
                    setShowJournalModal(false);
                  }}
                >
                  <Text style={[
                    styles.journalItemText,
                    selectedJournalId === journal.id && styles.journalItemTextActive
                  ]}>
                    {journal.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowJournalModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
} 