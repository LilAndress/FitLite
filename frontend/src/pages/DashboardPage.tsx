import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  TrendingUp, 
  TrendingDown,
  Plus, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  Activity, 
  Flame, 
  Target,
  Scale,
  Edit3,
  Clock,
  Building2,
  Home,
  Trees,
  HeartPulse,
  ShieldAlert,
  Check,
  Sparkles,
  AlertCircle,
  Bot
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useUser } from '../context/UserContext';
import { rutinasApi } from '../api/rutinas.api';
import { progresosApi } from '../api/progresos.api';
import { pesosCorporalesApi } from '../api/pesos.api';
import { usuariosApi } from '../api/usuarios.api';
import { Badge } from '../components/Badge';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { CircularProgress } from '../components/CircularProgress';
import { Modal } from '../components/Modal';
import type { LugarEntrenamiento } from '../types';

const EQUIPAMIENTOS_LIST = [
  { id: 'PESO_CORPORAL', label: 'Peso Corporal' },
  { id: 'MANCUERNAS', label: 'Mancuernas' },
  { id: 'BANDAS_RESISTENCIA', label: 'Bandas Elásticas' },
  { id: 'BARRA_Y_DISCOS', label: 'Barra y Discos' },
  { id: 'MAQUINAS_GYM', label: 'Máquinas de Gimnasio' },
];

const ZONAS_MOLESTIA_LIST = [
  { id: 'NINGUNA', label: 'Sin molestias articulares' },
  { id: 'RODILLAS', label: 'Rodillas' },
  { id: 'LUMBARES', label: 'Espalda Baja / Lumbares' },
  { id: 'HOMBROS', label: 'Hombros / Manguito' },
  { id: 'CUELLO', label: 'Cuello / Cervicales' },
  { id: 'MUNECAS', label: 'Muñecas' },
  { id: 'TOBILLOS', label: 'Tobillos' },
];

