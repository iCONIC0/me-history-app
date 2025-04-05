import api from './api';

export interface Event {
  shared_journal: any;
  id: number;
  title: string;
  description: string | null;
  type: string;
  category: string;
  date: string;
  location: string | null;
  journal_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  media: EventMedia[];
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
  media?: File[];
  metadata?: Record<string, any>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Interfaz para los eventos sugeridos
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

// Interfaz para la respuesta del endpoint de eventos sugeridos
export interface SuggestedEventsResponse {
  frequent: SuggestedEvent[];
  predefined: SuggestedEvent[];
}

export const eventsService = {
  // Obtener todos los eventos
  getEvents: async (): Promise<Event[]> => {
    try {
      const response = await api.get<ApiResponse<Event[]>>('/api/events');
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      return [];
    }
  },

  // Obtener un evento específico
  getEvent: async (id: number): Promise<Event | null> => {
    try {
      const response = await api.get<ApiResponse<Event>>(`/api/events/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener evento:', error);
      return null;
    }
  },

  // Crear un nuevo evento
  createEvent: async (data: CreateEventData): Promise<Event | null> => {
    try {
      // Determinar si hay archivos para enviar
      const hasMedia = data.media && data.media.length > 0;
      
      // Preparar los datos según el tipo de evento
      let requestData;
      let headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      
      if (hasMedia) {
        // Si hay archivos, usar FormData
        const formData = new FormData();
        
        // Agregar campos básicos
        formData.append('title', data.title);
        formData.append('type', data.type);
        formData.append('category', data.category);
        formData.append('event_date', data.event_date);
        
        // Agregar shared_journal_id si existe
        if (data.shared_journal_id) {
          formData.append('shared_journal_id', data.shared_journal_id.toString());
        }
        
        // Agregar archivos
        data.media?.forEach((file: File) => {
          formData.append('media[]', file);
        });
        
        // Agregar metadata si existe
        if (data.metadata) {
          formData.append('metadata', JSON.stringify(data.metadata));
        }
        
        requestData = formData;
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        // Si no hay archivos, enviar como JSON
        const jsonData = {
          title: data.title,
          type: data.type,
          category: data.category,
          event_date: data.event_date,
          shared_journal_id: data.shared_journal_id,
          metadata: data.metadata || {},
        };
        
        requestData = jsonData;
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await api.post<ApiResponse<Event>>('/api/events', requestData, {
        headers,
        validateStatus: (status) => status === 200 || status === 201,
      });
      
      console.log("response");
      console.log(response);
      return response.data.data;
    } catch (error) {
      console.error('Error al crear evento:', error);
      return null;
    }
  },

  // Obtener sugerencias de eventos
  getSuggestedEvents: async (): Promise<SuggestedEventsResponse> => {
    try {
      const response = await api.get<ApiResponse<SuggestedEventsResponse>>('/api/suggested-events');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener sugerencias:', error);
      return { frequent: [], predefined: [] };
    }
  },
}; 