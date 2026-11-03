import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from './UserContext';
import { getHistorialChat, enviarMensajeChat, borrarHistorialChat } from '../api/chat.api';
import type { MensajeChat } from '../types';

interface ChatContextType {
  mensajes: MensajeChat[];
  cargando: boolean;
  cargandoHistorial: boolean;
  advertenciaApi: string | null;
  enviarMensaje: (texto: string) => Promise<void>;
  borrarHistorial: () => Promise<void>;
  recargarHistorial: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeUser } = useUser();
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [advertenciaApi, setAdvertenciaApi] = useState<string | null>(null);
  const hasLoadedRef = useRef<number | null>(null);

  const cargarHistorial = useCallback(async (userId?: number, forzar = false) => {
    if (!userId) {
      setMensajes([]);
      return;
    }
    if (!forzar && hasLoadedRef.current === userId) {
      return;
    }
    try {
      setCargandoHistorial(true);
      const data = await getHistorialChat(userId);
      setMensajes(data);
      hasLoadedRef.current = userId;
    } catch (err) {
      console.error('Error al cargar historial del chat:', err);
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  useEffect(() => {
    if (activeUser?.id) {
      cargarHistorial(activeUser.id);
    } else {
      setMensajes([]);
      hasLoadedRef.current = null;
    }
  }, [activeUser?.id, cargarHistorial]);

  const enviarMensaje = async (texto: string) => {
    const textoTrimmed = texto.trim();
    if (!textoTrimmed || !activeUser?.id || cargando) return;

    const mensajeUsuario: MensajeChat = {
      rol: 'USER',
      contenido: textoTrimmed,
      fechaCreacion: new Date().toISOString(),
    };

    setMensajes((prev) => [...prev, mensajeUsuario]);
    setCargando(true);
    setAdvertenciaApi(null);

    try {
      const response = await enviarMensajeChat({
        usuarioId: activeUser.id,
        mensaje: textoTrimmed,
      });

      if (response.advertencia) {
        setAdvertenciaApi(response.advertencia);
      }

      const mensajeRespuesta: MensajeChat = {
        rol: 'MODEL',
        contenido: response.respuesta,
        fechaCreacion: response.fecha || new Date().toISOString(),
      };

      setMensajes((prev) => [...prev, mensajeRespuesta]);
    } catch (err) {
      console.error('Error enviando mensaje al chat:', err);
      const errorMsg: MensajeChat = {
        rol: 'MODEL',
        contenido: '⚠️ Ocurrió un error al contactar al Coach IA. Verifica la conexión con el servidor backend.',
        fechaCreacion: new Date().toISOString(),
      };
      setMensajes((prev) => [...prev, errorMsg]);
    } finally {
      setCargando(false);
    }
  };

  const borrarHistorial = async () => {
    if (!activeUser?.id) return;
    try {
      await borrarHistorialChat(activeUser.id);
      setMensajes([]);
      setAdvertenciaApi(null);
    } catch (err) {
      console.error('Error borrando historial:', err);
      throw err;
    }
  };

  const recargarHistorial = async () => {
    await cargarHistorial(activeUser?.id, true);
  };

  return (
    <ChatContext.Provider
      value={{
        mensajes,
        cargando,
        cargandoHistorial,
        advertenciaApi,
        enviarMensaje,
        borrarHistorial,
        recargarHistorial,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useCoachChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useCoachChat debe usarse dentro de ChatProvider');
  }
  return context;
};