export const DashboardPage: React.FC = () => {
  const { activeUser, users, refreshUsers } = useUser();
  const queryClient = useQueryClient();

  // Estado para modal de actualización rápida de peso
  const [isPesoModalOpen, setIsPesoModalOpen] = useState(false);
  const [pesoInput, setPesoInput] = useState<string>('');
  const [fechaInput, setFechaInput] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notasInput, setNotasInput] = useState<string>('');
  const [pesoError, setPesoError] = useState<string | null>(null);

  // Estado para modal de Perfil de Salud & IA
  const [isSaludModalOpen, setIsSaludModalOpen] = useState(false);
  const [saludLugar, setSaludLugar] = useState<LugarEntrenamiento>('GIMNASIO');
  const [saludDias, setSaludDias] = useState<number>(4);
  const [saludMinutos, setSaludMinutos] = useState<number>(60);
  const [saludEquipo, setSaludEquipo] = useState<string[]>(['MANCUERNAS', 'MAQUINAS_GYM']);
  const [saludMolestias, setSaludMolestias] = useState<string[]>(['NINGUNA']);
  const [saludTieneDiscapacidad, setSaludTieneDiscapacidad] = useState<boolean>(false);
  const [saludDetalleDiscapacidad, setSaludDetalleDiscapacidad] = useState<string>('');
  const [saludEnfermedades, setSaludEnfermedades] = useState<string>('');
  const [saludError, setSaludError] = useState<string | null>(null);

  const abrirModalSalud = () => {
    const p = activeUser?.perfilSalud;
    setSaludLugar(p?.lugarEntrenamiento || 'GIMNASIO');
    setSaludDias(p?.diasDisponiblesSemana || 4);
    setSaludMinutos(p?.minutosPorSesion || 60);
    setSaludEquipo(p?.equipamientoDisponible && p.equipamientoDisponible.length > 0 ? p.equipamientoDisponible : ['MANCUERNAS', 'MAQUINAS_GYM']);
    setSaludMolestias(p?.zonasMolestia && p.zonasMolestia.length > 0 ? p.zonasMolestia : ['NINGUNA']);
    setSaludTieneDiscapacidad(Boolean(p?.tieneDiscapacidad));
    setSaludDetalleDiscapacidad(p?.detalleDiscapacidad || '');
    setSaludEnfermedades(p?.enfermedadesPreexistentes || '');
    setSaludError(null);
    setIsSaludModalOpen(true);
  };

  const toggleSaludMolestia = (id: string) => {
    if (id === 'NINGUNA') {
      setSaludMolestias(['NINGUNA']);
      return;
    }
    setSaludMolestias((prev) => {
      const sinNinguna = prev.filter((m) => m !== 'NINGUNA');
      if (sinNinguna.includes(id)) {
        const next = sinNinguna.filter((m) => m !== id);
        return next.length === 0 ? ['NINGUNA'] : next;
      } else {
        return [...sinNinguna, id];
      }
    });
  };

  const toggleSaludEquipo = (id: string) => {
    setSaludEquipo((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((e) => e !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const updateSaludMutation = useMutation({
    mutationFn: async () => {
      if (!activeUser) throw new Error('No hay usuario activo');
      return usuariosApi.updatePerfilSalud(activeUser.id, {
        tieneDiscapacidad: saludTieneDiscapacidad,
        detalleDiscapacidad: saludTieneDiscapacidad ? saludDetalleDiscapacidad.trim() : undefined,
        zonasMolestia: saludMolestias.includes('NINGUNA') ? [] : saludMolestias,
        enfermedadesPreexistentes: saludEnfermedades.trim() || undefined,
        lugarEntrenamiento: saludLugar,
        equipamientoDisponible: saludEquipo,
        diasDisponiblesSemana: saludDias,
        minutosPorSesion: saludMinutos,
      });
    },
    onSuccess: async () => {
      await refreshUsers();
      setIsSaludModalOpen(false);
    },
    onError: (err: any) => {
      setSaludError(err.response?.data?.message || err.message || 'Error al guardar el perfil de salud');
    },
  });

  // Tab para selector de gráfica en el dashboard
  const [graficaTab, setGraficaTab] = useState<'ejercicios' | 'peso'>('ejercicios');

  const { data: rutinas = [] } = useQuery({
    queryKey: ['rutinas', activeUser?.id],
    queryFn: () => (activeUser ? rutinasApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  const { data: progresos = [] } = useQuery({
    queryKey: ['progresos', activeUser?.id],
    queryFn: () => (activeUser ? progresosApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  const { data: historialPesos = [] } = useQuery({
    queryKey: ['pesosCorporales', activeUser?.id],
    queryFn: () => (activeUser ? pesosCorporalesApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  // Mutación para actualizar peso rápido desde dashboard
  const updatePesoMutation = useMutation({
    mutationFn: async ({ peso, fecha, notas }: { peso: number; fecha?: string; notas?: string }) => {
      if (!activeUser) throw new Error('No user selected');
      return usuariosApi.actualizarPeso(activeUser.id, { peso, fecha, notas });
    },
    onSuccess: async () => {
      await refreshUsers();
      queryClient.invalidateQueries({ queryKey: ['pesosCorporales', activeUser?.id] });
      setIsPesoModalOpen(false);
      setPesoInput('');
      setNotasInput('');
      setPesoError(null);
    },
    onError: (err: any) => {
      setPesoError(err.response?.data?.message || 'Error al actualizar el peso corporal');
    },
  });

  const handleGuardarPeso = (e: React.FormEvent) => {
    e.preventDefault();
    const pesoNum = parseFloat(pesoInput);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      setPesoError('Ingresa un peso válido superior a 0 kg');
      return;
    }
    updatePesoMutation.mutate({
      peso: pesoNum,
      fecha: fechaInput || undefined,
      notas: notasInput.trim() || undefined,
    });
  };

  const abrirModalPeso = () => {
    setPesoInput(activeUser?.pesoActual ? String(activeUser.pesoActual) : '');
    setFechaInput(new Date().toISOString().split('T')[0]);
    setNotasInput('');
    setPesoError(null);
    setIsPesoModalOpen(true);
  };

  if (!activeUser && users.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] mx-auto flex items-center justify-center mb-5 border border-[var(--accent-primary)]/30">
          <Activity className="w-7 h-7" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] font-space mb-3 tracking-tight">
          Bienvenido a Fit<span className="text-[var(--accent-primary)]">Lite</span>
        </h1>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8 text-sm font-inter leading-relaxed">
          Inicia tu registro para acceder al panel de sobrecarga progresiva y gestión deportiva de rutinas.
        </p>
        <Link
          to="/usuarios"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all shadow-sm font-inter"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Crear primer perfil
        </Link>
      </div>
    );
  }

  const rutinasActivas = rutinas.filter((r) => r.activa);
  const ultimoProgreso = progresos.length > 0 ? progresos[0] : null;

  // Exercise Chart data in chronological order
  const chartData = [...progresos].reverse().slice(-10).map((p) => ({
    fecha: p.fecha.slice(5),
    peso: p.pesoRealizado || 0,
    reps: p.repeticionesRealizadas,
    ejercicio: p.ejercicioNombre,
  }));

  // Body weight chart data in chronological order
  const chartPesoData = [...historialPesos].reverse().slice(-10).map((p) => ({
    fecha: p.fecha.slice(5),
    peso: p.peso,
    notas: p.notas || '',
  }));

  const maxPeso = progresos.length > 0 ? Math.max(...progresos.map((p) => p.pesoRealizado || 0)) : 0;
  const totalSeries = progresos.reduce((acc, p) => acc + p.seriesRealizadas, 0);

  // Body weight calculations
  const pesoActual = activeUser?.pesoActual ?? (historialPesos.length > 0 ? historialPesos[0].peso : null);
  const pesoPrevio = historialPesos.length > 1 ? historialPesos[1].peso : null;
  const pesoDiff = pesoActual !== null && pesoPrevio !== null ? Number((pesoActual - pesoPrevio).toFixed(1)) : null;
  const ultimoPesaje = historialPesos.length > 0 ? historialPesos[0] : null;

  // Calculation for adherence percentage
  const adherencia = progresos.length > 0 ? Math.min(Math.round((progresos.length / 4) * 100), 100) : 85;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-primary)] tracking-wide mb-1 font-space">
            <Flame className="w-4 h-4" strokeWidth={2} />
            <span>Monitoreo activo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-space tracking-tight">
            Centro de mando / <span className="text-[var(--accent-primary)]">{activeUser?.nombre}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-inter mt-1">
            Parámetros de sobrecarga progresiva, peso corporal y métricas de rendimiento en tiempo real.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={abrirModalPeso}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] text-xs font-semibold hover:bg-[var(--accent-primary)]/10 active:scale-95 transition-all font-inter"
          >
            <Scale className="w-3.5 h-3.5" strokeWidth={2.2} />
            Actualizar peso
          </button>
          <Link
            to="/progreso"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            Registrar sesión
          </Link>
          <Link
            to="/rutinas"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-medium hover:border-[var(--accent-primary)]/50 active:scale-95 transition-all font-inter"
          >
            <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" strokeWidth={2} />
            Rutinas ({rutinas.length})
          </Link>
        </div>
      </div>

      {/* FILA DE MÉTRICAS: CARGA PICO + PESO CORPORAL EDITABLE + FRANJA COMPACTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        {/* TARJETA 1: CARGA PICO (4 cols) */}
        <div className="lg:col-span-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[var(--accent-primary)]/40 transition-colors">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] font-space">
                    Carga pico
                  </span>
                  <h3 className="text-xs text-[var(--text-secondary)]/80 font-inter mt-0.5">
                    Máxima resistencia
                  </h3>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-space text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30">
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.2} />
                <span>+6.4%</span>
              </div>
            </div>

            <div className="mt-6 mb-2">
              <div className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] font-space tracking-tight flex items-baseline gap-2 tabular-nums">
                <AnimatedCounter value={maxPeso} decimals={1} suffix=" kg" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] mt-4 flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)] font-inter flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
              {ultimoProgreso ? ultimoProgreso.ejercicioNombre : 'Sin registros aún'}
            </span>
            <span className="text-[var(--accent-primary)] font-space text-xs shrink-0 font-medium">
              {ultimoProgreso ? ultimoProgreso.fecha : 'Pendiente'}
            </span>
          </div>
        </div>

        {/* TARJETA 2: PESO CORPORAL ACTUAL EDITABLE (4 cols) */}
        <div className="lg:col-span-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[var(--accent-primary)]/40 transition-colors">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] font-space">
                    Peso corporal
                  </span>
                  <h3 className="text-xs text-[var(--text-secondary)]/80 font-inter mt-0.5">
                    Perfil del atleta
                  </h3>
                </div>
              </div>

              {/* Botón rápido de edición */}
              <button
                onClick={abrirModalPeso}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-inter text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 transition-all active:scale-95"
                title="Editar peso actual"
              >
                <Edit3 className="w-3 h-3" />
                <span>Editar</span>
              </button>
            </div>

            <div className="mt-6 mb-2">
              {pesoActual !== null && pesoActual > 0 ? (
                <div className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] font-space tracking-tight flex items-baseline gap-2 tabular-nums">
                  <AnimatedCounter value={pesoActual} decimals={1} suffix=" kg" />
                </div>
              ) : (
                <div className="py-2">
                  <span className="text-2xl font-bold text-[var(--text-secondary)] font-space">
                    Sin registrar
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] mt-4 flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)] font-inter flex items-center gap-1.5 truncate">
              {pesoDiff !== null ? (
                <span className={`inline-flex items-center gap-1 font-space font-medium ${pesoDiff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {pesoDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {pesoDiff > 0 ? `+${pesoDiff} kg` : `${pesoDiff} kg`}
                  <span className="text-[var(--text-secondary)] font-inter font-normal ml-1">vs anterior</span>
                </span>
              ) : (
                <span className="text-[var(--text-secondary)]">
                  {historialPesos.length > 0 ? '1er registro histórico' : 'Toca "Editar" para registrar'}
                </span>
              )}
            </span>
            <span className="text-[var(--text-secondary)] font-space text-xs shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {ultimoPesaje ? ultimoPesaje.fecha : 'Hoy'}
            </span>
          </div>
        </div>

        {/* TARJETA 3: FRANJA COMPACTA ADHERENCIA Y VOLUMEN (4 cols) */}
        <div className="lg:col-span-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl grid grid-cols-2 divide-x divide-[var(--border)] p-2">
          {/* Subcolumna 1: Adherencia Circular */}
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <CircularProgress
              percentage={adherencia}
              size={76}
              strokeWidth={6.5}
              label="Adherencia"
              sublabel="Plan activo"
            />
          </div>

          {/* Subcolumna 2: Volumen y Metas */}
          <div className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] font-space">
                  Volumen total
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" strokeWidth={2} />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] font-space tabular-nums">
                <AnimatedCounter value={totalSeries} />
                <span className="text-[11px] text-[var(--accent-primary)] font-semibold ml-1.5 font-inter">
                  series
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">Objetivo</span>
                <Badge type="objetivo" value={activeUser?.objetivo || 'MANTENER'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">Rol</span>
                <Badge type="rol" value={activeUser?.rol || 'USUARIO'} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTA DEL MOTOR DE IA / PERFIL DE SALUD Y SEGURIDAD */}
      <div className="bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-[var(--accent-secondary)] text-[#0D1117] flex items-center justify-center shrink-0 font-bold shadow-sm">
            <Zap className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[var(--accent-secondary)] font-space">
                Calibración del Motor IA
              </span>
              {activeUser?.perfilSalud && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-inter">
                  Perfil de salud activo
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-primary)] font-inter">
              {activeUser?.perfilSalud ? (
                <>
                  Entrenando en <strong className="text-[var(--accent-primary)]">{activeUser.perfilSalud.lugarEntrenamiento?.toLowerCase()}</strong> ({activeUser.perfilSalud.diasDisponiblesSemana} días/sem · {activeUser.perfilSalud.minutosPorSesion} min).
                  {activeUser.perfilSalud.zonasMolestia && activeUser.perfilSalud.zonasMolestia.length > 0 && (
                    <span className="text-amber-300 ml-1">
                      Zonas protegidas contra impacto: {activeUser.perfilSalud.zonasMolestia.join(', ')}.
                    </span>
                  )}
                  {activeUser.perfilSalud.tieneDiscapacidad && activeUser.perfilSalud.detalleDiscapacidad && (
                    <span className="text-sky-300 ml-1">
                      Adaptación motriz: {activeUser.perfilSalud.detalleDiscapacidad}.
                    </span>
                  )}
                </>
              ) : (
                'Registra tus restricciones articulares, equipo disponible y condiciones de salud para que la IA calibre tus cargas y rutinas con máxima seguridad.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-end md:self-center">
          <Link
            to="/coach"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[#0D1117] text-xs font-bold hover:brightness-110 transition-all active:scale-95 font-inter cursor-pointer shadow-md shadow-[var(--accent-primary)]/20"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Hablar con Coach IA</span>
          </Link>
          <button
            onClick={abrirModalSalud}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] text-xs font-semibold hover:bg-[var(--accent-primary)]/25 transition-all active:scale-95 font-inter cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{activeUser?.perfilSalud ? 'Modificar salud e IA' : 'Configurar salud e IA'}</span>
          </button>
          <Link
            to="/rutinas"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-secondary)] hover:opacity-80 transition-opacity font-inter whitespace-nowrap bg-[var(--accent-secondary)]/10 px-3.5 py-2 rounded-xl border border-[var(--accent-secondary)]/30"
          >
            <span>Ver rutinas</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Gráfica de Progreso y Listado de Rutinas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica Analítica con Selector de Modo (2 cols) */}
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--text-primary)] font-space tracking-tight">
                  {graficaTab === 'ejercicios'
                    ? 'Historial de sobrecarga progresiva (kg)'
                    : 'Evolución de peso corporal (kg)'}
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                {graficaTab === 'ejercicios'
                  ? 'Trazo de cargas progresivas registradas en ejercicios'
                  : 'Seguimiento cronológico del peso corporal del atleta'}
              </p>
            </div>

            {/* Selector de modo y enlaces */}
            <div className="flex items-center gap-2">
              <div className="flex items-center p-0.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full text-xs font-inter">
                <button
                  onClick={() => setGraficaTab('ejercicios')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    graficaTab === 'ejercicios'
                      ? 'bg-[var(--accent-primary)] text-[#0D1117] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Cargas
                </button>
                <button
                  onClick={() => setGraficaTab('peso')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    graficaTab === 'peso'
                      ? 'bg-[var(--accent-primary)] text-[#0D1117] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Peso corporal
                </button>
              </div>

              <Link
                to="/progreso"
                className="inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:opacity-80 transition-opacity font-medium font-inter ml-1"
              >
                <span>Detalles</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {graficaTab === 'ejercicios' ? (
            chartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-primary)]/50">
                <Dumbbell className="w-8 h-8 text-[var(--text-secondary)] mb-2" strokeWidth={1.5} />
                <p className="text-xs font-inter">Aún no hay registros de carga para trazar la curva.</p>
                <Link to="/progreso" className="inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] mt-2 font-semibold font-inter">
                  <span>Registrar primera carga</span>
                  <span>→</span>
                </Link>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cyberGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B7FF3B" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#B7FF3B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E343B" vertical={false} />
                    <XAxis dataKey="fecha" stroke="#A0A7B2" fontSize={10} tickLine={false} />
                    <YAxis stroke="#A0A7B2" fontSize={10} tickLine={false} unit="kg" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1F26',
                        borderColor: '#2E343B',
                        borderRadius: '12px',
                        color: '#F5F7FA',
                        fontSize: '11px',
                        boxShadow: 'none',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="peso"
                      name="Peso de ejercicio"
                      stroke="#B7FF3B"
                      strokeWidth={3}
                      isAnimationActive={true}
                      animationDuration={1100}
                      fillOpacity={1}
                      fill="url(#cyberGreen)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )
          ) : (
            chartPesoData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-primary)]/50">
                <Scale className="w-8 h-8 text-[var(--text-secondary)] mb-2" strokeWidth={1.5} />
                <p className="text-xs font-inter">Aún no hay registros en la tabla de seguimiento de peso corporal.</p>
                <button
                  onClick={abrirModalPeso}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter hover:brightness-105 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Registrar primer pesaje
                </button>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartPesoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bodyWeightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E343B" vertical={false} />
                    <XAxis dataKey="fecha" stroke="#A0A7B2" fontSize={10} tickLine={false} />
                    <YAxis stroke="#A0A7B2" fontSize={10} tickLine={false} unit="kg" domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1F26',
                        borderColor: '#2E343B',
                        borderRadius: '12px',
                        color: '#F5F7FA',
                        fontSize: '11px',
                        boxShadow: 'none',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="peso"
                      name="Peso corporal"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      isAnimationActive={true}
                      animationDuration={1100}
                      fillOpacity={1}
                      fill="url(#bodyWeightGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )
          )}
        </div>

        {/* Rutinas Asignadas (1 col) */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)] font-space tracking-tight">
                Rutinas activas
              </h2>
              <Link to="/rutinas" className="inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:opacity-80 transition-opacity font-medium font-inter">
                <span>Ver todas</span>
                <span>→</span>
              </Link>
            </div>

            {rutinasActivas.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-primary)]/40">
                <Target className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-xs font-inter">No tienes rutinas activas.</p>
                <Link
                  to="/rutinas"
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter hover:brightness-105 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Crear rutina
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {rutinasActivas.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text-primary)] font-space">{r.nombre}</h4>
                      <p className="text-xs text-[var(--text-secondary)] font-inter line-clamp-1 mt-0.5">
                        {r.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                    <Badge type="status" value={r.activa} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--border)] mt-4">
            <Link
              to="/rutinas"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[var(--bg-primary)] hover:border-[var(--accent-primary)]/50 border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] transition-all font-inter active:scale-95"
            >
              Configurar ejercicios y series
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Actualización Rápida de Peso Corporal */}
      <Modal
        isOpen={isPesoModalOpen}
        onClose={() => {
          setIsPesoModalOpen(false);
          setPesoError(null);
        }}
        title="Actualizar peso corporal"
      >
        <form onSubmit={handleGuardarPeso} className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)] font-inter">
            Ingresa tu peso corporal actual. Se actualizará en tu perfil y quedará asentado en el historial de pesajes.
          </p>

          {pesoError && (
            <div className="p-3 rounded-xl bg-[var(--accent-error)]/10 border border-[var(--accent-error)]/30 text-[var(--accent-error)] text-xs font-inter">
              {pesoError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Peso actual (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              value={pesoInput}
              onChange={(e) => setPesoInput(e.target.value)}
              placeholder="Ej. 74.8"
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Fecha del pesaje
            </label>
            <input
              type="date"
              value={fechaInput}
              onChange={(e) => setFechaInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Observaciones (Opcional)
            </label>
            <input
              type="text"
              value={notasInput}
              onChange={(e) => setNotasInput(e.target.value)}
              placeholder="Ej. En ayunas al despertar"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsPesoModalOpen(false)}
              className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updatePesoMutation.isPending}
              className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter"
            >
              {updatePesoMutation.isPending ? 'Guardando...' : 'Guardar y registrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Configuración de Perfil de Salud & IA */}
      <Modal
        isOpen={isSaludModalOpen}
        onClose={() => setIsSaludModalOpen(false)}
        title="Perfil de Salud, Restricciones y Entorno IA"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateSaludMutation.mutate();
          }}
          className="space-y-4"
        >
          {saludError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 font-inter">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{saludError}</span>
            </div>
          )}

          {/* Lugar de entrenamiento */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Lugar habitual de entrenamiento
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'GIMNASIO' as const, label: 'Gimnasio', icon: Building2 },
                { id: 'CASA' as const, label: 'En Casa', icon: Home },
                { id: 'CALISTENIA_PARQUE' as const, label: 'Parque', icon: Trees },
              ].map((loc) => {
                const Icon = loc.icon;
                const isSelected = saludLugar === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSaludLugar(loc.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all font-inter flex flex-col items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
                        : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{loc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frecuencia y Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                Días por semana
              </label>
              <div className="flex gap-1.5">
                {[2, 3, 4, 5, 6].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setSaludDias(days)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-space font-medium transition-all cursor-pointer ${
                      saludDias === days
                        ? 'bg-[var(--accent-primary)] text-[#0D1117] font-bold'
                        : 'bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                Minutos por sesión
              </label>
              <div className="flex gap-1.5">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSaludMinutos(mins)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-space font-medium transition-all cursor-pointer ${
                      saludMinutos === mins
                        ? 'bg-[var(--accent-primary)] text-[#0D1117] font-bold'
                        : 'bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {mins}'
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Equipamiento disponible */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Equipamiento disponible
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPAMIENTOS_LIST.map((item) => {
                const isChecked = saludEquipo.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSaludEquipo(item.id)}
                    className={`px-3 py-1 rounded-full text-xs font-inter transition-all flex items-center gap-1 border cursor-pointer ${
                      isChecked
                        ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
                        : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dolores o molestias articulares */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)] font-inter flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Zonas con dolor o molestia (a proteger):
              </label>
              <span className="text-[10px] text-[var(--text-secondary)] opacity-80">
                {saludMolestias.includes('NINGUNA') ? 'Sin dolor' : `${saludMolestias.length} zona(s)`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ZONAS_MOLESTIA_LIST.map((zona) => {
                const isChecked = saludMolestias.includes(zona.id);
                const isNone = zona.id === 'NINGUNA';
                return (
                  <button
                    key={zona.id}
                    type="button"
                    onClick={() => toggleSaludMolestia(zona.id)}
                    className={`px-3 py-1 rounded-full text-xs font-inter transition-all flex items-center gap-1 border cursor-pointer ${
                      isChecked
                        ? isNone
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3" />}
                    <span>{zona.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discapacidad o limitación física */}
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-primary)] font-inter">
                ¿Presentas alguna discapacidad o limitación motriz?
              </span>
              <button
                type="button"
                onClick={() => setSaludTieneDiscapacidad(!saludTieneDiscapacidad)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  saludTieneDiscapacidad ? 'bg-[var(--accent-primary)]' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-black transition-transform absolute top-0.5 ${
                    saludTieneDiscapacidad ? 'translate-x-5' : 'translate-x-0.5 bg-white/70'
                  }`}
                />
              </button>
            </div>
            {saludTieneDiscapacidad && (
              <input
                type="text"
                value={saludDetalleDiscapacidad}
                onChange={(e) => setSaludDetalleDiscapacidad(e.target.value)}
                placeholder="Detalle: ej. movilidad reducida en tren inferior, prótesis..."
                className="w-full px-3 py-2 rounded-lg bg-[#0D1117] border border-amber-500/40 text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/40 focus:outline-none focus:border-amber-400 font-inter"
              />
            )}
          </div>

          {/* Enfermedades preexistentes */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5 flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              Enfermedades o condiciones de salud (Opcional):
            </label>
            <input
              type="text"
              value={saludEnfermedades}
              onChange={(e) => setSaludEnfermedades(e.target.value)}
              placeholder="Ej. Asma, hipertensión arterial, diabetes..."
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/40 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setIsSaludModalOpen(false)}
              className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateSaludMutation.isPending}
              className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-bold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              {updateSaludMutation.isPending ? 'Guardando...' : 'Guardar y calibrar IA'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
