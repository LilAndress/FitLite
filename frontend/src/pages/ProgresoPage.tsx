import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  LineChart as LineChartIcon, 
  Plus, 
  Trash2, 
  Dumbbell, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Activity,
  Layers,
  Award,
  Scale,
  Calendar,
  FileText,
  Pencil,
  Trophy
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { useUser } from '../context/UserContext';
import { progresosApi } from '../api/progresos.api';
import { pesosCorporalesApi } from '../api/pesos.api';
import { rutinasApi } from '../api/rutinas.api';
import { ejerciciosApi } from '../api/ejercicios.api';
import { fechaLocalISO } from '../lib/dateUtils';
import { isPesoCorporalExercise } from '../lib/exerciseUtils';
import type { Ejercicio, Progreso, PesoCorporal } from '../types';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { StartWorkoutButton } from '../components/StartWorkoutButton';
import { RegistroRapidoCombobox } from '../components/RegistroRapidoCombobox';
import { PesoCorporalModal } from '../components/PesoCorporalModal';

const progresoSchema = z.object({
  ejercicioId: z.coerce.number().min(1, 'Selecciona un ejercicio'),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  seriesRealizadas: z.coerce.number().min(1, 'Mínimo 1 serie'),
  repeticionesRealizadas: z.coerce.number().min(1, 'Mínimo 1 repetición'),
  pesoRealizado: z.coerce.number().min(0, 'El peso no puede ser negativo'),
  esfuerzo: z.enum(['FACIL', 'JUSTO', 'DURO']).optional(),
});

type ProgresoFormValues = z.infer<typeof progresoSchema>;

