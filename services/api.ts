import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../hooks/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.4.94:8787';
// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'content-type': 'application/json',
    'accept': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // // Si es una solicitud con FormData, no establecer Content-Type
    // // para que axios lo establezca automáticamente con el boundary correcto
    if (config.data instanceof FormData) {
      delete config.headers['content-type'];
    }
    
    return config;
  },
  (error) => {
    console.log(error.response);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación y otros errores comunes
api.interceptors.response.use(
  function(response) {
    return response;
  },
  async function(error) {
    console.log(error);
    if (error.response) {
      console.log('Error de respuesta:', error
      );
      // El servidor respondió con un código de estado fuera del rango 2xx
      switch (error.response.status) {
        case 401:
          // Token expirado o inválido
          await SecureStore.deleteItemAsync('token');
          // Actualizar el estado de autenticación
          const auth = useAuth.getState();
          auth.logout();
          break;
        case 403:
          // No autorizado
          console.error('No tienes permisos para realizar esta acción');
          break;
        case 404:
          // Recurso no encontrado
          console.error('Recurso no encontrado');
          break;
        case 500:
          // Error del servidor
          console.error('Error interno del servidor');
          break;
        default:
          console.error('Error en la petición:', error.response.data);
      }
    } else if (error.request) {
      console.log(error);
      console.log('Error de solicitud:', error);
      // La petición fue hecha pero no se recibió respuesta
      console.error('No se pudo conectar con el servidor');
    } else {
      // Algo sucedió en la configuración de la petición
      console.error('Error en la configuración de la petición:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 