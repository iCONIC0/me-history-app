import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User } from '../services/users';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async (token, user) => {
        // Guardar el token en SecureStore para que esté disponible para las peticiones API
        await SecureStore.setItemAsync('token', token);
        set({ token, user, isAuthenticated: true });
      },
      logout: async () => {
        // Eliminar el token de SecureStore
        await SecureStore.deleteItemAsync('token');
        set({ token: null, user: null, isAuthenticated: false });
      },
      checkAuth: async () => {
        // Verificar si hay un token en SecureStore
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          set({ token, isAuthenticated: true });
        } else {
          set({ token: null, user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 