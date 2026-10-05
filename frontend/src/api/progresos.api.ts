import { apiClient } from './client';
import type { Progreso, ProgresoRequest } from '../types';

export const progresosApi = {
  getById: async (id: number): Promise<Progreso> => {
    const { data } = await apiClient.get<Progreso>(`/progresos/${id}`);
    return data;
  },

  getByUsuario: async (usuarioId: number): Promise<Progreso[]> => {
    const { data } = await apiClient.get<Progreso[]>(`/progresos/usuario/${usuarioId}`);
    return data;
  },

  getByUsuarioYEjercicio: async (usuarioId: number, ejercicioId: number): Promise<Progreso[]> => {
    const { data } = await apiClient.get<Progreso[]>(`/progresos/usuario/${usuarioId}/ejercicio/${ejercicioId}`);
    return data;
  },

  create: async (progreso: ProgresoRequest): Promise<Progreso> => {
    const { data } = await apiClient.post<Progreso>('/progresos', progreso);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/progresos/${id}`);
  },
};
