"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native"
import { Audio } from "expo-av"
import { Video, ResizeMode } from "expo-av"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, router } from "expo-router"
import { eventsService, Event } from "../../services/events"

// Tipos de Registros disponibles
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

const EventDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookmarked, setBookmarked] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const soundRef = useRef<Audio.Sound | null>(null)
  const videoRef = useRef<Video | null>(null)
  const flatListRef = useRef<FlatList | null>(null)

  useEffect(() => {
    loadEvent()
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync()
      }
    }
  }, [id])

  const loadEvent = async () => {
    try {
      setIsLoading(true)
      const data = await eventsService.getEvent(parseInt(id))
      if (!data) {
        throw new Error('Registro no encontrado')
      }
      setEvent(data)
      setError(null)
    } catch (err) {
      setError('Error al cargar el Registro')
      console.error('Error loading event:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for display
  const formattedDate = event ? new Date(event.event_date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) : ""

  // Helper function to get visibility icon
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "all":
        return <Ionicons name="globe-outline" size={16} color="#666" />
      case "private":
        return <Ionicons name="lock-closed-outline" size={16} color="#666" />
      default:
        return <Ionicons name="person-outline" size={16} color="#666" />
    }
  }

  // Helper function to get event type label
  const getEventTypeLabel = (typeId: string) => {
    return EVENT_TYPES.find(t => t.id === typeId)?.label || typeId;
  };

  // Helper function to get category label
  const getCategoryLabel = (categoryId: string) => {
    return CATEGORY_LABELS[categoryId] || categoryId;
  };

  // Helper function to format category for display
  const formatCategory = (category: string) => {
    return getCategoryLabel(category);
  }

  const toggleBookmark = () => {
    setBookmarked(!bookmarked)
  }

  // Check if the current media is of a specific type
  const currentMedia = event?.media?.[currentIndex]
  const isImage = currentMedia?.mime_type.startsWith("image/")
  const isVideo = currentMedia?.mime_type.startsWith("video/")
  const isAudio = currentMedia?.mime_type.startsWith("audio/")

  // Media control functions
  const togglePlay = async () => {
    if (isVideo && videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync()
      } else {
        await videoRef.current.playAsync()
      }
      setIsPlaying(!isPlaying)
    } else if (isAudio && soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync()
      } else {
        await soundRef.current.playAsync()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = async () => {
    if (isVideo && videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted)
      setIsMuted(!isMuted)
    } else if (isAudio && soundRef.current) {
      await soundRef.current.setIsMutedAsync(!isMuted)
      setIsMuted(!isMuted)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true })
      setIsPlaying(false)
    }
  }

  const goToNext = () => {
    if (event?.media && currentIndex < event.media.length - 1) {
      setCurrentIndex(currentIndex + 1)
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
      setIsPlaying(false)
    }
  }

  // Function to load and unload audio
  const setupAudio = async () => {
    if (isAudio && currentMedia) {
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync()
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: currentMedia.file_path },
          { shouldPlay: false, isLooping: false },
        )
        soundRef.current = sound
      } catch (error) {
        console.log("Error loading audio:", error)
      }
    }
  }

  // Handle media change
  useEffect(() => {
    setupAudio()
    setIsPlaying(false)
  }, [currentIndex])

  // Render a media item
  const renderMediaItem = ({ item, index }: { item: any; index: number }) => {
    const isMediaImage = item.mime_type.startsWith("image/")
    const isMediaVideo = item.mime_type.startsWith("video/")
    const isMediaAudio = item.mime_type.startsWith("audio/")

    if (isMediaImage) {
      return (
        <View style={styles.mediaItem}>
          <Image
            source={{ uri: item.file_path }}
            style={styles.mediaImage}
            resizeMode="contain"
          />
        </View>
      )
    }

    if (isMediaVideo) {
      return (
        <View style={styles.mediaItem}>
          <Video
            ref={index === currentIndex ? videoRef : null}
            source={{ uri: item.file_path }}
            style={styles.mediaVideo}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            isMuted={index === currentIndex ? isMuted : true}
            shouldPlay={index === currentIndex ? isPlaying : false}
          />
          {index === currentIndex && (
            <View style={styles.videoControls}>
              <TouchableOpacity style={styles.controlButton} onPress={togglePlay}>
                {isPlaying ? (
                  <Ionicons name="pause" size={20} color="#fff" />
                ) : (
                  <Ionicons name="play" size={20} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
                {isMuted ? (
                  <Ionicons name="volume-mute" size={20} color="#fff" />
                ) : (
                  <Ionicons name="volume-high" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )
    }

    if (isMediaAudio) {
      return (
        <View style={styles.mediaAudioContainer}>
          <View style={styles.audioPlayer}>
            <TouchableOpacity style={styles.audioPlayButton} onPress={togglePlay}>
              {isPlaying ? (
                <Ionicons name="pause" size={24} color="#333" />
              ) : (
                <Ionicons name="play" size={24} color="#333" />
              )}
            </TouchableOpacity>
            <View style={styles.audioInfo}>
              <Text style={styles.audioTitle} numberOfLines={1}>
                {item.file_name}
              </Text>
              <Text style={styles.audioSubtitle}>Audio {item.type.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.audioControlButton} onPress={toggleMute}>
              {isMuted ? (
                <Ionicons name="volume-mute" size={20} color="#fff" />
              ) : (
                <Ionicons name="volume-high" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return null
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e16b5c" />
      </View>
    )
  }

  if (error || !event) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {error || 'Registro no encontrado'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadEvent}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Check if the entry is part of a bitacora
  const hasBitacora = event.include_in_personal_journal || event.shared_journal_id !== null

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Media Gallery */}
        {event.media && event.media.length > 0 && (
          <View style={styles.mediaGallery}>
            <FlatList
              ref={flatListRef}
              data={event.media}
              renderItem={renderMediaItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
              initialScrollIndex={currentIndex}
            />

            {/* Navigation Controls */}
            {event.media.length > 1 && (
              <>
                <TouchableOpacity style={styles.navButtonLeft} onPress={goToPrevious}>
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButtonRight} onPress={goToNext}>
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.mediaCounter}>
                  <Text style={styles.mediaCounterText}>
                    {currentIndex + 1}/{event.media.length} - {isImage ? "Imagen" : isVideo ? "Video" : "Audio"}
                  </Text>
                </View>
                <View style={styles.paginationDots}>
                  {event.media.map((_: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.paginationDot, index === currentIndex && styles.paginationDotActive]}
                      onPress={() => setCurrentIndex(index)}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Bitacora Indicator - Only show if it has a bitacora */}
          {hasBitacora && (
            <View style={styles.bitacoraContainer}>
              <View style={styles.badge}>
                <Ionicons name="book-outline" size={12} color="#333" />
                <Text style={styles.badgeText}>Bitácora Personal</Text>
              </View>
            </View>
          )}

          {/* Metadata - Moved above title */}
          <View style={styles.metadataContainer}>
            <View style={styles.badge}>
              {getVisibilityIcon(event.visibility)}
              <Text style={styles.badgeText}>
                {event.visibility === "all"
                  ? "Público"
                  : event.visibility === "private"
                    ? "Privado"
                    : "Compartido"}
              </Text>
            </View>

            <View style={[styles.badge, styles.secondaryBadge]}>
              <Text style={styles.badgeText}>{formatCategory(event.category)}</Text>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getEventTypeLabel(event.type)}</Text>
            </View>
          </View>

          {/* Title and Date */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={12} color="#666" />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{event.user?.name?.charAt(0) || '?'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{event.user?.name || 'Usuario desconocido'}</Text>
              <Text style={styles.userRole}>Autor</Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Description if available */}
          {event.description && <Text style={styles.description}>{event.description}</Text>}
        </View>
      </ScrollView>
    </View>
  )
}

const windowWidth = Dimensions.get("window").width
const mediaHeight = Dimensions.get("window").height * 0.35

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  headerActions: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  scrollContent: {
    flex: 1,
  },
  mediaGallery: {
    height: mediaHeight,
    width: windowWidth,
    backgroundColor: "#000",
    position: "relative",
  },
  mediaItem: {
    width: windowWidth,
    height: mediaHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  mediaVideo: {
    width: "100%",
    height: "100%",
  },
  mediaAudioContainer: {
    width: windowWidth,
    height: mediaHeight,
    backgroundColor: "#1a2632",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  audioPlayer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    maxWidth: 360,
  },
  audioPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  audioSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  audioControlButton: {
    padding: 8,
  },
  videoControls: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  navButtonLeft: {
    position: "absolute",
    top: "50%",
    left: 12,
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonRight: {
    position: "absolute",
    top: "50%",
    right: 12,
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaCounter: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediaCounterText: {
    color: "#fff",
    fontSize: 12,
  },
  paginationDots: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#fff",
  },
  content: {
    padding: 16,
  },
  bitacoraContainer: {
    marginBottom: 8,
  },
  metadataContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e1e4e8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  secondaryBadge: {
    backgroundColor: "#f1f3f5",
    borderColor: "#e9ecef",
  },
  badgeText: {
    fontSize: 12,
    color: "#495057",
    marginLeft: 4,
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#212529",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 12,
    color: "#6c757d",
    marginLeft: 4,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4dabf7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212529",
  },
  userRole: {
    fontSize: 12,
    color: "#6c757d",
  },
  separator: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#495057",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    color: "#FF3B30",
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#e16b5c",
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
})

export default EventDetail 