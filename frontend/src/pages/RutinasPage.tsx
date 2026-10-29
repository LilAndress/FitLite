import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Calendar, 
  Dumbbell, 
  Trash2, 
  Power,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  ClipboardList,
  RefreshCw,
  Info,
  X
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { rutinasApi } from '../api/rutinas.api';
import { ejerciciosApi } from '../api/ejercicios.api';
import type { Rutina, RutinaIaBorradorResponse } from '../types';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { EjercicioCombobox } from '../components/EjercicioCombobox';

// Zod schemas
const rutinaSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  descripcion: z.string().optional(),
});

type RutinaFormValues = z.infer<typeof rutinaSchema>;

const ejercicioSchema = z.object({
  ejercicioCatalogoId: z.number().optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  seriesObjetivo: z.coerce.number().min(1, 'Mínimo 1 serie'),
  repeticionesObjetivo: z.coerce.number().min(1, 'Mínimo 1 repetición'),
  pesoObjetivo: z.coerce.number().min(0, 'El peso no puede ser negativo').optional(),
});

type EjercicioFormValues = z.infer<typeof ejercicioSchema>;

// IA Modal Steps
type IaStep = 'choose' | 'manual' | 'ia-form' | 'ia-loading' | 'ia-preview' | 'ia-error';

