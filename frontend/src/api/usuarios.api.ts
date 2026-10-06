import { apiClient } from './client';
import type { Usuario, UsuarioRequest, ActualizarPesoRequest } from '../types';

const getAuthHeaders = (): Record<string, string> => {
  try {
    const saved = localStorage.getItem('fitlite_active_user');
    if (saved) {
      const user = JSON.parse(saved);
      const headers: Record<string, string> = {};
      if (user.rol) headers['X-User-Role'] = String(user.rol);
      if (user.id) headers['X-User-Id'] = String(user.id);
      return headers;
    }
  } catch {}
  return {};
};

export const usuariosApi = {
  getAll: async (): Promise<Usuario[]> => {
    const { data } = await apiClient.get<Usuario[]>('/usuarios', {
      headers: getAuthHeaders(),
    });
    return data;
  },

  getById: async (id: number): Promise<Usuario> => {
    const { data } = await apiClient.get<Usuario>(`/usuarios/${id}`);
    return data;
  },

  getByEmail: async (email: string): Promise<Usuario> => {
    const { data } = await apiClient.get<Usuario>('/usuarios/email', {
      params: { email },
    });
    return data;
  },

  create: async (usuario: UsuarioRequest): Promise<Usuario> => {
    const { data } = await apiClient.post<Usuario>('/usuarios', usuario, {
      headers: getAuthHeaders(),
    });
    return data;
  },

  update: async (id: number, usuario: UsuarioRequest): Promise<Usuario> => {
    const { data } = await apiClient.put<Usuario>(`/usuarios/${id}`, usuario, {
      headers: getAuthHeaders(),
    });
    return data;
  },

  actualizarPeso: async (id: number, pesoData: ActualizarPesoRequest): Promise<Usuario> => {
    const { data } = await apiClient.patch<Usuario>(`/usuarios/${id}/peso`, pesoData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/usuarios/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  toggleEstado: async (id: number): Promise<Usuario> => {
    const { data } = await apiClient.patch<Usuario>(`/usuarios/${id}/estado`, {}, {
      headers: getAuthHeaders(),
    });
    return data;
  },
};
