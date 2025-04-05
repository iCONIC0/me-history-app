import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  pivot?: {
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    joined_at: string;
  };
}

export interface Journal {
  id: number;
  name: string;
  description: string | null;
  is_public: boolean;
  owner_id: number;
  owner: User;
  invitation_code: string;
  created_at: string;
  updated_at: string;
  users: User[];
  events: any[]; // TODO: Definir la interfaz Event cuando esté disponible
}

interface CreateJournalData {
  name: string;
  description?: string;
  is_public?: boolean;
  members?: {
    user_id: number;
    role: 'admin' | 'editor' | 'viewer';
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const journalsService = {
  // Obtener todas las bitácoras
  getJournals: async (): Promise<Journal[]> => {
    const response = await api.get<ApiResponse<Journal[]>>('/api/shared-journals');
    return response.data.data;
  },

  // Obtener una bitácora específica
  getJournal: async (id: number): Promise<Journal> => {
    const response = await api.get<ApiResponse<Journal>>(`/api/shared-journals/${id}`);
    return response.data.data;
  },

  // Crear una nueva bitácora
  createJournal: async (data: CreateJournalData): Promise<Journal> => {
    const response = await api.post<ApiResponse<Journal>>('/api/shared-journals', data);
    return response.data.data;
  },

  // Unirse a una bitácora usando un código
  joinJournal: async (code: string): Promise<Journal> => {
    const response = await api.post<ApiResponse<Journal>>('/api/shared-journals/join', { invitation_code: code });
    return response.data.data;
  },

  // Abandonar una bitácora
  leaveJournal: async (journalId: number): Promise<void> => {
    await api.post<ApiResponse<void>>(`/api/shared-journals/${journalId}/leave`);
  },

  // Actualizar rol de usuario en una bitácora
  updateMemberRole: async (journalId: number, userId: number, role: 'admin' | 'editor' | 'viewer'): Promise<Journal> => {
    const response = await api.patch<ApiResponse<Journal>>(`/api/shared-journals/${journalId}/user-role`, {
      user_id: userId,
      role: role
    });
    return response.data.data;
  },

  // Transferir propiedad de una bitácora
  transferOwnership: async (journalId: number, newOwnerId: number): Promise<Journal> => {
    const response = await api.patch<ApiResponse<Journal>>(`/api/shared-journals/${journalId}/transfer-ownership`, {
      new_owner_id: newOwnerId
    });
    return response.data.data;
  },

  // Eliminar una bitácora
  deleteJournal: async (journalId: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/api/shared-journals/${journalId}`);
  }
}; 