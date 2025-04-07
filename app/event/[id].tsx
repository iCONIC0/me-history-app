import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image, Modal, Dimensions, FlatList } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { eventsService, Event } from '../../services/events';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Audio } from 'expo-av';
import { Video, ResizeMode } from 'expo-av';
import { 
  PinchGestureHandler, 
  PanGestureHandler, 
  State, 
  GestureHandlerRootView, 
  PinchGestureHandlerGestureEvent,
  PanGestureHandlerGestureEvent
} from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';

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

export default function EventDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'audio'>('images');
  
  // Estados para la visualización de medios
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<Record<number, boolean>>({});
  const videoRefs = useRef<Record<number, Video>>({});
  
  // Valores para el zoom y pan de imágenes
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const imageWidth = useSharedValue(0);
  const imageHeight = useSharedValue(0);
  const screenWidth = useSharedValue(Dimensions.get('window').width);
  const screenHeight = useSharedValue(Dimensions.get('window').height);

  useEffect(() => {
    loadEvent();
    return () => {
      // Limpiar recursos al desmontar
      if (sound) {
        sound.unloadAsync();
      }
      // Detener todos los videos
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.stopAsync();
        }
      });
      // Limpiar referencias
      videoRefs.current = {};
      setIsVideoPlaying({});
    };
  }, [id]);

  // Reemplazar el efecto que usa router.addListener
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Esta función se ejecuta cuando la pantalla pierde el foco
        stopAllMedia();
      };
    }, [sound, isPlaying])
  );

  // Función para detener todos los medios
  const stopAllMedia = async () => {
    // Detener audio
    if (sound && isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
    // Detener videos
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.stopAsync();
      }
    });
    setIsVideoPlaying({});
  };

  // Modificar la función de cambio de pestaña
  const handleTabChange = (tab: 'images' | 'videos' | 'audio') => {
    stopAllMedia();
    setActiveTab(tab);
  };

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      const data = await eventsService.getEvent(parseInt(id));
      if (!data) {
        throw new Error('Evento no encontrado');
      }
      setEvent(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar el evento');
      console.error('Error loading event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener la etiqueta traducida del tipo de evento
  const getEventTypeLabel = (typeId: string) => {
    return EVENT_TYPES.find(t => t.id === typeId)?.label || typeId;
  };

  // Función para obtener la etiqueta traducida de la categoría
  const getCategoryLabel = (categoryId: string) => {
    return CATEGORY_LABELS[categoryId] || categoryId;
  };

  // Función para formatear la fecha según el tipo de evento
  const formatEventDate = (event: Event) => {
    const dateToFormat = event.event_date || event.created_at;
    
    if (event.type === 'time') {
      // Para eventos de tipo "time", mostrar solo la hora
      return format(new Date(dateToFormat), "HH:mm", { locale: es });
    } else {
      // Para otros tipos de eventos, mostrar fecha y hora completas
      return format(new Date(dateToFormat), "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    }
  };

  // Función para abrir el modal de imagen
  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageModalVisible(true);
    // Reiniciar valores de zoom y pan
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Función para cerrar el modal de imagen
  const closeImageModal = () => {
    setIsImageModalVisible(false);
    setSelectedImageIndex(null);
    // Reiniciar valores de zoom y pan
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Manejador de gestos para el zoom
  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent, { startScale: number }>({
    onStart: (_, ctx) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      scale.value = Math.max(1, Math.min(5, ctx.startScale * event.scale));
    },
    onEnd: () => {
      savedScale.value = scale.value;
    },
  });

  // Manejador de gestos para el pan
  const panHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startX: number; startY: number }>({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      // Solo permitir pan si hay zoom
      if (scale.value > 1) {
        // Calcular límites de movimiento basados en el tamaño de la imagen y la escala
        const maxX = (imageWidth.value * scale.value - screenWidth.value) / 2;
        const maxY = (imageHeight.value * scale.value - screenHeight.value) / 2;
        
        // Aplicar límites al movimiento
        translateX.value = Math.min(maxX, Math.max(-maxX, ctx.startX + event.translationX));
        translateY.value = Math.min(maxY, Math.max(-maxY, ctx.startY + event.translationY));
      }
    },
    onEnd: () => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    },
  });

  // Estilo animado para el zoom y pan
  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Función para reiniciar el zoom y pan
  const resetZoom = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Función para medir el tamaño de la imagen
  const onImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    imageWidth.value = width;
    imageHeight.value = height;
  };

  // Función para reproducir audio
  const playAudio = async (audioUri: string) => {
    try {
      // Detener el audio actual si existe
      if (sound) {
        await sound.unloadAsync();
      }

      // Cargar y reproducir el nuevo audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error al reproducir audio:', error);
    }
  };

  // Función para actualizar el estado de reproducción
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setAudioDuration(status.durationMillis / 1000);
      setAudioPosition(status.positionMillis / 1000);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  // Función para pausar/reanudar audio
  const toggleAudioPlayback = async () => {
    if (!sound) return;
    
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Función para cambiar la posición del audio
  const seekAudio = async (position: number) => {
    if (!sound) return;
    
    await sound.setPositionAsync(position * 1000);
    setAudioPosition(position);
  };

  // Función para formatear tiempo en segundos a formato mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Función para reproducir/pausar video
  const toggleVideoPlayback = (mediaId: number) => {
    setIsVideoPlaying(prev => ({
      ...prev,
      [mediaId]: !prev[mediaId]
    }));
  };

  // Función para renderizar el componente de audio
  const renderAudioPlayer = (media: any) => {
    return (
      <View style={styles.audioContainer}>
        <TouchableOpacity 
          style={styles.audioPlayButton}
          onPress={() => playAudio(media.file_path)}
        >
          <Ionicons 
            name={isPlaying ? "pause-circle" : "play-circle"} 
            size={48} 
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
          
          <TouchableOpacity 
            style={styles.audioSeekButton}
            onPress={() => seekAudio(Math.max(0, audioPosition - 10))}
          >
            <Ionicons name="play-back" size={24} color="#e16b5c" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.audioSeekButton}
            onPress={() => seekAudio(Math.min(audioDuration, audioPosition + 10))}
          >
            <Ionicons name="play-forward" size={24} color="#e16b5c" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Función para renderizar el componente de video
  const renderVideoPlayer = (media: any, index: number) => {
    return (
      <View style={styles.videoContainer}>
        <Video
          ref={ref => {
            if (ref) videoRefs.current[media.id] = ref;
          }}
          source={{ uri: media.file_path }}
          style={styles.videoPlayer}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          shouldPlay={isVideoPlaying[media.id] || false}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsVideoPlaying(prev => ({
                ...prev,
                [media.id]: false
              }));
            }
          }}
        />
        <TouchableOpacity 
          style={styles.videoPlayButton}
          onPress={() => toggleVideoPlayback(media.id)}
        >
          <Ionicons 
            name={isVideoPlaying[media.id] ? "pause-circle" : "play-circle"} 
            size={48} 
            color="#e16b5c" 
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Función para filtrar medios por tipo
  const getFilteredMedia = (type: 'images' | 'videos' | 'audio') => {
    if (!event?.media) return [];
    
    return event.media.filter(media => {
      const fileExtension = media.file_path.split('.').pop()?.toLowerCase();
      switch (type) {
        case 'images':
          return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
        case 'videos':
          return ['mp4', 'mov', 'avi', 'webm'].includes(fileExtension || '');
        case 'audio':
          return ['mp3', 'wav', 'm4a', 'aac'].includes(fileExtension || '');
        default:
          return false;
      }
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
        <ActivityIndicator size="large" color="#e16b5c" />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
        <Text style={[styles.errorText, { color: '#FF3B30' }]}>
          {error || 'Evento no encontrado'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: '#e16b5c' }]}
          onPress={loadEvent}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#f7f5f2' }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#202024" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#202024' }]}>
          {event.title}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.eventInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#e16b5c" />
            <Text style={[styles.infoText, { color: '#202024' }]}>
              {formatEventDate(event)}
            </Text>
          </View>

          {event.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#e16b5c" />
              <Text style={[styles.infoText, { color: '#202024' }]}>
                {event.location}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={20} color="#e16b5c" />
            <Text style={[styles.infoText, { color: '#202024' }]}>
              {getEventTypeLabel(event.type)} - {getCategoryLabel(event.category)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#e16b5c" />
            <Text style={[styles.infoText, { color: '#202024' }]}>
              Creado por: {event.user?.name || 'Usuario desconocido'}
            </Text>
          </View>

          {event.shared_journal && (
            <View style={styles.infoRow}>
              <Ionicons name="book-outline" size={20} color="#e16b5c" />
              <Text style={[styles.infoText, { color: '#202024' }]}>
                Bitácora compartida: {event.shared_journal.name}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="eye-outline" size={20} color="#e16b5c" />
            <Text style={[styles.infoText, { color: '#202024' }]}>
              Visibilidad: {event.visibility === 'all' ? 'Todos' : 'Personalizado'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="journal-outline" size={20} color="#e16b5c" />
            <Text style={[styles.infoText, { color: '#202024' }]}>
              Incluido en bitácora personal: {event.include_in_personal_journal ? 'Sí' : 'No'}
            </Text>
          </View>

          {event.description && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionTitle, { color: '#202024' }]}>
                Descripción
              </Text>
              <Text style={[styles.description, { color: '#202024' }]}>
                {event.description}
              </Text>
            </View>
          )}
        </View>

        {event.media && event.media.length > 0 && (
          <View style={styles.mediaContainer}>
            <Text style={[styles.mediaTitle, { color: '#202024' }]}>
              Multimedia 
            </Text>
            
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'images' && styles.activeTab]}
                onPress={() => handleTabChange('images')}
              >
                <Ionicons 
                  name="images" 
                  size={20} 
                  color={activeTab === 'images' ? '#e16b5c' : '#666'} 
                />
                <Text style={[styles.tabText, activeTab === 'images' && styles.activeTabText]}>
                  Imágenes
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
                onPress={() => handleTabChange('videos')}
              >
                <Ionicons 
                  name="videocam" 
                  size={20} 
                  color={activeTab === 'videos' ? '#e16b5c' : '#666'} 
                />
                <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
                  Videos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'audio' && styles.activeTab]}
                onPress={() => handleTabChange('audio')}
              >
                <Ionicons 
                  name="musical-note" 
                  size={20} 
                  color={activeTab === 'audio' ? '#e16b5c' : '#666'} 
                />
                <Text style={[styles.tabText, activeTab === 'audio' && styles.activeTabText]}>
                  Audio
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'images' && getFilteredMedia('images').length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {getFilteredMedia('images').map((media, index) => (
                  <TouchableOpacity 
                    key={media.id} 
                    onPress={() => openImageModal(index)}
                  >
                    <Image
                      source={{ uri: media.file_path }}
                      style={styles.mediaThumbnail}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {activeTab === 'videos' && getFilteredMedia('videos').length > 0 && (
              <View>
                {getFilteredMedia('videos').map((media, index) => (
                  <View key={media.id} style={styles.videoContainer}>
                    {renderVideoPlayer(media, index)}
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'audio' && getFilteredMedia('audio').length > 0 && (
              <View>
                {getFilteredMedia('audio').map((media) => (
                  <View key={media.id} style={styles.audioContainer}>
                    {renderAudioPlayer(media)}
                  </View>
                ))}
              </View>
            )}

            {getFilteredMedia(activeTab).length === 0 && (
              <Text style={styles.noMediaText}>
                No hay {activeTab === 'images' ? 'imágenes' : activeTab === 'videos' ? 'videos' : 'archivos de audio'} disponibles
              </Text>
            )}
          </View>
        )}
      </View>
      
      {/* Modal para ver imágenes ampliadas */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <GestureHandlerRootView style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={closeImageModal}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          
          {selectedImageIndex !== null && event?.media && (
            <FlatList
              data={event.media.filter(media => {
                const fileExtension = media.file_path.split('.').pop()?.toLowerCase();
                return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
              })}
              renderItem={({ item }) => (
                <PanGestureHandler
                  onGestureEvent={panHandler}
                  onHandlerStateChange={(event) => {
                    if (event.nativeEvent.state === State.END) {
                      savedTranslateX.value = translateX.value;
                      savedTranslateY.value = translateY.value;
                    }
                  }}
                  enabled={scale.value > 1}
                >
                  <Animated.View>
                    <PinchGestureHandler
                      onGestureEvent={pinchHandler}
                      onHandlerStateChange={(event) => {
                        if (event.nativeEvent.state === State.END) {
                          savedScale.value = scale.value;
                        }
                      }}
                    >
                      <Animated.View style={[styles.modalImageContainer, animatedImageStyle]}>
                        <Image
                          source={{ uri: item.file_path }}
                          style={styles.modalImage}
                          resizeMode="contain"
                          onLoad={onImageLoad}
                        />
                      </Animated.View>
                    </PinchGestureHandler>
                  </Animated.View>
                </PanGestureHandler>
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedImageIndex}
              getItemLayout={(data, index) => ({
                length: Dimensions.get('window').width,
                offset: Dimensions.get('window').width * index,
                index,
              })}
            />
          )}
          
          <View style={styles.modalNavigation}>
            <TouchableOpacity 
              style={styles.modalNavButton}
              onPress={() => {
                if (selectedImageIndex !== null && selectedImageIndex > 0) {
                  setSelectedImageIndex(selectedImageIndex - 1);
                  resetZoom();
                }
              }}
              disabled={selectedImageIndex === 0}
            >
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalZoomButton}
              onPress={resetZoom}
            >
              <Ionicons name="resize" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalNavButton}
              onPress={() => {
                if (selectedImageIndex !== null && event?.media && 
                    selectedImageIndex < event.media.filter(media => {
                      const fileExtension = media.file_path.split('.').pop()?.toLowerCase();
                      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                    }).length - 1) {
                  setSelectedImageIndex(selectedImageIndex + 1);
                  resetZoom();
                }
              }}
              disabled={selectedImageIndex === (event?.media?.filter(media => {
                const fileExtension = media.file_path.split('.').pop()?.toLowerCase();
                return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
              }).length || 0) - 1}
            >
              <Ionicons name="chevron-forward" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </ScrollView>
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
  eventInfo: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
  },
  descriptionContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  mediaContainer: {
    marginBottom: 24,
  },
  mediaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mediaThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  videoContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalNavigation: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  modalNavButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  modalZoomButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
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
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f7f5f2',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  activeTab: {
    backgroundColor: '#e16b5c20',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#e16b5c',
    fontWeight: '500',
  },
  noMediaText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 16,
  },
}); 