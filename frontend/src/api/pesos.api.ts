import { apiClient } from './client';
import type { PesoCorporal, PesoCorporalRequest } from '../types';

export const pesosCorporalesApi = {
  getByUsuario: async (usuarioId: number): Promise<PesoCorporal[]> => {
    const { data } = await apiClient.get<PesoCorporal[]>(`/pesos-corporales/usuario/${usuarioId}`);
    return data;
  },

  getById: async (id: number): Promise<PesoCorporal> => {
    const { data } = await apiClient.get<PesoCorporal>(`/pesos-corporales/${id}`);
    return data;
  },

  create: async (pesoData: PesoCorporalRequest): Promise<PesoCorporal> => {
    const { data } = await apiClient.post<PesoCorporal>('/pesos-corporales', pesoData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/pesos-corporales/${id}`);
  },
};
