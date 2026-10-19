import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { enviarMensajeChat, getHistorialChat } from '../api/chat.api';
import type { MensajeChat } from '../types';
import { MarkdownView } from './MarkdownView';
import {
  Sparkles,
  Send,
  X,
  Maximize2,
  Bot,
  ShieldAlert,
  Clock
} from 'lucide-react';

export const CoachIaFloatingWidget: React.FC = () => {
  const { activeUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [historialCargado, setHistorialCargado] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCoachPage = location.pathname === '/coach';

  // Cargar historial la primera vez que se abre
  useEffect(() => {
    if (isOpen && !historialCargado && activeUser?.id) {
      getHistorialChat(activeUser.id)
        .then((data) => {
          setMensajes(data);
          setHistorialCargado(true);
        })
        .catch((err) => console.error('Error cargando historial widget:', err));
    }
  }, [isOpen, historialCargado, activeUser?.id]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, cargando, isOpen]);

  // Si estamos en login, registro, landing o ya en /coach, no mostrar el widget flotante
  if (!activeUser || isCoachPage || location.pathname === '/login' || location.pathname === '/registro' || location.pathname === '/landing') {
    return null;
  }

  const handleEnviar = async (textoAEnviar?: string) => {
    const texto = (textoAEnviar || inputMensaje).trim();
    if (!texto || !activeUser?.id || cargando) return;

    const mensajeUsuario: MensajeChat = {
      rol: 'USER',
      contenido: texto,
      fechaCreacion: new Date().toISOString(),
    };

    setMensajes((prev) => [...prev, mensajeUsuario]);
    if (!textoAEnviar) setInputMensaje('');
    setCargando(true);

    try {
      const response = await enviarMensajeChat({
        usuarioId: activeUser.id,
        mensaje: texto,
      });

      const mensajeRespuesta: MensajeChat = {
        rol: 'MODEL',
        contenido: response.respuesta,
        fechaCreacion: response.fecha || new Date().toISOString(),
      };

      setMensajes((prev) => [...prev, mensajeRespuesta]);
    } catch (err) {
      console.error('Error enviando mensaje flotante:', err);
      setMensajes((prev) => [
        ...prev,
        {
          rol: 'MODEL',
          contenido: '⚠️ No pude conectar con el Coach. Revisa que el backend esté en ejecución.',
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón flotante cerrado */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[#0D1117] font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <span className="font-space tracking-tight">Coach IA</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[var(--bg-primary)] animate-pulse" />
        </button>
      )}

      {/* Ventana de chat flotante */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[400px] h-[520px] max-h-[80vh] bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-[var(--bg-primary)] border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-space text-[var(--text-primary)]">Coach FitLite IA</h4>
                <p className="text-[10px] text-emerald-400 font-inter">Gemini Flash · Adaptado a tu salud</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/coach');
                }}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                title="Abrir en pantalla completa"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--surface-hover)] transition-colors"
                title="Cerrar widget"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {mensajes.length === 0 ? (
              <div className="text-center py-6 px-2 text-[var(--text-secondary)]">
                <div className="w-10 h-10 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center mx-auto mb-2">
                  <Bot className="w-5 h-5" />
                </div>
                <p className="font-semibold text-[var(--text-primary)] font-space">
                  ¡Hola {activeUser.nombre}!
                </p>
                <p className="text-[11px] mt-1 leading-snug">
                  Pregúntame sobre técnicas, adaptaciones por dolor o pide una rutina express.
                </p>

                {/* Chips rápidos */}
                <div className="space-y-1.5 mt-4 text-left">
                  <button
                    onClick={() => handleEnviar('¿Qué ejercicios debo evitar según mis zonas de dolor y qué alternativas me recomiendas?')}
                    className="w-full p-2 rounded-xl border border-[var(--border)] hover:border-amber-500/40 bg-[var(--bg-primary)] hover:bg-amber-500/10 text-[11px] text-amber-300 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">Cuidar mis molestias articulares</span>
                  </button>
                  <button
                    onClick={() => handleEnviar('Dame una rutina express para hoy con mi equipamiento')}
                    className="w-full p-2 rounded-xl border border-[var(--border)] hover:border-[var(--accent-primary)]/40 bg-[var(--bg-primary)] hover:bg-[var(--accent-primary)]/10 text-[11px] text-[var(--accent-primary)] flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Rutina express con mi equipo</span>
                  </button>
                </div>
              </div>
            ) : (
              mensajes.map((m, idx) => {
                const isUser = m.rol === 'USER';
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-[var(--accent-primary)] text-[#0D1117] font-medium rounded-tr-none'
                          : 'bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none font-inter'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.contenido}</p>
                      ) : (
                        <MarkdownView content={m.contenido} />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {cargando && (
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] px-2 py-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[var(--accent-primary)]" />
                <span>Coach FitLite respondiendo...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-2.5 bg-[var(--bg-primary)] border-t border-[var(--border)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEnviar();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputMensaje}
                onChange={(e) => setInputMensaje(e.target.value)}
                placeholder="Escribe tu consulta..."
                disabled={cargando}
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent-primary)] rounded-full px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
              />
              <button
                type="submit"
                disabled={!inputMensaje.trim() || cargando}
                className="p-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
