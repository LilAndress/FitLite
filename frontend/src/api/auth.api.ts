import { apiClient } from './client';
import type { LoginRequest, RegistroRequest, Usuario } from '../types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<Usuario> => {
    try {
      const { data } = await apiClient.post<Usuario>('/auth/login', credentials);
      return data;
    } catch (err: any) {
      // Si el backend no ha sido reiniciado y no tiene /api/auth/login (404),
      // buscar por email en el endpoint existente
      if (err.response?.status === 404) {
        const { data: usuario } = await apiClient.get<Usuario>('/usuarios/email', {
          params: { email: credentials.email },
        });
        return usuario;
      }
      throw err;
    }
  },

  registro: async (registroData: RegistroRequest): Promise<Usuario> => {
    const payload = {
      ...registroData,
      rol: 'USUARIO' as const,
    };

    try {
      // Intentar /api/usuarios (compatible con servidor actual y actualizado)
      const { data } = await apiClient.post<Usuario>('/usuarios', payload);
      return data;
    } catch (err: any) {
      // Si fallara por ruta alternativa, intentar /api/auth/registro
      if (err.response?.status === 404) {
        const { data } = await apiClient.post<Usuario>('/auth/registro', payload);
        return data;
      }
      throw err;
    }
  },
};
