import React, { useState, useEffect } from 'react';
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
  Pencil
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

const getTodayStr = () => new Date().toISOString().split('T')[0];

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
  const [filtroEjercicioId, setFiltroEjercicioId] = useState<string>('all');
  const [progresoError, setProgresoError] = useState<string | null>(null);

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
  const todayStr = getTodayStr();
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
      fecha: todayStr,
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
          fecha: getTodayStr(),
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
    resetProgreso({
      fecha: getTodayStr(),
      seriesRealizadas: 4,
      repeticionesRealizadas: 10,
      pesoRealizado: 20,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditProgreso = (p: Progreso) => {
    setEditingProgresoId(p.id);
    setProgresoError(null);
    resetProgreso({
      fecha: p.fecha,
      ejercicioId: p.ejercicioCatalogoId || p.ejercicioId,
      seriesRealizadas: p.seriesRealizadas,
      repeticionesRealizadas: p.repeticionesRealizadas,
      pesoRealizado: p.pesoRealizado || 0,
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

  // Filtered progress for exercises
  const filteredProgresos =
    filtroEjercicioId === 'all'
      ? progresos
      : progresos.filter(
          (p) =>
            p.ejercicioId === Number(filtroEjercicioId) ||
            (p.ejercicioCatalogoId && p.ejercicioCatalogoId === Number(filtroEjercicioId))
        );

  const chartDataProgresos = [...filteredProgresos]
    .reverse()
    .map((p) => ({
      fecha: p.fecha.slice(5),
      peso: p.pesoRealizado || 0,
      reps: p.repeticionesRealizadas,
      series: p.seriesRealizadas,
      ejercicio: p.ejercicioNombre,
    }));

  const maxPesoEjercicio = progresos.length > 0 ? Math.max(...progresos.map((p) => p.pesoRealizado || 0)) : 0;
  const totalSeries = progresos.reduce((acc, p) => acc + p.seriesRealizadas, 0);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] font-space flex items-center gap-2.5 tracking-tight">
              {activeTab === 'cargas' ? (
                <LineChartIcon className="w-6 h-6 text-[var(--accent-primary)]" strokeWidth={2} />
              ) : (
                <Scale className="w-6 h-6 text-[var(--accent-primary)]" strokeWidth={2} />
              )}
              {activeTab === 'cargas' ? 'Métricas y sobrecarga de cargas' : 'Seguimiento de peso corporal'}
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
            {activeTab === 'cargas'
              ? 'Visualización de progresión en pesos y repeticiones de ejercicios.'
              : 'Historial cronológico de pesajes y evolución del peso corporal del atleta.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented Control Tabs */}
          <div className="flex items-center p-1 bg-[var(--surface)] border border-[var(--border)] rounded-full text-xs font-inter">
            <button
              onClick={() => setActiveTab('cargas')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-medium transition-all ${
                activeTab === 'cargas'
                  ? 'bg-[var(--accent-primary)] text-[#0D1117] font-semibold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Cargas de ejercicio</span>
            </button>
            <button
              onClick={() => setActiveTab('pesoCorporal')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-medium transition-all ${
                activeTab === 'pesoCorporal'
                  ? 'bg-[var(--accent-primary)] text-[#0D1117] font-semibold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Peso corporal</span>
            </button>
          </div>

          {/* Action Buttons */}
          {activeTab === 'cargas' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <StartWorkoutButton variant="primary" />
              <button
                onClick={handleOpenCreateProgreso}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 text-xs font-semibold font-inter active:scale-95 transition-all cursor-pointer"
                title="Registro manual rápido"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Registro rápido</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenCreatePeso}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter cursor-pointer"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Registrar pesaje
            </button>
          )}
        </div>
      </div>

      {activeTab === 'cargas' ? (
        /* VISTA 1: CARGAS DE EJERCICIO */
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              title="Carga máxima"
              value={maxPesoEjercicio}
              decimals={1}
              suffix=" kg"
              icon={Award}
              variation={{ type: 'positive', text: '+Sobrecarga' }}
              subtitle="Mayor peso superado en entrenamiento"
              isPrimary={true}
            />

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
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] font-space flex items-center gap-2 tracking-tight">
                  <Activity className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={2} />
                  Curva de sobrecarga progresiva
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                  Progresión lineal de kilajes levantados
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={2} />
                <select
                  value={filtroEjercicioId}
                  onChange={(e) => setFiltroEjercicioId(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
                >
                  <option value="all">Todos los ejercicios ({ejerciciosDisponibles.length})</option>
                  {ejerciciosDisponibles.map((ej) => (
                    <option key={ej.id} value={ej.ejercicioCatalogoId || ej.id}>
                      {ej.nombre} {ej.grupoMuscular ? `· ${ej.grupoMuscular}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {chartDataProgresos.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-primary)]/40">
                <Dumbbell className="w-8 h-8 text-[var(--text-secondary)] mb-2" strokeWidth={1.5} />
                <p className="text-xs font-inter">No hay datos suficientes para trazar la curva.</p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataProgresos} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
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
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
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
              <div className="overflow-x-auto">
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
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] font-space flex items-center gap-2 tracking-tight">
                  <Scale className="w-4 h-4 text-[#38bdf8]" strokeWidth={2} />
                  Curva de seguimiento de peso corporal (kg)
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                  Evolución cronológica de masa corporal
                </p>
              </div>

              <button
                onClick={handleOpenCreatePeso}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all font-inter"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Nuevo pesaje</span>
              </button>
            </div>

            {chartDataPesos.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-primary)]/40">
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
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataPesos} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
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
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
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
              <div className="overflow-x-auto">
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
          if (editingProgresoId) {
            updateProgresoMutation.mutate({ id: editingProgresoId, data });
          } else {
            createProgresoMutation.mutate(data);
          }
        })} className="space-y-4">
          <RegistroRapidoCombobox
            value={watchProgreso('ejercicioId')}
            onChange={(catId) => setValueProgreso('ejercicioId', catId, { shouldValidate: true })}
            activeRoutines={rutinas.filter((r) => r.activa)}
            error={errorsProgreso.ejercicioId?.message}
          />

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Fecha de ejecución *
            </label>
            <input
              type="date"
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
            <div className="grid grid-cols-4 gap-2">
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
                    className={`py-1.5 px-2 rounded-xl text-xs font-inter border transition-all cursor-pointer ${
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

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createProgresoMutation.isPending || updateProgresoMutation.isPending || yaRegistrado}
              className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter cursor-pointer"
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
