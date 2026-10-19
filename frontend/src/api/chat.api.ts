import { apiClient } from './client';
import type { ChatRequest, ChatResponse, MensajeChat } from '../types';

export const enviarMensajeChat = async (request: ChatRequest): Promise<ChatResponse> => {
  const response = await apiClient.post<ChatResponse>('/chat/enviar', request);
  return response.data;
};

export const getHistorialChat = async (usuarioId: number): Promise<MensajeChat[]> => {
  const response = await apiClient.get<MensajeChat[]>(`/chat/historial/${usuarioId}`);
  return response.data;
};

export const borrarHistorialChat = async (usuarioId: number): Promise<{ mensaje: string }> => {
  const response = await apiClient.delete<{ mensaje: string }>(`/chat/historial/${usuarioId}`);
  return response.data;
};
