import api from './api';

export interface Event {
  id: number;
  title: string;
  description: string | null;
  type: string;
  category: string;
  event_date: string;
  location: string | null;
  shared_journal_id: number | null;
  shared_journal: {
    id: number;
    name: string;
  } | null;
  user_id: number;
  user: {
    id: number;
    name: string;
  } | null;
  visibility: 'all' | 'custom';
  include_in_personal_journal: boolean;
  created_at: string;
  updated_at: string;
  media: EventMedia[];
  metadata: Record<string, any>;
}

export interface EventMedia {
  id: number;
  event_id: number;
  file_path: string;
  file_name: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  type: string;
  category: string;
  event_date: string;
  location?: string;
  shared_journal_id?: number;
  media?: {
    uri: string;
    name: string;
    type: string;
  }[];
  metadata?: Record<string, any>;
  timezone?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Interfaz para los Registros sugeridos
export interface SuggestedEvent {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  metadata: any;
  usage_count?: number;
  last_used?: string;
  template_type: 'frequent' | 'predefined';
  icon: string;
}

// Interfaz para la respuesta del endpoint de Registros sugeridos
export interface SuggestedEventsResponse {
  frequent: SuggestedEvent[];
  predefined: SuggestedEvent[];
}

export interface EventsResponse {
  data: Event[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Interfaz para archivos de medios
export interface MediaFile {
  uri: string;
  name: string;
  type: string;
}

export const eventsService = {
  // Obtener todos los Registros con paginación
  getEvents: async (page: number = 1, per_page: number = 10): Promise<EventsResponse> => {
    try {
      const response :any = await api.get<ApiResponse<EventsResponse>>(`/api/events?page=${page}&limit=${per_page}`);
      return response.data || { data: [], pagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 } };
    } catch (error) {
      console.error('Error al obtener Registros:', error);
      return { data: [], pagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 } };
    }
  },

  // Obtener un Registro específico
  getEvent: async (id: number): Promise<Event | null> => {
    try {
      const response = await api.get<ApiResponse<Event>>(`/api/events/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener Registro:', error);
      return null;
    }
  },

  // Crear un nuevo Registro
  createEvent: async (data: CreateEventData): Promise<Event | null> => {
    try {
      // Obtener la zona horaria del dispositivo
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Determinar si hay archivos para enviar
      const hasMedia = data.media && data.media.length > 0;
      
      // Preparar los datos según el tipo de Registro
      let requestData;
      let headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      
      if (hasMedia) {
        // Si hay archivos, usar FormData
        const formData = new FormData();
        console.log('data', data);
        // Agregar campos básicos
        formData.append('title', data.title);
        formData.append('description', data.description || '');
        formData.append('type', data.type);
        formData.append('category', data.category);
        formData.append('event_date', data.event_date);
        formData.append('timezone', timezone);
        
        // Agregar shared_journal_id si existe
        if (data.shared_journal_id) {
          formData.append('shared_journal_id', data.shared_journal_id.toString());
        }
        
        // Agregar archivos - Laravel espera 'media[]' para un array de archivos
        data.media?.forEach((file: { uri: string; name: string; type: string }) => {
          // Crear un objeto File a partir de la URI
          const fileObj = {
            uri: file.uri,
            name: file.name,
            type: file.type
          };
          
          // Agregar el archivo al FormData
          formData.append('media[]', fileObj as any);
        });
        
        // Agregar metadata si existe
        if (data.metadata) {
          for (const [key, value] of Object.entries(data.metadata)) {
            formData.append(`metadata[${key}]`, value);
          }
        }
        
        requestData = formData;
        headers['content-type'] = 'multipart/form-data';
      } else {
        // Si no hay archivos, enviar como JSON
        headers['content-type'] = 'application/json';
        requestData = {
          title: data.title,
          description: data.description || '',
          type: data.type,
          category: data.category,
          event_date: data.event_date,
          shared_journal_id: data.shared_journal_id,
          metadata: data.metadata || {},
          timezone: timezone
        };
      }
      
      const response = await api.post<ApiResponse<Event>>('/api/events', requestData, {
        headers,
        validateStatus: (status) => status === 200 || status === 201,
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error al crear Registro:', error);
      // Propagar el mensaje de error del backend si está disponible
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Error desconocido al crear el Registro');
      }
    }
  },

  // Actualizar un Registro existente
  updateEvent: async (id: string, data: FormData): Promise<Event | null> => {
    try {
      // Obtener la zona horaria del dispositivo
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Determinar si hay archivos para enviar
      const hasMedia = data.has('media[]');
      
      // Preparar los datos según el tipo de Registro
      let requestData;
      let headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      
      if (hasMedia) {
        // Si hay archivos, usar FormData
        requestData = data;
        headers['content-type'] = 'multipart/form-data';
      } else {
        // Si no hay archivos, enviar como JSON
        headers['content-type'] = 'application/json';
        requestData = {
          title: data.get('title'),
          description: data.get('description') || '',
          type: data.get('type'),
          category: data.get('category'),
          event_date: data.get('event_date'),
          shared_journal_id: data.get('shared_journal_id'),
          metadata: data.get('metadata') ? JSON.parse(data.get('metadata') as string) : {},
          timezone: timezone,
          deleted_media_ids: data.get('deleted_media_ids') ? JSON.parse(data.get('deleted_media_ids') as string) : []
        };
      }
      
      const response = await api.post<ApiResponse<Event>>(`/api/events/${id}`, requestData, {
        headers,
        validateStatus: (status: number) => status === 200 || status === 201,
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error al actualizar Registro:', error);
      // Propagar el mensaje de error del backend si está disponible
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Error desconocido al actualizar el Registro');
      }
    }
  },

  // Obtener sugerencias de Registros
  getSuggestedEvents: async (): Promise<SuggestedEventsResponse> => {
    try {
      const response = await api.get<ApiResponse<SuggestedEventsResponse>>('/api/events/suggested');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener Registros sugeridos:', error);
      return { frequent: [], predefined: [] };
    }
  },

  // Eliminar un medio de un evento
  deleteEventMedia: async (eventId: string, mediaId: string): Promise<boolean> => {
    try {
      console.log('eventId', eventId);
      console.log('mediaId', mediaId);
      await api.delete(`/api/events/${eventId}/media/${mediaId}`);
      return true;
    } catch (error) {
      console.error('Error al eliminar el medio:', error);
      throw error;
    }
    return false;
  },
}; 