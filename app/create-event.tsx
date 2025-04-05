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
import { Camera } from 'expo-camera';
import { Video } from 'expo-av';

// Tipos de eventos disponibles
const EVENT_TYPES = [
  { id: 'text', icon: 'text', label: 'Texto' },
  { id: 'image', icon: 'image', label: 'Imagen' },
  { id: 'audio', icon: 'mic', label: 'Audio' },
  { id: 'video', icon: 'videocam', label: 'Video' },
  { id: 'mixed', icon: 'albums', label: 'Mixto' },
  { id: 'time', icon: 'time', label: 'Tiempo' },
];

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

export default function CreateEventScreen() {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('text');
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
  
  // Referencias
  const audioRecording = useRef<Audio.Recording | null>(null);
  const videoRecording = useRef<Camera | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  const dynamicStyles = StyleSheet.create({
    timePickerContainer: {
      padding: 20,
    },
    timePickerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    timePickerControls: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    timePickerColumn: {
      flex: 1,
      alignItems: 'center',
    },
    timePickerLabel: {
      fontSize: 16,
      marginBottom: 8,
    },
    timePickerScroll: {
      height: 200,
    },
    timePickerOption: {
      padding: 12,
      borderRadius: 8,
      marginVertical: 4,
      width: '100%',
      alignItems: 'center',
    },
    timePickerOptionText: {
      fontSize: 16,
    },
    timePickerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    datePickerBackButton: {
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    datePickerBackButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    confirmButton: {
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      flex: 1,
      marginLeft: 10,
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    nextButton: {
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
    },
    nextButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
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

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    setDatePickerStep('time');
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
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      const { status: imagePickerStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || audioStatus !== 'granted' || imagePickerStatus !== 'granted') {
        Alert.alert('Permisos necesarios', 'Se requieren permisos para acceder a la cámara, micrófono y galería');
      }
    })();
  }, []);

  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

  // Función para seleccionar imagen de la galería
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        // Crear un objeto File a partir de la URI
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        
        // Actualizar metadata con la imagen
        setMetadata(prev => ({
          ...prev,
          image_url: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para tomar foto con la cámara
  const takePhoto = async () => {
    try {
      if (videoRecording.current) {
        const photo = await videoRecording.current.takePictureAsync();
        setImageUri(photo.uri);
        // Crear un objeto File a partir de la URI
        const response = await fetch(photo.uri);
        const blob = await response.blob();
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        
        // Actualizar metadata con la imagen
        setMetadata(prev => ({
          ...prev,
          image_url: photo.uri,
        }));
        
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      audioRecording.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Iniciar temporizador para limitar la duración a 1 minuto
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
      Alert.alert('Error', 'No se pudo iniciar la grabación de audio');
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
        setAudioUri(uri);
        // Crear un objeto File a partir de la URI
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], 'audio.m4a', { type: 'audio/m4a' });
        
        // Actualizar metadata con el audio
        setMetadata(prev => ({
          ...prev,
          audio_url: uri,
        }));
      }
      
      audioRecording.current = null;
      setIsRecording(false);
    } catch (error) {
      console.error('Error al detener grabación de audio:', error);
      Alert.alert('Error', 'No se pudo detener la grabación de audio');
    }
  };

  // Función para iniciar grabación de video
  const startVideoRecording = async () => {
    try {
      if (videoRecording.current) {
        setIsVideoRecording(true);
        setVideoDuration(0);
        
        // Iniciar temporizador para limitar la duración a 1 minuto
        recordingTimer.current = setInterval(() => {
          setVideoDuration(prev => {
            if (prev >= 60) {
              stopVideoRecording();
              return 60;
            }
            return prev + 1;
          });
        }, 1000);
        
        const video = await videoRecording.current.recordAsync({
          maxDuration: 60,
        });
        
        setVideoUri(video.uri);
        // Crear un objeto File a partir de la URI
        const response = await fetch(video.uri);
        const blob = await response.blob();
        const file = new File([blob], 'video.mp4', { type: 'video/mp4' });
        
        // Actualizar metadata con el video
        setMetadata(prev => ({
          ...prev,
          video_url: video.uri,
        }));
        
        setIsVideoRecording(false);
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
      
      if (videoRecording.current) {
        await videoRecording.current.stopRecording();
        setIsVideoRecording(false);
      }
    } catch (error) {
      console.error('Error al detener grabación de video:', error);
      Alert.alert('Error', 'No se pudo detener la grabación de video');
    }
  };

  // Función para seleccionar video de la galería
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri);
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
    } catch (error) {
      console.error('Error al seleccionar video:', error);
      Alert.alert('Error', 'No se pudo seleccionar el video');
    }
  };

  const handleSubmit = async () => {
    if (!title || !type || !category) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    // Validar campos requeridos del tipo de evento solo si no es de tipo tiempo
    if (type !== 'time') {
      const requiredFields = EVENT_TYPE_FIELDS[type as keyof typeof EVENT_TYPE_FIELDS]?.filter(field => field.required) || [];
      const missingFields = requiredFields.filter(field => !metadata[field.id]);
      
      if (missingFields.length > 0) {
        Alert.alert('Error', `Por favor completa los campos requeridos: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }
    }

    try {
      setIsLoading(true);

      const eventData: CreateEventData = {
        title,
        description: description.trim() || undefined,
        type,
        category,
        event_date: date.toISOString(),
        metadata: type === 'time' ? { time: date.toISOString() } : (Object.keys(metadata).length > 0 ? metadata : undefined),
      };

      // Solo agregar journal_id si se ha seleccionado una bitácora
      if (useJournal && selectedJournalId) {
        eventData.journal_id = selectedJournalId;
      }

      // Agregar archivos según el tipo de evento
      if (type === 'image' && imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        eventData.media = [file];
      } else if (type === 'audio' && audioUri) {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        const file = new File([blob], 'audio.m4a', { type: 'audio/m4a' });
        eventData.media = [file];
      } else if (type === 'video' && videoUri) {
        const response = await fetch(videoUri);
        const blob = await response.blob();
        const file = new File([blob], 'video.mp4', { type: 'video/mp4' });
        eventData.media = [file];
      }

      console.log(eventData);
      const newEvent = await eventsService.createEvent(eventData);
      
      if (!newEvent) {
        throw new Error('No se pudo crear el evento');
      }

      Alert.alert('Éxito', 'Evento creado correctamente', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error al crear evento:', error);
      Alert.alert('Error', 'No se pudo crear el evento');
    } finally {
      setIsLoading(false);
    }
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
                  onPress={pickImage}
                >
                  <Ionicons name="images" size={24} color={colors.text} />
                  <Text style={[styles.mediaOptionText, { color: colors.text }]}>Galería</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.mediaOption, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setCameraType('photo');
                    setShowCamera(true);
                  }}
                >
                  <Ionicons name="camera" size={24} color={colors.text} />
                  <Text style={[styles.mediaOptionText, { color: colors.text }]}>Cámara</Text>
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
          <Text style={[styles.label, { color: colors.text }]}>Audio *</Text>
          <View style={styles.mediaContainer}>
            {audioUri ? (
              <View style={styles.mediaPreview}>
                <View style={[styles.audioPreview, { backgroundColor: colors.card }]}>
                  <Ionicons name="musical-note" size={24} color={colors.text} />
                  <Text style={[styles.audioPreviewText, { color: colors.text }]}>Audio grabado</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => setAudioUri(null)}
                >
                  <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mediaOptions}>
                <TouchableOpacity
                  style={[styles.mediaOption, { backgroundColor: colors.card }]}
                  onPress={isRecording ? stopAudioRecording : startAudioRecording}
                >
                  <Ionicons name={isRecording ? "stop-circle" : "mic"} size={24} color={isRecording ? "red" : colors.text} />
                  <Text style={[styles.mediaOptionText, { color: colors.text }]}>
                    {isRecording ? `Grabando (${recordingDuration}s)` : 'Grabar Audio'}
                  </Text>
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
                  <Ionicons name="videocam" size={24} color={colors.text} />
                  <Text style={[styles.videoPreviewText, { color: colors.text }]}>Video grabado</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => setVideoUri(null)}
                >
                  <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mediaOptions}>
                <TouchableOpacity
                  style={[styles.mediaOption, { backgroundColor: colors.card }]}
                  onPress={pickVideo}
                >
                  <Ionicons name="videocam" size={24} color={colors.text} />
                  <Text style={[styles.mediaOptionText, { color: colors.text }]}>Galería</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.mediaOption, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setCameraType('video');
                    setShowCamera(true);
                  }}
                >
                  <Ionicons name="videocam" size={24} color={colors.text} />
                  <Text style={[styles.mediaOptionText, { color: colors.text }]}>Grabar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {isVideoRecording && (
            <Text style={[styles.recordingInfo, { color: colors.text }]}>
              Grabando... ({videoDuration}s)
            </Text>
          )}
        </View>
      );
    }
    
    if (type === 'time') {
      return (
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Fecha y Hora *</Text>
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: colors.card }]}
            onPress={() => setShowDateModal(true)}
          >
            <Text style={[styles.selectButtonText, { color: colors.text }]}>
              {format(date, "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.text} />
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
    <SafeAreaView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#202024" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#202024' }]}>
          Crear Evento
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: '#202024' }]}>Título *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#e7d3c1', color: '#202024' }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Título del evento"
            placeholderTextColor="#20202480"
          />
        </View>

        {/* Solo mostrar el campo de descripción si el tipo NO es "texto" */}
        {type !== 'text' && (
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
        )}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: '#202024' }]}>Tipo de Evento *</Text>
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: '#e7d3c1' }]}
            onPress={() => setShowTypeModal(true)}
          >
            <Text style={[styles.selectButtonText, { color: '#202024' }]}>
              {getSelectedTypeLabel()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#202024" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: '#202024' }]}>Categoría *</Text>
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: '#e7d3c1' }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[styles.selectButtonText, { color: '#202024' }]}>
              {getSelectedCategoryLabel()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#202024" />
          </TouchableOpacity>
        </View>

        {/* Solo mostrar el campo de fecha y hora si el tipo NO es "tiempo" */}
        {type !== 'time' && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: '#202024' }]}>Fecha y Hora *</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: '#e7d3c1' }]}
              onPress={() => setShowDateModal(true)}
            >
              <Text style={[styles.selectButtonText, { color: '#202024' }]}>
                {format(date, "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#202024" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={[styles.label, { color: '#202024' }]}>Agregar a una bitácora</Text>
            <Switch
              value={useJournal}
              onValueChange={setUseJournal}
              trackColor={{ false: '#e7d3c1', true: '#e16b5c80' }}
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

        {/* Campos específicos según el tipo de evento */}
        {renderTypeSpecificFields()}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: '#e16b5c' }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Crear Evento</Text>
          )}
        </TouchableOpacity>

        {/* Modal de selección de tipo */}
        <Modal
          visible={showTypeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: '#f7f5f2' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: '#202024' }]}>Seleccionar Tipo</Text>
                <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                  <Ionicons name="close" size={24} color="#202024" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {EVENT_TYPES.map((eventType) => (
                  <TouchableOpacity
                    key={eventType.id}
                    style={[
                      styles.modalOption,
                      { backgroundColor: '#e7d3c1' },
                      type === eventType.id && { borderColor: '#e16b5c', borderWidth: 2 }
                    ]}
                    onPress={() => {
                      setType(eventType.id);
                      setShowTypeModal(false);
                    }}
                  >
                    <Ionicons 
                      name={eventType.icon as any} 
                      size={24} 
                      color={type === eventType.id ? '#e16b5c' : '#202024'} 
                    />
                    <Text 
                      style={[
                        styles.modalOptionText, 
                        { color: type === eventType.id ? '#e16b5c' : '#202024' }
                      ]}
                    >
                      {eventType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de selección de categoría */}
        <Modal
          visible={showCategoryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: '#f7f5f2' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: '#202024' }]}>Seleccionar Categoría</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Ionicons name="close" size={24} color="#202024" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {EVENT_CATEGORIES.map((eventCategory) => (
                  <TouchableOpacity
                    key={eventCategory.id}
                    style={[
                      styles.modalOption,
                      { backgroundColor: '#e7d3c1' },
                      category === eventCategory.id && { borderColor: '#e16b5c', borderWidth: 2 }
                    ]}
                    onPress={() => {
                      setCategory(eventCategory.id);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Ionicons 
                      name={eventCategory.icon as any} 
                      size={24} 
                      color={category === eventCategory.id ? '#e16b5c' : '#202024'} 
                    />
                    <Text 
                      style={[
                        styles.modalOptionText, 
                        { color: category === eventCategory.id ? '#e16b5c' : '#202024' }
                      ]}
                    >
                      {eventCategory.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
          <Modal
            visible={showCamera}
            transparent={false}
            animationType="slide"
            onRequestClose={() => setShowCamera(false)}
          >
            <View style={styles.cameraContainer}>
              <Camera
                ref={videoRecording}
                style={styles.camera}
                type={Camera.Constants.Type.back}
              >
                <View style={styles.cameraControls}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowCamera(false)}
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                  
                  {cameraType === 'photo' ? (
                    <TouchableOpacity
                      style={styles.captureButton}
                      onPress={takePhoto}
                    >
                      <Ionicons name="camera" size={32} color="white" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.captureButton}
                      onPress={isVideoRecording ? stopVideoRecording : startVideoRecording}
                    >
                      <Ionicons
                        name={isVideoRecording ? "stop-circle" : "videocam"}
                        size={32}
                        color={isVideoRecording ? "red" : "white"}
                      />
                    </TouchableOpacity>
                  )}
                  
                  {isVideoRecording && (
                    <Text style={styles.recordingText}>
                      Grabando... ({videoDuration}s)
                    </Text>
                  )}
                </View>
              </Camera>
            </View>
          </Modal>
        )}
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
    flex: 1,
    padding: 20,
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  journalButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  journalButtonText: {
    fontSize: 14,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  modalOptions: {
    maxHeight: '80%',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  datePickerContainer: {
    padding: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 16,
  },
  metadataField: {
    marginBottom: 16,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  datePickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timePickerContainer: {
    padding: 20,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timePickerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  timePickerScroll: {
    height: 200,
  },
  timePickerOption: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    width: '100%',
    alignItems: 'center',
  },
  timePickerOptionText: {
    fontSize: 16,
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  datePickerBackButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  datePickerBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaContainer: {
    marginTop: 8,
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mediaOption: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '45%',
  },
  mediaOptionText: {
    marginTop: 8,
    fontSize: 14,
  },
  mediaPreview: {
    position: 'relative',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  audioPreviewText: {
    marginLeft: 8,
    fontSize: 16,
  },
  videoPreview: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  videoPreviewText: {
    marginLeft: 8,
    fontSize: 16,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  recordingInfo: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  captureButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  recordingText: {
    color: 'white',
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 4,
  },
}); 