export const ProgresoPage: React.FC = () => {
  const { activeUser, refreshUsers } = useUser();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTabState] = useState<'cargas' | 'pesoCorporal'>(
    tabParam === 'pesoCorporal' ? 'pesoCorporal' : 'cargas'
  );

  const setActiveTab = (tab: 'cargas' | 'pesoCorporal') => {
    setActiveTabState(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'pesoCorporal') {
        next.set('tab', 'pesoCorporal');
      } else {
        next.delete('tab');
      }
      return next;
    }, { replace: true });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgresoId, setEditingProgresoId] = useState<number | null>(null);
  const [isPesoModalOpen, setIsPesoModalOpen] = useState(false);
  const [editingPesoId, setEditingPesoId] = useState<number | null>(null);
  const [filtroEjercicioId, setFiltroEjercicioId] = useState<string>('');
  const [progresoError, setProgresoError] = useState<string | null>(null);
  const [esPesoCorporalChecked, setEsPesoCorporalChecked] = useState(false);

  // Queries
  const { data: progresos = [], isLoading: isLoadingProgresos } = useQuery({
    queryKey: ['progresos', activeUser?.id],
    queryFn: () => (activeUser ? progresosApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  const { data: historialPesos = [], isLoading: isLoadingPesos } = useQuery({
    queryKey: ['pesosCorporales', activeUser?.id],
    queryFn: () => (activeUser ? pesosCorporalesApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  const { data: rutinas = [] } = useQuery({
    queryKey: ['rutinas', activeUser?.id],
    queryFn: () => (activeUser ? rutinasApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  const { data: ejerciciosDisponibles = [] } = useQuery<Ejercicio[]>({
    queryKey: ['ejerciciosDisponibles', activeUser?.id, Array.isArray(rutinas) ? rutinas.map((r) => r.id).join(',') : ''],
    queryFn: async () => {
      if (!Array.isArray(rutinas) || rutinas.length === 0) return [];
      const promises = rutinas.map(async (r) => {
        try {
          const res = await ejerciciosApi.getByRutina(r.id);
          return Array.isArray(res) ? res : [];
        } catch (err) {
          console.error(`Error al cargar ejercicios de la rutina ${r.id}:`, err);
          return [];
        }
      });
      const results = await Promise.all(promises);
      const flatEjercicios = results.flat();
      const uniqueMap = new Map<string, Ejercicio>();
      flatEjercicios.forEach((ej) => {
        if (ej) {
          const key = String(ej.ejercicioCatalogoId || ej.nombre || ej.id);
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, ej);
          }
        }
      });
      return Array.from(uniqueMap.values());
    },
    enabled: Boolean(activeUser) && Array.isArray(rutinas) && rutinas.length > 0,
  });

  // Forms setup
  const {
    register: registerProgreso,
    handleSubmit: handleSubmitProgreso,
    reset: resetProgreso,
    watch: watchProgreso,
    setValue: setValueProgreso,
    formState: { errors: errorsProgreso },
  } = useForm<ProgresoFormValues>({
    resolver: zodResolver(progresoSchema),
    defaultValues: {
      fecha: fechaLocalISO(),
      seriesRealizadas: 4,
      repeticionesRealizadas: 10,
      pesoRealizado: 20,
    },
  });

  const watchedFecha = watchProgreso('fecha');
  const watchedEjercicioId = watchProgreso('ejercicioId');

  const yaRegistrado = Boolean(
    watchedFecha &&
    watchedEjercicioId &&
    progresos.some((p) => {
      if (editingProgresoId && p.id === editingProgresoId) return false;
      const sameFecha = p.fecha === watchedFecha;
      const sameEjercicio = String(p.ejercicioCatalogoId || p.ejercicioId) === String(watchedEjercicioId);
      return sameFecha && sameEjercicio;
    })
  );



  useEffect(() => {
    if (tabParam === 'pesoCorporal') {
      setActiveTabState('pesoCorporal');
    } else if (tabParam === 'cargas') {
      setActiveTabState('cargas');
    }
  }, [tabParam]);

  useEffect(() => {
    const autoOpen = searchParams.get('registrar') === 'true';
    const ejId = searchParams.get('ejercicioId');
    const pesoParam = searchParams.get('peso');
    const repsParam = searchParams.get('reps');
    const seriesParam = searchParams.get('series');

    if (autoOpen || ejId) {
      setEditingProgresoId(null);
      setIsModalOpen(true);
      if (ejId) {
        resetProgreso({
          fecha: fechaLocalISO(),
          ejercicioId: Number(ejId),
          seriesRealizadas: seriesParam ? Number(seriesParam) : 4,
          repeticionesRealizadas: repsParam ? Number(repsParam) : 10,
          pesoRealizado: pesoParam ? Number(pesoParam) : 20,
        });
      }
    }
  }, [searchParams, resetProgreso]);

  // Mutations
  const createProgresoMutation = useMutation({
    mutationFn: (data: ProgresoFormValues) => {
      if (!activeUser) throw new Error('No user selected');
      return progresosApi.create({
        ejercicioId: Number(data.ejercicioId),
        fecha: data.fecha,
        seriesRealizadas: Number(data.seriesRealizadas),
        repeticionesRealizadas: Number(data.repeticionesRealizadas),
        pesoRealizado: Number(data.pesoRealizado),
        usuarioId: activeUser.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progresos', activeUser?.id] });
      setIsModalOpen(false);
      setEditingProgresoId(null);
      resetProgreso();
      setProgresoError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Error al registrar el progreso';
      setProgresoError(msg);
    },
  });

  const updateProgresoMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProgresoFormValues }) => {
      if (!activeUser) throw new Error('No user selected');
      return progresosApi.update(id, {
        ejercicioId: Number(data.ejercicioId),
        fecha: data.fecha,
        seriesRealizadas: Number(data.seriesRealizadas),
        repeticionesRealizadas: Number(data.repeticionesRealizadas),
        pesoRealizado: Number(data.pesoRealizado),
        usuarioId: activeUser.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progresos', activeUser?.id] });
      setIsModalOpen(false);
      setEditingProgresoId(null);
      resetProgreso();
      setProgresoError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Error al actualizar el progreso';
      setProgresoError(msg);
    },
  });

  const handleOpenCreateProgreso = () => {
    setEditingProgresoId(null);
    setProgresoError(null);
    setEsPesoCorporalChecked(false);
    resetProgreso({
      fecha: fechaLocalISO(),
      seriesRealizadas: 4,
      repeticionesRealizadas: 10,
      pesoRealizado: 20,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditProgreso = (p: Progreso) => {
    setEditingProgresoId(p.id);
    setProgresoError(null);
    const isBW = isPesoCorporalExercise(p.ejercicioNombre);
    setEsPesoCorporalChecked(isBW);
    resetProgreso({
      fecha: p.fecha,
      ejercicioId: p.ejercicioCatalogoId || p.ejercicioId,
      seriesRealizadas: p.seriesRealizadas,
      repeticionesRealizadas: p.repeticionesRealizadas,
      pesoRealizado: p.pesoRealizado ?? 0,
    });
    setIsModalOpen(true);
  };

  const deleteProgresoMutation = useMutation({
    mutationFn: (id: number) => progresosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progresos', activeUser?.id] });
    },
  });

  const handleOpenCreatePeso = () => {
    setEditingPesoId(null);
    setIsPesoModalOpen(true);
  };

  const handleOpenEditPeso = (p: PesoCorporal) => {
    setEditingPesoId(p.id);
    setIsPesoModalOpen(true);
  };

  const deletePesoMutation = useMutation({
    mutationFn: (id: number) => pesosCorporalesApi.delete(id),
    onSuccess: async () => {
      await refreshUsers();
      queryClient.invalidateQueries({ queryKey: ['pesosCorporales', activeUser?.id] });
    },
  });

  // 1. Ejercicios únicos disponibles ordenados por el más recientemente ejecutado
  const distinctExercises = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; grupoMuscular?: string }>();

    // Primero los ejercicios que tienen progresos registrados, ordenados del más reciente al más antiguo
    const sortedProgresosDesc = [...progresos].sort(
      (a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id
    );
    sortedProgresosDesc.forEach((p) => {
      const key = String(p.ejercicioCatalogoId || p.ejercicioId);
      if (!map.has(key) && p.ejercicioNombre) {
        map.set(key, { id: key, nombre: p.ejercicioNombre, grupoMuscular: p.grupoMuscular });
      }
    });

    // Luego ejercicios de rutinas activas que aún no tengan progresos
    ejerciciosDisponibles.forEach((ej) => {
      const key = String(ej.ejercicioCatalogoId || ej.id);
      if (!map.has(key)) {
        map.set(key, { id: key, nombre: ej.nombre, grupoMuscular: ej.grupoMuscular });
      }
    });

    return Array.from(map.values());
  }, [progresos, ejerciciosDisponibles]);

  // Inicializar o ajustar filtroEjercicioId para que comience con el más reciente (NUNCA todos mezclados)
  useEffect(() => {
    if (distinctExercises.length > 0) {
      if (!filtroEjercicioId || filtroEjercicioId === 'all' || !distinctExercises.some((e) => e.id === filtroEjercicioId)) {
        setFiltroEjercicioId(distinctExercises[0].id);
      }
    }
  }, [distinctExercises, filtroEjercicioId]);

  const selectedExercise = useMemo(() => {
    return distinctExercises.find((e) => e.id === filtroEjercicioId) || distinctExercises[0] || null;
  }, [distinctExercises, filtroEjercicioId]);

  const isSelectedExerciseBW = useMemo(() => {
    return selectedExercise ? isPesoCorporalExercise(selectedExercise.nombre) : false;
  }, [selectedExercise]);

  // Progresos filtrados solo para el ejercicio seleccionado (UN ejercicio a la vez)
  const filteredProgresos = useMemo(() => {
    if (!selectedExercise) return [];
    const targetId = selectedExercise.id;
    return progresos.filter(
      (p) =>
        p.pesoRealizado !== null &&
        p.pesoRealizado !== undefined &&
        (String(p.ejercicioCatalogoId) === targetId || String(p.ejercicioId) === targetId)
    );
  }, [progresos, selectedExercise]);

  // Gráfica de progreso: ignora valores nulos, muestra un solo ejercicio a la vez en orden cronológico
  const chartDataProgresos = useMemo(() => {
    return [...filteredProgresos]
      .filter((p) => p.pesoRealizado !== null && p.pesoRealizado !== undefined && (isSelectedExerciseBW || p.pesoRealizado > 0))
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id)
      .map((p) => ({
        fecha: p.fecha.slice(5),
        peso: p.pesoRealizado,
        reps: p.repeticionesRealizadas,
        series: p.seriesRealizadas,
        ejercicio: p.ejercicioNombre,
      }));
  }, [filteredProgresos, isSelectedExerciseBW]);

  // Récords recientes: los 3 últimos récords, cada uno con su ejercicio (ignora valores nulos)
  const recentRecords = useMemo(() => {
    const validProgresos = progresos.filter(
      (p) => p.pesoRealizado !== null && p.pesoRealizado !== undefined && p.pesoRealizado > 0
    );

    // Mapeo por ejercicio para calcular su récord máximo histórico y fecha
    const map = new Map<string, { peso: number; fecha: string; reps: number; series: number }>();

    // Orden ascendente para simular la consecución del récord
    const asc = [...validProgresos].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);
    asc.forEach((p) => {
      const key = p.ejercicioNombre || `Ejercicio ${p.ejercicioCatalogoId || p.ejercicioId}`;
      const prev = map.get(key);
      if (!prev || p.pesoRealizado > prev.peso) {
        map.set(key, {
          peso: p.pesoRealizado,
          fecha: p.fecha,
          reps: p.repeticionesRealizadas,
          series: p.seriesRealizadas,
        });
      }
    });

    const list = Array.from(map.entries()).map(([nombre, item]) => ({
      ejercicioNombre: nombre,
      peso: item.peso,
      fecha: item.fecha,
      seriesReps: `${item.series}s × ${item.reps}r`,
    }));

    // Ordenar los récords con los más recientes primero
    list.sort((a, b) => b.fecha.localeCompare(a.fecha));
    return list.slice(0, 3);
  }, [progresos]);

  const totalSeries = progresos
    .filter((p) => p.seriesRealizadas !== null && p.seriesRealizadas !== undefined)
    .reduce((acc, p) => acc + p.seriesRealizadas, 0);

  // Body weight calculations & chart
  const chartDataPesos = [...historialPesos]
    .reverse()
    .map((p) => ({
      fecha: p.fecha.slice(5),
      peso: p.peso,
      notas: p.notas || '',
    }));

  const pesoActual = activeUser?.pesoActual ?? (historialPesos.length > 0 ? historialPesos[0].peso : null);
  const pesoInicial = historialPesos.length > 0 ? historialPesos[historialPesos.length - 1].peso : pesoActual;
  const variacionTotal = pesoActual !== null && pesoInicial !== null ? Number((pesoActual - pesoInicial).toFixed(1)) : null;

  if (!activeUser) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--accent-secondary)] mx-auto mb-3" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-[var(--text-primary)] font-space mb-2 tracking-tight">Selecciona un perfil</h2>
        <p className="text-[var(--text-secondary)] text-xs font-inter">
          Selecciona un usuario en la barra superior para ver y registrar su progreso deportivo.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-space flex items-center gap-2.5 tracking-tight">
              {activeTab === 'cargas' ? (
                <LineChartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-primary)] shrink-0" strokeWidth={2} />
              ) : (
                <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-primary)] shrink-0" strokeWidth={2} />
              )}
              <span className="truncate">{activeTab === 'cargas' ? 'Métricas y sobrecarga' : 'Seguimiento de peso corporal'}</span>
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
            {activeTab === 'cargas'
              ? 'Visualización de progresión en pesos y repeticiones de ejercicios.'
              : 'Historial cronológico de pesajes y evolución del peso corporal del atleta.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          {/* Segmented Control Tabs */}
          <div className="grid grid-cols-2 sm:flex items-center p-1 bg-[var(--surface)] border border-[var(--border)] rounded-full text-xs font-inter w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('cargas')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-1.5 rounded-full font-medium transition-all text-center ${
                activeTab === 'cargas'
                  ? 'bg-[var(--accent-primary)] text-[#0D1117] font-semibold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Cargas</span>
            </button>
            <button
              onClick={() => setActiveTab('pesoCorporal')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-1.5 rounded-full font-medium transition-all text-center ${
                activeTab === 'pesoCorporal'
                  ? 'bg-[var(--accent-primary)] text-[#0D1117] font-semibold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Scale className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Peso corporal</span>
            </button>
          </div>

          {/* Action Buttons */}
          {activeTab === 'cargas' ? (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-stretch sm:justify-start">
              <div className="flex-1 sm:flex-initial">
                <StartWorkoutButton variant="primary" className="w-full sm:w-auto justify-center" />
              </div>
              <button
                onClick={handleOpenCreateProgreso}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 text-xs font-semibold font-inter active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                title="Registro manual rápido"
              >
                <Plus className="w-3.5 h-3.5 strokeWidth={2.5}" />
                <span>Registro rápido</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenCreatePeso}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter cursor-pointer"
            >
              <Plus className="w-4 h-4 strokeWidth={2.5}" />
              <span>Registrar pesaje</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'cargas' ? (
        /* VISTA 1: CARGAS DE EJERCICIO */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-5">
            {/* Tarjeta Récords recientes (reemplaza Carga máxima) */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[var(--accent-primary)]/40 transition-all">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 flex items-center justify-center">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[var(--text-primary)] font-space tracking-tight">
                        Récords recientes
                      </h3>
                      <p className="text-[10px] text-[var(--text-secondary)] font-inter">
                        3 últimos récords con su ejercicio
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-space bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                    PRs
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {recentRecords.length === 0 ? (
                    <p className="text-xs text-[var(--text-secondary)] font-inter py-3 text-center">
                      Aún no hay récords registrados.
                    </p>
                  ) : (
                    recentRecords.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-[var(--bg-primary)]/60 border border-[var(--border)]/60 flex items-center justify-between text-xs gap-2"
                      >
                        <div className="truncate min-w-0">
                          <p className="font-semibold text-[var(--text-primary)] font-space truncate text-[11px]">
                            {rec.ejercicioNombre}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)] font-inter truncate">
                            {rec.fecha} {rec.seriesReps ? `· ${rec.seriesReps}` : ''}
                          </p>
                        </div>
                        <span className="font-bold font-space text-[var(--accent-primary)] text-xs tabular-nums shrink-0">
                          {rec.peso} kg
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <StatCard
              title="Series acumuladas"
              value={totalSeries}
              decimals={0}
              suffix=" series"
              icon={Layers}
              variation={{ type: 'positive', text: '+Volumen' }}
              subtitle="Total de series ejecutadas con éxito"
            />

            <StatCard
              title="Sesiones registradas"
              value={progresos.length}
              decimals={0}
              icon={Activity}
              variation={{ type: 'positive', text: 'Activo' }}
              subtitle="Registro cronológico continuo"
            />
          </div>

          {/* Gráfico de Progresión de Cargas */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-[var(--border)]">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[var(--text-primary)] font-space flex items-center gap-2 tracking-tight">
                  <Activity className="w-4 h-4 text-[var(--accent-primary)] shrink-0" strokeWidth={2} />
                  <span className="truncate">Curva de progreso: {selectedExercise?.nombre || 'Ejercicio'}</span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                  Progresión lineal de cargas (un ejercicio a la vez)
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-[var(--text-secondary)] shrink-0" strokeWidth={2} />
                <select
                  value={filtroEjercicioId}
                  onChange={(e) => setFiltroEjercicioId(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter cursor-pointer truncate"
                >
                  {distinctExercises.map((ej) => (
                    <option key={ej.id} value={ej.id}>
                      {ej.nombre} {ej.grupoMuscular ? `· ${ej.grupoMuscular}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {chartDataProgresos.length === 0 ? (
              <div className="h-60 sm:h-64 flex flex-col items-center justify-center text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-primary)]/40 p-4 text-center">
                <Dumbbell className="w-8 h-8 text-[var(--text-secondary)] mb-2" strokeWidth={1.5} />
                <p className="text-xs font-inter">No hay datos suficientes para trazar la curva.</p>
              </div>
            ) : (
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataProgresos} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E343B" vertical={false} />
                    <XAxis dataKey="fecha" stroke="#A0A7B2" fontSize={11} tickLine={false} />
                    <YAxis stroke="#A0A7B2" fontSize={11} tickLine={false} unit="kg" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1F26',
                        borderColor: '#2E343B',
                        borderRadius: '12px',
                        color: '#F5F7FA',
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      name="Peso levantado (kg)"
                      stroke="#B7FF3B"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#B7FF3B', stroke: '#1A1F26', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tabla de Registros de Ejercicios */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-space">
                  Bitácora de cargas de ejercicio
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                  {filteredProgresos.length} sesiones registradas
                </p>
              </div>
            </div>

            {isLoadingProgresos ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)] font-inter">Cargando registros...</div>
            ) : filteredProgresos.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)] font-inter">
                No se han registrado sesiones de entrenamiento para este perfil todavía.
              </div>
            ) : (
              <>
                {/* Vista Móvil: Tarjetas compactas */}
                <div className="block md:hidden divide-y divide-[var(--border)] font-inter">
                  {filteredProgresos.map((p) => (
                    <div key={p.id} className="p-3.5 sm:p-4 hover:bg-[var(--bg-primary)]/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Dumbbell className="w-4 h-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] font-space truncate">
                              {p.ejercicioNombre}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--text-secondary)] font-inter flex-wrap">
                              <span className="font-space tabular-nums text-[var(--text-primary)] font-semibold">
                                {p.seriesRealizadas} series × {p.repeticionesRealizadas} reps
                              </span>
                              <span>•</span>
                              <span className="tabular-nums">{p.fecha}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="font-bold font-space text-[var(--accent-primary)] text-sm tabular-nums">
                            {p.pesoRealizado || 0} kg
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleOpenEditProgreso(p)}
                              className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors cursor-pointer"
                              title="Editar registro"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteProgresoMutation.mutate(p.id)}
                              className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 transition-colors cursor-pointer"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vista Escritorio / Tablet: Tabla completa */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-[var(--text-primary)]">
                    <thead className="bg-[var(--bg-primary)]/80 text-[var(--text-secondary)] text-xs border-b border-[var(--border)] font-space">
                      <tr>
                        <th className="py-3 px-5 font-semibold">Fecha</th>
                        <th className="py-3 px-5 font-semibold">Ejercicio</th>
                        <th className="py-3 px-5 font-semibold text-center">Series</th>
                        <th className="py-3 px-5 font-semibold text-center">Reps</th>
                        <th className="py-3 px-5 font-semibold text-right">Peso (kg)</th>
                        <th className="py-3 px-5 text-center font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] font-inter">
                      {filteredProgresos.map((p) => (
                        <tr key={p.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                          <td className="py-3.5 px-5 font-medium text-[var(--text-primary)] font-space tabular-nums">{p.fecha}</td>
                          <td className="py-3.5 px-5 font-medium text-[var(--text-primary)]">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={2} />
                              <span>{p.ejercicioNombre}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-center font-space tabular-nums">{p.seriesRealizadas}</td>
                          <td className="py-3.5 px-5 text-center font-space tabular-nums">{p.repeticionesRealizadas}</td>
                          <td className="py-3.5 px-5 text-right font-bold text-[var(--accent-primary)] font-space tabular-nums">
                            {p.pesoRealizado || 0} kg
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditProgreso(p)}
                                className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] p-1.5 rounded-lg hover:bg-[var(--accent-primary)]/10 transition-colors cursor-pointer"
                                title="Editar registro"
                              >
                                <Pencil className="w-4 h-4" strokeWidth={2} />
                              </button>
                              <button
                                onClick={() => deleteProgresoMutation.mutate(p.id)}
                                className="text-[var(--text-secondary)] hover:text-[var(--accent-error)] p-1.5 rounded-lg hover:bg-[var(--accent-error)]/10 transition-colors cursor-pointer"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-4 h-4" strokeWidth={2} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        /* VISTA 2: SEGUIMIENTO DE PESO CORPORAL HISTÓRICO */
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              title="Peso corporal actual"
              value={pesoActual || 0}
              decimals={1}
              suffix=" kg"
              icon={Scale}
              variation={{
                type: variacionTotal !== null && variacionTotal <= 0 ? 'positive' : 'negative',
                text: variacionTotal !== null ? `${variacionTotal > 0 ? '+' : ''}${variacionTotal} kg neto` : 'Inicial'
              }}
              subtitle="Valor sincronizado con el perfil"
              isPrimary={true}
            />

            <StatCard
              title="Pesajes registrados"
              value={historialPesos.length}
              decimals={0}
              icon={Calendar}
              variation={{ type: 'positive', text: 'Historial' }}
              subtitle="Puntos de control antropométrico"
            />

            <StatCard
              title="Peso de partida"
              value={pesoInicial || 0}
              decimals={1}
              suffix=" kg"
              icon={Award}
              variation={{ type: 'positive', text: 'Referencia' }}
              subtitle="Primer pesaje registrado en la base"
            />
          </div>

          {/* Gráfico de Evolución de Peso Corporal */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-[var(--border)]">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] font-space flex items-center gap-2 tracking-tight">
                  <Scale className="w-4 h-4 text-[#38bdf8] shrink-0" strokeWidth={2} />
                  <span>Curva de seguimiento de peso corporal (kg)</span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                  Evolución cronológica de masa corporal
                </p>
              </div>

              <button
                onClick={handleOpenCreatePeso}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all font-inter cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Nuevo pesaje</span>
              </button>
            </div>

            {chartDataPesos.length === 0 ? (
              <div className="h-60 sm:h-64 flex flex-col items-center justify-center text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-primary)]/40 p-4 text-center">
                <Scale className="w-8 h-8 text-[var(--text-secondary)] mb-2" strokeWidth={1.5} />
                <p className="text-xs font-inter">No hay registros de peso corporal todavía.</p>
                <button
                  onClick={handleOpenCreatePeso}
                  className="mt-3 px-4 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter hover:brightness-105 active:scale-95 transition-all"
                >
                  Registrar primer pesaje
                </button>
              </div>
            ) : (
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataPesos} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bodyWeightPageGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E343B" vertical={false} />
                    <XAxis dataKey="fecha" stroke="#A0A7B2" fontSize={11} tickLine={false} />
                    <YAxis stroke="#A0A7B2" fontSize={11} tickLine={false} unit="kg" domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1F26',
                        borderColor: '#2E343B',
                        borderRadius: '12px',
                        color: '#F5F7FA',
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="peso"
                      name="Peso corporal (kg)"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#bodyWeightPageGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tabla de Historial de Peso Corporal */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-space">
                  Tabla de seguimiento de peso corporal
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                  {historialPesos.length} pesajes registrados en el histórico
                </p>
              </div>
            </div>

            {isLoadingPesos ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)] font-inter">Cargando histórico...</div>
            ) : historialPesos.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)] font-inter">
                No hay pesajes registrados en el histórico de este atleta.
              </div>
            ) : (
              <>
                {/* Vista Móvil: Lista de pesajes */}
                <div className="block md:hidden divide-y divide-[var(--border)] font-inter">
                  {historialPesos.map((pesoItem, idx) => {
                    const sig = historialPesos[idx + 1];
                    const diff = sig ? Number((pesoItem.peso - sig.peso).toFixed(1)) : null;
                    return (
                      <div key={pesoItem.id} className="p-3.5 sm:p-4 hover:bg-[var(--bg-primary)]/40 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Scale className="w-4 h-4" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-[#38bdf8] font-space tabular-nums">
                                  {pesoItem.peso} kg
                                </span>
                                {diff !== null ? (
                                  <span className={`inline-flex items-center gap-0.5 font-semibold text-xs ${diff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {diff > 0 ? `+${diff}` : `${diff}`} kg
                                  </span>
                                ) : (
                                  <span className="text-[var(--text-secondary)] text-[10px] font-space">Inicial</span>
                                )}
                              </div>
                              <div className="mt-1 text-xs text-[var(--text-secondary)] font-inter">
                                <span className="tabular-nums font-space text-[11px]">{pesoItem.fecha}</span>
                                {pesoItem.notas && (
                                  <p className="text-[11px] text-[var(--text-secondary)] italic mt-0.5 line-clamp-1">
                                    "{pesoItem.notas}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => handleOpenEditPeso(pesoItem)}
                              className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors cursor-pointer"
                              title="Editar pesaje"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deletePesoMutation.mutate(pesoItem.id)}
                              className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 transition-colors cursor-pointer"
                              title="Eliminar pesaje"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Vista Escritorio / Tablet: Tabla completa */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-[var(--text-primary)]">
                    <thead className="bg-[var(--bg-primary)]/80 text-[var(--text-secondary)] text-xs border-b border-[var(--border)] font-space">
                      <tr>
                        <th className="py-3 px-5 font-semibold">Fecha</th>
                        <th className="py-3 px-5 font-semibold text-right">Peso registrado</th>
                        <th className="py-3 px-5 font-semibold text-center">Variación</th>
                        <th className="py-3 px-5 font-semibold">Notas / Observaciones</th>
                        <th className="py-3 px-5 text-center font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] font-inter">
                      {historialPesos.map((pesoItem, idx) => {
                        const sig = historialPesos[idx + 1];
                        const diff = sig ? Number((pesoItem.peso - sig.peso).toFixed(1)) : null;
                        return (
                          <tr key={pesoItem.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                            <td className="py-3.5 px-5 font-medium text-[var(--text-primary)] font-space tabular-nums">
                              {pesoItem.fecha}
                            </td>
                            <td className="py-3.5 px-5 text-right font-bold text-[#38bdf8] font-space tabular-nums text-sm">
                              {pesoItem.peso} kg
                            </td>
                            <td className="py-3.5 px-5 text-center font-space tabular-nums">
                              {diff !== null ? (
                                <span className={`inline-flex items-center gap-1 font-semibold text-xs ${diff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                  {diff > 0 ? `+${diff}` : `${diff}`} kg
                                </span>
                              ) : (
                                <span className="text-[var(--text-secondary)] text-[11px] font-normal">Inicial</span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-[var(--text-secondary)] font-inter">
                              {pesoItem.notas ? (
                                <span className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                                  <span>{pesoItem.notas}</span>
                                </span>
                              ) : (
                                <span className="text-[var(--text-secondary)]/50 italic">Sin observaciones</span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditPeso(pesoItem)}
                                  className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] p-1 transition-colors cursor-pointer"
                                  title="Editar pesaje"
                                >
                                  <Pencil className="w-4 h-4" strokeWidth={2} />
                                </button>
                                <button
                                  onClick={() => deletePesoMutation.mutate(pesoItem.id)}
                                  className="text-[var(--text-secondary)] hover:text-[var(--accent-error)] p-1 transition-colors cursor-pointer"
                                  title="Eliminar pesaje"
                                >
                                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Modal Registro Rápido de Progreso */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProgresoId(null);
          setProgresoError(null);
        }}
        title={editingProgresoId ? "Editar registro de progreso" : "Registro rápido de progreso"}
      >
        {progresoError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-inter flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{progresoError}</span>
          </div>
        )}
        {yaRegistrado && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/30 text-[var(--accent-secondary)] text-xs font-inter flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block font-space">Ejercicio ya registrado en esta fecha</span>
              <span className="text-[11px]">No puedes volver a registrar el mismo ejercicio el mismo día. Edita el registro existente desde la bitácora si deseas ajustar tus cargas o repeticiones.</span>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmitProgreso((data) => {
          setProgresoError(null);
          if (!esPesoCorporalChecked && Number(data.pesoRealizado) <= 0) {
            setProgresoError('No se permite guardar 0 kg salvo en ejercicios marcados como peso corporal.');
            return;
          }
          if (editingProgresoId) {
            updateProgresoMutation.mutate({ id: editingProgresoId, data });
          } else {
            createProgresoMutation.mutate(data);
          }
        })} className="space-y-4">
          <RegistroRapidoCombobox
            value={watchProgreso('ejercicioId')}
            onChange={(catId, nombre) => {
              setValueProgreso('ejercicioId', catId, { shouldValidate: true });
              const isBW = isPesoCorporalExercise(nombre);
              setEsPesoCorporalChecked(isBW);
            }}
            activeRoutines={rutinas.filter((r) => r.activa)}
            error={errorsProgreso.ejercicioId?.message}
          />

          {/* Checkbox para ejercicio marcado como peso corporal */}
          <div className="flex items-center gap-2 px-1 py-1">
            <input
              type="checkbox"
              id="pesoCorporalProgresoCheck"
              checked={esPesoCorporalChecked}
              onChange={(e) => setEsPesoCorporalChecked(e.target.checked)}
              className="rounded bg-[var(--bg-primary)] border-[var(--border)] text-[var(--accent-primary)] focus:ring-0 cursor-pointer"
            />
            <label
              htmlFor="pesoCorporalProgresoCheck"
              className="text-xs text-[var(--text-secondary)] font-inter cursor-pointer select-none"
            >
              Ejercicio marcado como peso corporal / autocarga (permite 0 kg)
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Fecha de ejecución *
            </label>
            <input
              type="date"
              max={fechaLocalISO()}
              {...registerProgreso('fecha')}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
            {errorsProgreso.fecha && (
              <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{errorsProgreso.fecha.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Series *
              </label>
              <input
                type="number"
                {...registerProgreso('seriesRealizadas')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {errorsProgreso.seriesRealizadas && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{errorsProgreso.seriesRealizadas.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Reps *
              </label>
              <input
                type="number"
                {...registerProgreso('repeticionesRealizadas')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {errorsProgreso.repeticionesRealizadas && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{errorsProgreso.repeticionesRealizadas.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Peso (kg) *
              </label>
              <input
                type="number"
                step="0.5"
                {...registerProgreso('pesoRealizado')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {errorsProgreso.pesoRealizado && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{errorsProgreso.pesoRealizado.message}</p>
              )}
            </div>
          </div>

          {/* Selector de esfuerzo opcional */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Percepción de esfuerzo (Opcional)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: undefined, label: 'Sin especificar' },
                { key: 'FACIL', label: 'Fácil' },
                { key: 'JUSTO', label: 'Justo' },
                { key: 'DURO', label: 'Duro' },
              ].map((opt) => {
                const isSelected = watchProgreso('esfuerzo') === opt.key;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setValueProgreso('esfuerzo', opt.key as any)}
                    className={`py-2 sm:py-1.5 px-2 rounded-xl text-xs font-inter border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                        : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createProgresoMutation.isPending || updateProgresoMutation.isPending || yaRegistrado}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter cursor-pointer text-center"
            >
              {editingProgresoId
                ? (updateProgresoMutation.isPending ? 'Actualizando...' : 'Guardar cambios')
                : (createProgresoMutation.isPending ? 'Guardando...' : 'Guardar registro')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Registrar / Editar Pesaje Corporal Mejorado */}
      <PesoCorporalModal
        isOpen={isPesoModalOpen}
        onClose={() => {
          setIsPesoModalOpen(false);
          setEditingPesoId(null);
        }}
        historialPesos={historialPesos}
        editingPeso={editingPesoId ? historialPesos.find((p) => p.id === editingPesoId) : null}
      />
    </div>
  );
};
