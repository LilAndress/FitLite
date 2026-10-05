import { apiClient } from './client';
import type { Ejercicio, EjercicioRequest } from '../types';

export const ejerciciosApi = {
  getById: async (id: number): Promise<Ejercicio> => {
    const { data } = await apiClient.get<Ejercicio>(`/ejercicios/${id}`);
    return data;
  },

  getByRutina: async (rutinaId: number): Promise<Ejercicio[]> => {
    const { data } = await apiClient.get<Ejercicio[]>(`/ejercicios/rutina/${rutinaId}`);
    return data;
  },

  create: async (ejercicio: EjercicioRequest): Promise<Ejercicio> => {
    const { data } = await apiClient.post<Ejercicio>('/ejercicios', ejercicio);
    return data;
  },

  update: async (id: number, ejercicio: EjercicioRequest): Promise<Ejercicio> => {
    const { data } = await apiClient.put<Ejercicio>(`/ejercicios/${id}`, ejercicio);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/ejercicios/${id}`);
  },
};
