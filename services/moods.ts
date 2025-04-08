import api from './api';

export interface Mood {
  id: string;
  date: string;
  mood: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const moods = {
  // Obtener todos los estados de ánimo
  getAll: async (month?: string): Promise<Mood[]> => {
    const url = month ? `/api/me/moods?month=${month}` : '/api/me/moods';
    const response = await api.get<ApiResponse<Mood[]>>(url);
    return response.data.data;
  },

  // Crear un nuevo estado de ánimo
  create: async (mood: string, date: Date): Promise<Mood> => {
    const response = await api.post<ApiResponse<Mood>>('/api/me/moods', {
      mood,
      date: date.toISOString(),
    });
    return response.data.data;
  },
}; 