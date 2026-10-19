import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { enviarMensajeChat, getHistorialChat, borrarHistorialChat } from '../api/chat.api';
import type { MensajeChat } from '../types';
import { MarkdownView } from '../components/MarkdownView';
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  ShieldAlert,
  Dumbbell,
  Clock,
  MapPin,
  Flame,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  HeartPulse
} from 'lucide-react';

export const CoachIaPage: React.FC = () => {
  const { activeUser } = useUser();
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [advertenciaApi, setAdvertenciaApi] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const cargarHistorial = async () => {
      if (!activeUser?.id) return;
      try {
        setCargandoHistorial(true);
        const data = await getHistorialChat(activeUser.id);
        setMensajes(data);
      } catch (err) {
        console.error('Error al cargar historial del chat:', err);
      } finally {
        setCargandoHistorial(false);
      }
    };

    cargarHistorial();
  }, [activeUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes, cargando]);

  const handleEnviar = async (textoAEnviar?: string) => {
    const texto = (textoAEnviar || inputMensaje).trim();
    if (!texto || !activeUser?.id || cargando) return;

    // Optimistic UI update
    const mensajeTemporalUsuario: MensajeChat = {
      rol: 'USER',
      contenido: texto,
      fechaCreacion: new Date().toISOString(),
    };

    setMensajes((prev) => [...prev, mensajeTemporalUsuario]);
    if (!textoAEnviar) setInputMensaje('');
    setCargando(true);
    setAdvertenciaApi(null);

    try {
      const response = await enviarMensajeChat({
        usuarioId: activeUser.id,
        mensaje: texto,
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
    } catch (err: any) {
      console.error('Error enviando mensaje al chatbot:', err);
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

  const handleBorrarHistorial = async () => {
    if (!activeUser?.id) return;
    if (window.confirm('¿Seguro que deseas reiniciar y borrar el historial de conversación con tu Coach?')) {
      try {
        await borrarHistorialChat(activeUser.id);
        setMensajes([]);
        setAdvertenciaApi(null);
      } catch (err) {
        console.error('Error borrando historial:', err);
      }
    }
  };

  const quickPrompts = [
    {
      titulo: 'Proteger molestias',
      prompt: 'Analiza mis zonas de dolor y dime exactamente qué ejercicios debo evitar y cuáles usar como reemplazo seguro.',
      icono: ShieldAlert,
      color: 'hover:border-amber-500/40 hover:bg-amber-500/10 text-amber-400',
    },
    {
      titulo: 'Rutina express hoy',
      prompt: 'Diseña una rutina express de entrenamiento adaptada estrictamente a mi equipamiento y tiempo disponible por sesión.',
      icono: Clock,
      color: 'hover:border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]',
    },
    {
      titulo: 'Macronutrientes',
      prompt: 'Calcula cuántas calorías, proteínas y carbohidratos debería consumir al día según mi peso actual y mi objetivo físico.',
      icono: Flame,
      color: 'hover:border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400',
    },
    {
      titulo: 'Sustituir ejercicio',
      prompt: '¿Con qué ejercicios seguros puedo reemplazar el press banca o la sentadilla tradicional según mis molestias?',
      icono: Dumbbell,
      color: 'hover:border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400',
    },
  ];

  const perfil = activeUser?.perfilSalud;
  const tieneMolestias = perfil?.zonasMolestia && perfil.zonasMolestia.length > 0 && !perfil.zonasMolestia.includes('NINGUNA');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/30 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-space text-[var(--text-primary)]">Coach FitLite IA</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-space flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Gemini Free
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-inter">
              Entrenador y biomecánico personal calibrado con tus datos de salud
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBorrarHistorial}
            disabled={mensajes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-red-500/40 text-xs font-medium text-[var(--text-secondary)] hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Reiniciar conversación"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar chat</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Chat Box */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4 min-h-0">
        {/* Sidebar: User Health & Fitness Context Card */}
        <aside className="hidden lg:flex flex-col gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-y-auto">
          <div className="flex items-center gap-2 text-xs font-bold font-space uppercase tracking-wider text-[var(--accent-primary)] border-b border-[var(--border)] pb-2">
            <HeartPulse className="w-4 h-4" />
            <span>Contexto Activo de la IA</span>
          </div>

          <div className="space-y-3 text-xs font-inter">
            {/* Atleta & Objetivo */}
            <div className="p-3 bg-[var(--bg-primary)]/80 rounded-xl border border-[var(--border)]">
              <p className="text-[11px] text-[var(--text-secondary)]">Atleta</p>
              <p className="text-sm font-bold text-[var(--text-primary)] font-space">{activeUser?.nombre}</p>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-secondary)]">Meta:</span>
                <span className="font-semibold text-[var(--accent-primary)] capitalize">
                  {activeUser?.objetivo?.toLowerCase().replace('_', ' ') || 'No definida'}
                </span>
              </div>
              {activeUser?.pesoActual && (
                <div className="flex items-center justify-between text-[11px] mt-0.5">
                  <span className="text-[var(--text-secondary)]">Peso:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{activeUser.pesoActual} kg</span>
                </div>
              )}
            </div>

            {/* Zonas de Molestia */}
            <div className="p-3 bg-[var(--bg-primary)]/80 rounded-xl border border-[var(--border)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  Molestias / Dolores:
                </span>
              </div>
              {tieneMolestias ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {perfil?.zonasMolestia.map((zona) => (
                    <span
                      key={zona}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    >
                      {zona}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-400 font-medium">Ninguna reportada ✓</p>
              )}
            </div>

            {/* Lugar y Equipamiento */}
            <div className="p-3 bg-[var(--bg-primary)]/80 rounded-xl border border-[var(--border)]">
              <p className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3 text-[var(--accent-primary)]" />
                Lugar & Equipo:
              </p>
              <p className="font-bold text-[var(--text-primary)] font-space text-xs">
                {perfil?.lugarEntrenamiento || 'GIMNASIO'}
              </p>
              {perfil?.equipamientoDisponible && perfil.equipamientoDisponible.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {perfil.equipamientoDisponible.map((eq) => (
                    <span
                      key={eq}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)]"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">Gimnasio comercial completo</p>
              )}
            </div>

            {/* Disponibilidad */}
            <div className="p-3 bg-[var(--bg-primary)]/80 rounded-xl border border-[var(--border)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Tiempo disponible:
              </span>
              <span className="font-bold font-space text-[var(--text-primary)]">
                {perfil?.diasDisponiblesSemana || 3}d · {perfil?.minutosPorSesion || 50}m
              </span>
            </div>
          </div>

          <div className="mt-auto p-3 rounded-xl bg-gradient-to-br from-indigo-950/30 to-purple-950/30 border border-indigo-500/30 text-[11px] text-indigo-300">
            <p className="font-semibold flex items-center gap-1.5 text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              100% Personalizado
            </p>
            <p className="text-[10px] text-indigo-300/80 mt-1 leading-relaxed">
              El Coach no repite respuestas genéricas. Evalúa tus articulaciones, equipo y objetivo en cada mensaje.
            </p>
          </div>
        </aside>

        {/* Chat Area (3 columns) */}
        <section className="lg:col-span-3 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
          {/* Advertencia si no hay API Key */}
          {advertenciaApi && (
            <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{advertenciaApi}</span>
              </div>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white font-medium flex items-center gap-1 shrink-0"
              >
                Obtener clave gratis <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {cargandoHistorial ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 text-[var(--text-secondary)]">
                <RefreshCw className="w-6 h-6 animate-spin text-[var(--accent-primary)] mb-2" />
                <p className="text-xs font-inter">Cargando conversación con el Coach...</p>
              </div>
            ) : mensajes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-8">
                <div className="w-16 h-16 rounded-3xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center mb-4 shadow-xl">
                  <Bot className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold font-space text-[var(--text-primary)]">
                  ¡Hola, {activeUser?.nombre}!
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-inter">
                  Soy tu Coach personal con IA de FitLite. Tengo en cuenta tus objetivos, tu equipamiento y tus posibles molestias articulares.
                </p>

                {/* Quick Prompts */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 text-left">
                  {quickPrompts.map((qp, idx) => {
                    const Icon = qp.icono;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleEnviar(qp.prompt)}
                        className={`p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]/60 text-left transition-all text-xs font-inter group cursor-pointer ${qp.color}`}
                      >
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{qp.titulo}</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-snug">
                          {qp.prompt}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              mensajes.map((m, index) => {
                const isUser = m.rol === 'USER';
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-md leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[#0D1117] font-medium rounded-tr-none'
                          : 'bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none font-inter'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.contenido}</p>
                      ) : (
                        <MarkdownView content={m.contenido} />
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {cargando && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-center gap-2">
                  <span className="font-space font-medium text-[var(--text-primary)]">Coach FitLite pensando</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div className="p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--bg-primary)]/50 backdrop-blur-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEnviar();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMensaje}
                onChange={(e) => setInputMensaje(e.target.value)}
                placeholder="Pregúntale a tu Coach (ej: 'Recomiéndame una rutina para hombros sin dolor')..."
                disabled={cargando}
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent-primary)] rounded-full px-4 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMensaje.trim() || cargando}
                className="px-4 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-lg shadow-[var(--accent-primary)]/20 cursor-pointer"
              >
                <span>Enviar</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-[10px] text-[var(--text-secondary)] text-center mt-2 font-inter">
              Coach FitLite IA utiliza Google Gemini. El contenido es orientativo y adaptado a tu perfil deportivo.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
