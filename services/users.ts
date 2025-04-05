import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateProfileData {
  name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
  new_password_confirmation?: string;
  avatar?: File;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
}

export const usersService = {
  // Registro de usuario
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/api/register', data);
    return response.data.data;
  },

  // Login de usuario
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/api/login', data);
    return response.data.data;
  },

  // Obtener perfil del usuario actual
  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/api/me');
    return response.data.data;
  },

  // Actualizar perfil
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });

    const response = await api.post<ApiResponse<User>>('/api/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Cerrar sesión
  logout: async (): Promise<void> => {
    await api.post<ApiResponse<void>>('/api/logout');
  },
}; 