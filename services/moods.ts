import api from './api';

export interface Mood {
  id: number;
  mood: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse {
  data: Mood[];
}

class MoodsService {
  async getAll(month?: string): Promise<Record<string, Mood[]>> {
    try {
      const url = month ? `/api/me/moods?month=${month}` : '/api/me/moods';
      const response = await api.get<ApiResponse>(url);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener los estados de ánimo:', error);
      return {};
    }
  }

  async create(mood: string, date: Date): Promise<Mood | null> {
    try {
      // Obtener la zona horaria del dispositivo
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Enviar la fecha en UTC
      const utcDate = date.toISOString().slice(0, 19).replace('T', ' ');

      const response = await api.post<ApiResponse>('/api/me/moods', {
        mood,
        date: utcDate,
        timezone
      });
      return response.data.data[0];
    } catch (error) {
      console.error('Error al crear el estado de ánimo:', error);
      return null;
    }
  }
}

export const moods = new MoodsService(); 