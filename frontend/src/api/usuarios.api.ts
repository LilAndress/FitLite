import { apiClient } from './client';
import type { Usuario, UsuarioRequest } from '../types';

export const usuariosApi = {
  getAll: async (): Promise<Usuario[]> => {
    const { data } = await apiClient.get<Usuario[]>('/usuarios');
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
    const { data } = await apiClient.post<Usuario>('/usuarios', usuario);
    return data;
  },

  update: async (id: number, usuario: UsuarioRequest): Promise<Usuario> => {
    const { data } = await apiClient.put<Usuario>(`/usuarios/${id}`, usuario);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/usuarios/${id}`);
  },
};