export const RutinasPage: React.FC = () => {
  const { activeUser } = useUser();
  const queryClient = useQueryClient();

  const [expandedRutinaId, setExpandedRutinaId] = useState<number | null>(null);
  const [isRutinaModalOpen, setIsRutinaModalOpen] = useState(false);
  const [iaStep, setIaStep] = useState<IaStep>('choose');
  const [selectedRutinaForEjercicio, setSelectedRutinaForEjercicio] = useState<Rutina | null>(null);

  // IA state
  const [iaFormData, setIaFormData] = useState({
    diasPorSemana: 4,
    minutosPorSesion: 60,
    enfoque: '',
  });
  const [iaBorrador, setIaBorrador] = useState<RutinaIaBorradorResponse | null>(null);
  const [iaError, setIaError] = useState<string | null>(null);

  // Queries
  const { data: rutinas = [], isLoading } = useQuery({
    queryKey: ['rutinas', activeUser?.id],
    queryFn: () => (activeUser ? rutinasApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  // Routine Form
  const {
    register: registerRutina,
    handleSubmit: handleRutinaSubmit,
    reset: resetRutinaForm,
    formState: { errors: rutinaErrors },
  } = useForm<RutinaFormValues>({
    resolver: zodResolver(rutinaSchema),
  });

  // Exercise Form
  const {
    register: registerEjercicio,
    handleSubmit: handleEjercicioSubmit,
    reset: resetEjercicioForm,
    setValue: setEjercicioValue,
    watch: watchEjercicio,
    formState: { errors: ejercicioErrors },
  } = useForm<EjercicioFormValues>({
    resolver: zodResolver(ejercicioSchema),
    defaultValues: {
      nombre: '',
      seriesObjetivo: 4,
      repeticionesObjetivo: 10,
      pesoObjetivo: 0,
    },
  });

  // Mutations
  const createRutinaMutation = useMutation({
    mutationFn: (data: RutinaFormValues) => {
      if (!activeUser) throw new Error('No user selected');
      return rutinasApi.create({
        nombre: data.nombre,
        descripcion: data.descripcion,
        activa: true,
        usuarioId: activeUser.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutinas', activeUser?.id] });
      closeModal();
    },
  });

  const toggleRutinaMutation = useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) =>
      rutinasApi.toggleEstado(id, activa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutinas', activeUser?.id] });
    },
  });

  const deleteRutinaMutation = useMutation({
    mutationFn: (id: number) => rutinasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutinas', activeUser?.id] });
    },
  });

  const createEjercicioMutation = useMutation({
    mutationFn: (data: EjercicioFormValues) => {
      if (!selectedRutinaForEjercicio) throw new Error('No routine selected');
      return ejerciciosApi.create({
        ejercicioCatalogoId: data.ejercicioCatalogoId,
        nombre: data.nombre.trim(),
        seriesObjetivo: Number(data.seriesObjetivo),
        repeticionesObjetivo: Number(data.repeticionesObjetivo),
        pesoObjetivo: data.pesoObjetivo !== undefined ? Number(data.pesoObjetivo) : 0,
        rutinaId: selectedRutinaForEjercicio.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios', selectedRutinaForEjercicio?.id] });
      queryClient.invalidateQueries({ queryKey: ['ejerciciosDisponibles'] });
      setSelectedRutinaForEjercicio(null);
      resetEjercicioForm();
    },
  });

  const deleteEjercicioMutation = useMutation({
    mutationFn: (id: number) => ejerciciosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
    },
  });

  // IA Mutations
  const generarBorradorMutation = useMutation({
    mutationFn: () => {
      if (!activeUser) throw new Error('No user selected');
      return rutinasApi.generarBorradorIa({
        usuarioId: activeUser.id,
        diasPorSemana: iaFormData.diasPorSemana,
        minutosPorSesion: iaFormData.minutosPorSesion,
        enfoque: iaFormData.enfoque || undefined,
      });
    },
    onSuccess: (data) => {
      setIaBorrador(data);
      setIaStep('ia-preview');
      setIaError(null);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Error al generar la rutina. Intenta nuevamente.';
      setIaError(msg);
      setIaStep('ia-error');
    },
  });

  const guardarBorradorMutation = useMutation({
    mutationFn: () => {
      if (!activeUser || !iaBorrador) throw new Error('No data');
      return rutinasApi.guardarBorradorIa({
        usuarioId: activeUser.id,
        nombre: iaBorrador.nombre,
        descripcion: iaBorrador.descripcion,
        ejercicios: iaBorrador.ejercicios.map((ej) => ({
          nombre: ej.nombre,
          grupoMuscular: ej.grupoMuscular,
          seriesObjetivo: ej.seriesObjetivo,
          repeticionesObjetivo: ej.repeticionesObjetivo,
          pesoObjetivo: ej.pesoObjetivo,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutinas', activeUser?.id] });
      closeModal();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Error al guardar la rutina.';
      setIaError(msg);
    },
  });

  // Helpers
  const closeModal = () => {
    setIsRutinaModalOpen(false);
    setIaStep('choose');
    setIaBorrador(null);
    setIaError(null);
    resetRutinaForm();
    setIaFormData({ diasPorSemana: 4, minutosPorSesion: 60, enfoque: '' });
  };

  const handleGenerarClick = () => {
    setIaStep('ia-loading');
    generarBorradorMutation.mutate();
  };

  const handleRegenerarClick = () => {
    setIaStep('ia-loading');
    setIaBorrador(null);
    generarBorradorMutation.mutate();
  };

  const handleRemoveEjercicioBorrador = (index: number) => {
    if (!iaBorrador) return;
    const updated = {
      ...iaBorrador,
      ejercicios: iaBorrador.ejercicios.filter((_, i) => i !== index),
    };
    setIaBorrador(updated);
  };

  const handleRetryClick = () => {
    setIaError(null);
    setIaStep('ia-loading');
    generarBorradorMutation.mutate();
  };

  if (!activeUser) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--accent-secondary)] mx-auto mb-3" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-[var(--text-primary)] font-space mb-2 tracking-tight">Selecciona un perfil</h2>
        <p className="text-[var(--text-secondary)] text-xs font-inter">
          Selecciona un usuario en la barra superior para gestionar sus rutinas.
        </p>
      </div>
    );
  }

  // Render IA modal content based on step
  const renderModalContent = () => {
    switch (iaStep) {
      case 'choose':
        return (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)] font-inter mb-2">
              ¿Cómo quieres crear tu rutina?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card: Manual */}
              <button
                onClick={() => setIaStep('manual')}
                className="group p-5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 transition-all text-left space-y-3 active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--accent-primary)]/40 transition-colors">
                  <ClipboardList className="w-5 h-5 text-[var(--accent-primary)]" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] font-space tracking-tight">Ya tengo mi rutina</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] font-inter mt-1">
                    Crea la rutina manualmente con nombre, descripción y ejercicios.
                  </p>
                </div>
              </button>

              {/* Card: IA */}
              <button
                onClick={() => setIaStep('ia-form')}
                className="group p-5 rounded-xl bg-[var(--bg-primary)] border border-[var(--accent-secondary)]/30 hover:border-[var(--accent-secondary)]/60 transition-all text-left space-y-3 active:scale-[0.98] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-secondary)]/5 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[var(--accent-secondary)]" strokeWidth={2} />
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] font-space tracking-tight">Que la IA la cree por mí</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] font-inter mt-1">
                      Describe tus preferencias y la IA generará una rutina personalizada.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case 'manual':
        return (
          <form onSubmit={handleRutinaSubmit((data) => createRutinaMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                Nombre de la rutina *
              </label>
              <input
                {...registerRutina('nombre')}
                placeholder="Ej. Espalda & Bíceps - Hipertrofia"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
              />
              {rutinaErrors.nombre && (
                <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{rutinaErrors.nombre.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                Descripción / Notas
              </label>
              <textarea
                {...registerRutina('descripcion')}
                placeholder="Detalles de la sesión, calentamiento y grupos musculares..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
              />
            </div>

            <div className="flex justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={() => { setIaStep('choose'); resetRutinaForm(); }}
                className="px-4 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
              >
                ← Volver
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createRutinaMutation.isPending}
                  className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter"
                >
                  {createRutinaMutation.isPending ? 'Guardando...' : 'Crear rutina'}
                </button>
              </div>
            </div>
          </form>
        );

      case 'ia-form':
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-1">
              <Sparkles className="w-4 h-4 text-[var(--accent-secondary)]" strokeWidth={2} />
              <span className="text-xs font-semibold text-[var(--accent-secondary)] font-space tracking-tight">Configuración IA</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                  Días por semana *
                </label>
                <select
                  value={iaFormData.diasPorSemana}
                  onChange={(e) => setIaFormData((p) => ({ ...p, diasPorSemana: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-secondary)] font-inter appearance-none cursor-pointer"
                >
                  {[2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>{d} días</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                  Minutos por sesión *
                </label>
                <select
                  value={iaFormData.minutosPorSesion}
                  onChange={(e) => setIaFormData((p) => ({ ...p, minutosPorSesion: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-secondary)] font-inter appearance-none cursor-pointer"
                >
                  {[30, 45, 60, 90].map((m) => (
                    <option key={m} value={m}>{m} min</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                Enfoque (opcional)
              </label>
              <input
                value={iaFormData.enfoque}
                onChange={(e) => setIaFormData((p) => ({ ...p, enfoque: e.target.value }))}
                placeholder="Ej. pierna, full body, fuerza upper body"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-secondary)] font-inter"
              />
            </div>

            <div className="flex justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIaStep('choose')}
                className="px-4 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
              >
                ← Volver
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGenerarClick}
                  className="px-6 py-2 rounded-full bg-[var(--accent-secondary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Generar rutina
                </button>
              </div>
            </div>
          </div>
        );

      case 'ia-loading':
        return (
          <div className="py-10 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/30 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[var(--accent-secondary)] animate-pulse" strokeWidth={2} />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-bold text-[var(--text-primary)] font-space tracking-tight">Armando tu rutina...</h4>
                <p className="text-[11px] text-[var(--text-secondary)] font-inter mt-1">La IA está personalizando ejercicios para tu perfil</p>
              </div>
            </div>

            {/* Skeleton */}
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-[var(--border)]/50 rounded-lg w-3/4" />
              <div className="h-3 bg-[var(--border)]/30 rounded-lg w-full" />
              <div className="h-3 bg-[var(--border)]/30 rounded-lg w-5/6" />
              <div className="mt-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                    <div className="w-8 h-8 rounded-full bg-[var(--border)]/40 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-[var(--border)]/50 rounded w-2/3" />
                      <div className="h-2.5 bg-[var(--border)]/30 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'ia-error':
        return (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--accent-error)]/10 border border-[var(--accent-error)]/30 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-[var(--accent-error)]" strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)] font-space tracking-tight">No pudimos generar la rutina</h4>
              <p className="text-[11px] text-[var(--text-secondary)] font-inter mt-1.5 max-w-sm mx-auto">
                {iaError || 'Ocurrió un error inesperado. Intenta nuevamente.'}
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRetryClick}
                className="px-6 py-2 rounded-full bg-[var(--accent-secondary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.5} />
                Reintentar
              </button>
            </div>
          </div>
        );

      case 'ia-preview':
        if (!iaBorrador) return null;
        return (
          <div className="space-y-5 -mx-1">
            {/* Routine header */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-secondary)]" strokeWidth={2} />
                <span className="text-[11px] font-semibold text-[var(--accent-secondary)] font-space tracking-tight">Vista previa del borrador</span>
              </div>
              <h4 className="text-base font-bold text-[var(--text-primary)] font-space tracking-tight">{iaBorrador.nombre}</h4>
              <p className="text-xs text-[var(--text-secondary)] font-inter">{iaBorrador.descripcion}</p>
            </div>

            {/* Exercises list */}
            <div className="space-y-2">
              <h5 className="text-[11px] font-semibold text-[var(--text-secondary)] font-space flex items-center gap-1.5 uppercase tracking-wider">
                <Dumbbell className="w-3.5 h-3.5 text-[var(--accent-primary)]" strokeWidth={2} />
                Ejercicios ({iaBorrador.ejercicios.length})
              </h5>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {iaBorrador.ejercicios.map((ej, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] group hover:border-[var(--accent-primary)]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h6 className="text-xs font-semibold text-[var(--text-primary)] font-space">{ej.nombre}</h6>
                          {ej.grupoMuscular && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 font-inter">
                              {ej.grupoMuscular}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-space tabular-nums">
                          <span className="text-[var(--text-primary)] font-semibold">{ej.seriesObjetivo} series</span>
                          <span className="text-[var(--text-secondary)]">×</span>
                          <span className="text-[var(--text-primary)] font-semibold">{ej.repeticionesObjetivo} reps</span>
                          <span className="text-[var(--text-secondary)]">•</span>
                          {ej.pesoObjetivo != null ? (
                            <span className="text-[var(--accent-primary)] font-bold">{ej.pesoObjetivo} kg</span>
                          ) : (
                            <span className="text-[var(--text-secondary)] italic text-[11px]">Por definir</span>
                          )}
                        </div>
                        {ej.nota && (
                          <p className="text-[10px] text-[var(--text-secondary)] font-inter mt-1.5 flex items-start gap-1">
                            <Info className="w-3 h-3 mt-0.5 shrink-0 text-[var(--accent-secondary)]" strokeWidth={2} />
                            {ej.nota}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveEjercicioBorrador(idx)}
                        className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        title="Quitar ejercicio"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Razonamiento */}
            {iaBorrador.razonamiento && (
              <div className="p-4 rounded-xl bg-[var(--accent-secondary)]/5 border border-[var(--accent-secondary)]/20">
                <h5 className="text-[11px] font-semibold text-[var(--accent-secondary)] font-space mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                  Por qué esta rutina
                </h5>
                <p className="text-xs text-[var(--text-secondary)] font-inter leading-relaxed">
                  {iaBorrador.razonamiento}
                </p>
              </div>
            )}

            {/* Error al guardar */}
            {iaError && (
              <div className="p-3 rounded-xl bg-[var(--accent-error)]/10 border border-[var(--accent-error)]/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--accent-error)] shrink-0" strokeWidth={2} />
                <p className="text-[11px] text-[var(--accent-error)] font-inter">{iaError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRegenerarClick}
                  disabled={generarBorradorMutation.isPending}
                  className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all flex items-center gap-1.5 hover:border-[var(--accent-secondary)]/40 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
                  Regenerar
                </button>
                <button
                  type="button"
                  onClick={() => guardarBorradorMutation.mutate()}
                  disabled={guardarBorradorMutation.isPending || iaBorrador.ejercicios.length === 0}
                  className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter"
                >
                  {guardarBorradorMutation.isPending ? 'Guardando...' : 'Guardar en mis rutinas'}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (iaStep) {
      case 'choose': return 'Nueva rutina';
      case 'manual': return 'Crear rutina manual';
      case 'ia-form': return 'Rutina con IA';
      case 'ia-loading': return 'Generando rutina';
      case 'ia-preview': return 'Borrador de rutina';
      case 'ia-error': return 'Error de generación';
      default: return 'Nueva rutina';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-space flex items-center gap-3 tracking-tight">
            <Calendar className="w-6 h-6 text-[var(--accent-primary)]" strokeWidth={2} />
            Planes de entrenamiento / <span className="text-[var(--accent-primary)]">{activeUser.nombre}</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
            Programación semanal de cargas, ejercicios y microciclos biomecánicos.
          </p>
        </div>

        {/* Primary Pill Button */}
        <button
          onClick={() => setIsRutinaModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all self-start sm:self-auto font-inter"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nueva rutina
        </button>
      </div>

      {/* Routine Cards List */}
      {isLoading ? (
        <div className="py-12 text-center text-[var(--text-secondary)] text-xs font-inter">Cargando rutinas...</div>
      ) : rutinas.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]">
          <Calendar className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] font-space">No hay rutinas asignadas</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 mb-5 font-inter">
            Crea una rutina (ej. "Hipertrofia - Torso") y añade los ejercicios con sus series y peso objetivo.
          </p>
          <button
            onClick={() => setIsRutinaModalOpen(true)}
            className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter hover:brightness-105 active:scale-95 transition-all"
          >
            + Crear primera rutina
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rutinas.map((rutina, idx) => (
            <RutinaItem
              key={rutina.id}
              rutina={rutina}
              hasAiAdjustment={idx === 0}
              isExpanded={expandedRutinaId === rutina.id}
              onToggleExpand={() =>
                setExpandedRutinaId(expandedRutinaId === rutina.id ? null : rutina.id)
              }
              onToggleStatus={() =>
                toggleRutinaMutation.mutate({ id: rutina.id, activa: !rutina.activa })
              }
              onDelete={() => deleteRutinaMutation.mutate(rutina.id)}
              onAddEjercicio={() => setSelectedRutinaForEjercicio(rutina)}
              onDeleteEjercicio={(eId) => deleteEjercicioMutation.mutate(eId)}
            />
          ))}
        </div>
      )}

      {/* Modal Nueva Rutina (multi-step) */}
      <Modal
        isOpen={isRutinaModalOpen}
        onClose={closeModal}
        title={getModalTitle()}
        maxWidth={iaStep === 'ia-preview' ? 'max-w-2xl' : 'max-w-lg'}
      >
        {renderModalContent()}
      </Modal>

      {/* Modal Nuevo Ejercicio */}
      <Modal
        isOpen={Boolean(selectedRutinaForEjercicio)}
        onClose={() => setSelectedRutinaForEjercicio(null)}
        title={`Añadir ejercicio a ${selectedRutinaForEjercicio?.nombre || ''}`}
      >
        <form onSubmit={handleEjercicioSubmit((data) => createEjercicioMutation.mutate(data))} className="space-y-4">
          <EjercicioCombobox
            value={watchEjercicio('nombre') || ''}
            selectedCatalogoId={watchEjercicio('ejercicioCatalogoId')}
            onChange={(nombre, catalogoId) => {
              setEjercicioValue('nombre', nombre, { shouldValidate: true });
              setEjercicioValue('ejercicioCatalogoId', catalogoId);
            }}
            error={ejercicioErrors.nombre?.message}
          />

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Series *
              </label>
              <input
                type="number"
                {...registerEjercicio('seriesObjetivo')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {ejercicioErrors.seriesObjetivo && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{ejercicioErrors.seriesObjetivo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Reps *
              </label>
              <input
                type="number"
                {...registerEjercicio('repeticionesObjetivo')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {ejercicioErrors.repeticionesObjetivo && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{ejercicioErrors.repeticionesObjetivo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.5"
                {...registerEjercicio('pesoObjetivo')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {ejercicioErrors.pesoObjetivo && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{ejercicioErrors.pesoObjetivo.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setSelectedRutinaForEjercicio(null)}
              className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createEjercicioMutation.isPending}
              className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter"
            >
              {createEjercicioMutation.isPending ? 'Guardando...' : 'Añadir ejercicio'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Subcomponente de Rutina individual
interface RutinaItemProps {
  rutina: Rutina;
  hasAiAdjustment?: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onAddEjercicio: () => void;
  onDeleteEjercicio: (id: number) => void;
}

const RutinaItem: React.FC<RutinaItemProps> = ({
  rutina,
  hasAiAdjustment,
  isExpanded,
  onToggleExpand,
  onToggleStatus,
  onDelete,
  onAddEjercicio,
  onDeleteEjercicio,
}) => {
  const { data: ejercicios = [], isLoading } = useQuery({
    queryKey: ['ejercicios', rutina.id],
    queryFn: () => ejerciciosApi.getByRutina(rutina.id),
    enabled: isExpanded,
  });

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden transition-colors hover:border-[var(--border)]/80">
      {/* Top Bar of Card */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-bold text-[var(--text-primary)] font-space tracking-tight">{rutina.nombre}</h3>
              <Badge type="status" value={rutina.activa} />
              {rutina.generadaPorIa && (
                <Badge type="ai-generated" />
              )}
              {hasAiAdjustment && (
                <Badge type="ai" label="Ajuste de cargas IA" />
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
              {rutina.descripcion || 'Sin descripción asignada'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {/* Secondary Pill Button: Estado */}
          <button
            onClick={onToggleStatus}
            title={rutina.activa ? 'Desactivar rutina' : 'Activar rutina'}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold font-space flex items-center gap-1.5 border transition-all active:scale-95 ${
              rutina.activa
                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/20'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Power className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>{rutina.activa ? 'Activa' : 'Inactiva'}</span>
          </button>

          <button
            onClick={onDelete}
            title="Eliminar rutina"
            className="p-2 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 border border-[var(--border)] transition-colors active:scale-95"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </button>

          <button
            onClick={onToggleExpand}
            className="px-4 py-1.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40 border border-[var(--border)] transition-colors flex items-center gap-1.5 text-xs font-semibold font-inter active:scale-95"
          >
            <span>Ejercicios</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" strokeWidth={2} /> : <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Expanded Exercises Section */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-primary)]/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] font-space flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={2} />
              Ejercicios programados ({ejercicios.length})
            </h4>

            {/* Tertiary Button: Plain text with arrow */}
            <button
              onClick={onAddEjercicio}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:opacity-80 transition-opacity font-inter"
            >
              <span>+ Añadir ejercicio</span>
              <span>→</span>
            </button>
          </div>

          {isLoading ? (
            <p className="text-xs text-[var(--text-secondary)] text-center py-4 font-inter">Cargando ejercicios...</p>
          ) : ejercicios.length === 0 ? (
            <div className="text-center py-6 text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]">
              <p className="text-xs font-inter">No hay ejercicios asignados en esta rutina.</p>
              <button
                onClick={onAddEjercicio}
                className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] font-medium font-inter hover:underline"
              >
                <span>Añadir el primero</span>
                <span>→</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ejercicios.map((ej) => (
                <div
                  key={ej.id}
                  className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-start justify-between group hover:border-[var(--accent-primary)]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="text-xs font-semibold text-[var(--text-primary)] font-space">{ej.nombre}</h5>
                      {ej.grupoMuscular && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 font-inter">
                          {ej.grupoMuscular}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-secondary)] font-space tabular-nums">
                      <span className="text-[var(--text-primary)] font-semibold">{ej.seriesObjetivo} series</span>
                      <span className="text-[var(--text-secondary)]">×</span>
                      <span className="text-[var(--text-primary)] font-semibold">{ej.repeticionesObjetivo} reps</span>
                      <span className="text-[var(--text-secondary)]">•</span>
                      <span className="text-[var(--accent-primary)] font-bold">{ej.pesoObjetivo || 0} kg</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteEjercicio(ej.id)}
                    className="text-[var(--text-secondary)] hover:text-[var(--accent-error)] p-1 transition-colors"
                    title="Eliminar ejercicio"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
