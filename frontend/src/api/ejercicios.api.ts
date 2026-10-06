import { apiClient } from './client';
import type { Ejercicio, EjercicioRequest, EjercicioCatalogo } from '../types';

export const ejerciciosApi = {
  getById: async (id: number): Promise<Ejercicio> => {
    const { data } = await apiClient.get<Ejercicio>(`/ejercicios/${id}`);
    return data;
  },

  getByRutina: async (rutinaId: number): Promise<Ejercicio[]> => {
    const { data } = await apiClient.get<Ejercicio[]>(`/ejercicios/rutina/${rutinaId}`);
    return data;
  },

  buscarCatalogo: async (query: string): Promise<EjercicioCatalogo[]> => {
    const { data } = await apiClient.get<EjercicioCatalogo[]>('/ejercicios/buscar', {
      params: { query },
    });
    return data;
  },

  getCatalogo: async (): Promise<EjercicioCatalogo[]> => {
    const { data } = await apiClient.get<EjercicioCatalogo[]>('/ejercicios/catalogo');
    return data;
  },

  crearCatalogo: async (ejercicio: Partial<EjercicioCatalogo>): Promise<EjercicioCatalogo> => {
    const { data } = await apiClient.post<EjercicioCatalogo>('/ejercicios/catalogo', ejercicio);
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
