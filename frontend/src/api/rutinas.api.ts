import { apiClient } from './client';
import type { Rutina, RutinaRequest } from '../types';

export const rutinasApi = {
  getById: async (id: number): Promise<Rutina> => {
    const { data } = await apiClient.get<Rutina>(`/rutinas/${id}`);
    return data;
  },

  getByUsuario: async (usuarioId: number): Promise<Rutina[]> => {
    const { data } = await apiClient.get<Rutina[]>(`/rutinas/usuario/${usuarioId}`);
    return data;
  },

  getActivasByUsuario: async (usuarioId: number): Promise<Rutina[]> => {
    const { data } = await apiClient.get<Rutina[]>(`/rutinas/usuario/${usuarioId}/activas`);
    return data;
  },

  create: async (rutina: RutinaRequest): Promise<Rutina> => {
    const { data } = await apiClient.post<Rutina>('/rutinas', rutina);
    return data;
  },

  update: async (id: number, rutina: RutinaRequest): Promise<Rutina> => {
    const { data } = await apiClient.put<Rutina>(`/rutinas/${id}`, rutina);
    return data;
  },

  toggleEstado: async (id: number, activa: boolean): Promise<Rutina> => {
    const { data } = await apiClient.patch<Rutina>(`/rutinas/${id}/estado`, null, {
      params: { activa },
    });
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/rutinas/${id}`);
  },
};
