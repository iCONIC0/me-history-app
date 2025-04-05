import api from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthData {
  user: User;
  access_token: string;
  token_type: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthData> => {
    const response = await api.post<ApiResponse<AuthData>>('/api/login', credentials);
    return response.data.data;
  },

  register: async (data: RegisterData): Promise<AuthData> => {
    const response = await api.post<ApiResponse<AuthData>>('/api/register', data);
    return response.data.data;
  },

  verifyToken: async (token: string): Promise<AuthData> => {
    const response = await api.post<ApiResponse<AuthData>>('/api/verify-token', { token });
    return response.data.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post<ApiResponse<void>>('/api/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post<ApiResponse<void>>('/api/reset-password', { token, password });
  },
}; 