import React, { useState } from 'react';
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
  AlertCircle,
  Activity,
  Layers,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { useUser } from '../context/UserContext';
import { progresosApi } from '../api/progresos.api';
import { rutinasApi } from '../api/rutinas.api';
import { ejerciciosApi } from '../api/ejercicios.api';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';

const progresoSchema = z.object({
  ejercicioId: z.coerce.number().min(1, 'Selecciona un ejercicio'),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  seriesRealizadas: z.coerce.number().min(1, 'Mínimo 1 serie'),
  repeticionesRealizadas: z.coerce.number().min(1, 'Mínimo 1 repetición'),
  pesoRealizado: z.coerce.number().min(0, 'El peso no puede ser negativo'),
});

type ProgresoFormValues = z.infer<typeof progresoSchema>;

export const ProgresoPage: React.FC = () => {
  const { activeUser } = useUser();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroEjercicioId, setFiltroEjercicioId] = useState<string>('all');

  // Queries
  const { data: progresos = [], isLoading: isLoadingProgresos } = useQuery({
    queryKey: ['progresos', activeUser?.id],
    queryFn: () => (activeUser ? progresosApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  const { data: rutinas = [] } = useQuery({
    queryKey: ['rutinas', activeUser?.id],
    queryFn: () => (activeUser ? rutinasApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  // Fetch exercises from all routines of active user using useQuery
  const { data: ejerciciosDisponibles = [] } = useQuery({
    queryKey: ['ejerciciosDisponibles', rutinas.map((r) => r.id).join(',')],
    queryFn: async () => {
      if (!rutinas || rutinas.length === 0) return [];
      const promises = rutinas.map((r) => ejerciciosApi.getByRutina(r.id));
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: rutinas.length > 0,
  });

  // Form setup
  const todayStr = new Date().toISOString().split('T')[0];
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgresoFormValues>({
    resolver: zodResolver(progresoSchema),
    defaultValues: {
      fecha: todayStr,
      seriesRealizadas: 4,
      repeticionesRealizadas: 10,
      pesoRealizado: 20,
    },
  });

  // Mutations
  const createProgresoMutation = useMutation({
    mutationFn: (data: ProgresoFormValues) => {
      if (!activeUser) throw new Error('No user selected');
      return progresosApi.create({
        ...data,
        usuarioId: activeUser.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progresos', activeUser?.id] });
      setIsModalOpen(false);
      reset();
    },
  });

  const deleteProgresoMutation = useMutation({
    mutationFn: (id: number) => progresosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progresos', activeUser?.id] });
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

  // Filtered progress
  const filteredProgresos =
    filtroEjercicioId === 'all'
      ? progresos
      : progresos.filter((p) => p.ejercicioId === Number(filtroEjercicioId));

  // Chart data: chronological order
  const chartData = [...filteredProgresos]
    .reverse()
    .map((p) => ({
      fecha: p.fecha.slice(5),
      peso: p.pesoRealizado || 0,
      reps: p.repeticionesRealizadas,
      series: p.seriesRealizadas,
      ejercicio: p.ejercicioNombre,
    }));

  const maxPeso = progresos.length > 0 ? Math.max(...progresos.map((p) => p.pesoRealizado || 0)) : 0;
  const totalSeries = progresos.reduce((acc, p) => acc + p.seriesRealizadas, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-space flex items-center gap-3 tracking-tight">
            <LineChartIcon className="w-6 h-6 text-[var(--accent-primary)]" strokeWidth={2} />
            Métricas y progresión de cargas
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
            Visualización de sobrecarga progresiva en peso y repeticiones.
          </p>
        </div>

        {/* Primary Pill Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all self-start sm:self-auto font-inter"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Registrar sesión
        </button>
      </div>

      {/* Tarjetas de Estadística con Icono Outline a la Izquierda y Variación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Carga máxima"
          value={maxPeso}
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

      {/* Contenedor del Gráfico con Animación de Trazo */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] font-space flex items-center gap-2 tracking-tight">
              <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={2} />
              Curva de sobrecarga progresiva
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
              Evolución cronológica de carga (kg) en línea sólida y repeticiones en línea discontinua.
            </p>
          </div>

          {/* Exercise Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={2} />
            <select
              value={filtroEjercicioId}
              onChange={(e) => setFiltroEjercicioId(e.target.value)}
              className="px-3.5 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-primary)] font-inter focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="all">Todos los ejercicios</option>
              {ejerciciosDisponibles.map((ej) => (
                <option key={ej.id} value={ej.id}>
                  {ej.nombre} ({ej.rutinaNombre})
                </option>
              ))}
            </select>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-primary)]/40">
            <Dumbbell className="w-10 h-10 text-[var(--text-secondary)] mb-2" strokeWidth={1.5} />
            <p className="text-xs font-inter">No hay datos registrados con este filtro para graficar.</p>
          </div>
        ) : (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E343B" vertical={false} />
                <XAxis dataKey="fecha" stroke="#A0A7B2" fontSize={10} tickLine={false} />
                <YAxis yAxisId="left" stroke="#B7FF3B" fontSize={10} tickLine={false} unit="kg" />
                <YAxis yAxisId="right" orientation="right" stroke="#FF8A3D" fontSize={10} tickLine={false} unit=" reps" />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {/* Trazo animado de línea principal en --accent-primary */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="peso"
                  name="Peso (kg)"
                  stroke="#B7FF3B"
                  strokeWidth={3}
                  isAnimationActive={true}
                  animationDuration={1300}
                  dot={{ r: 4, fill: '#B7FF3B', stroke: '#0D1117', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#B7FF3B' }}
                />
                {/* Trazo animado de repeticiones en --accent-secondary */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="reps"
                  name="Repeticiones"
                  stroke="#FF8A3D"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  isAnimationActive={true}
                  animationDuration={1300}
                  dot={{ r: 3, fill: '#FF8A3D' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Historial Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--text-primary)] font-space tracking-tight">Historial de sesiones</h3>
          <span className="text-xs text-[var(--text-secondary)] font-space tabular-nums">
            {filteredProgresos.length} registros
          </span>
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
                      <button
                        onClick={() => deleteProgresoMutation.mutate(p.id)}
                        className="text-[var(--text-secondary)] hover:text-[var(--accent-error)] p-1 transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Progreso */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar sesión de entrenamiento"
      >
        <form onSubmit={handleSubmit((data) => createProgresoMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Ejercicio *
            </label>
            {ejerciciosDisponibles.length === 0 ? (
              <p className="text-xs text-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 p-3 rounded-xl border border-[var(--accent-secondary)]/30 font-inter">
                Primero debes crear una rutina y agregarle ejercicios en la pestaña de Rutinas.
              </p>
            ) : (
              <select
                {...register('ejercicioId')}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
              >
                <option value="">Selecciona un ejercicio...</option>
                {ejerciciosDisponibles.map((ej) => (
                  <option key={ej.id} value={ej.id}>
                    {ej.nombre} ({ej.rutinaNombre})
                  </option>
                ))}
              </select>
            )}
            {errors.ejercicioId && (
              <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{errors.ejercicioId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Fecha de ejecución *
            </label>
            <input
              type="date"
              {...register('fecha')}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
            {errors.fecha && (
              <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{errors.fecha.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Series *
              </label>
              <input
                type="number"
                {...register('seriesRealizadas')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {errors.seriesRealizadas && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{errors.seriesRealizadas.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Reps *
              </label>
              <input
                type="number"
                {...register('repeticionesRealizadas')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {errors.repeticionesRealizadas && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{errors.repeticionesRealizadas.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Peso (kg) *
              </label>
              <input
                type="number"
                step="0.5"
                {...register('pesoRealizado')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {errors.pesoRealizado && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{errors.pesoRealizado.message}</p>
              )}
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
              disabled={createProgresoMutation.isPending || ejerciciosDisponibles.length === 0}
              className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter"
            >
              {createProgresoMutation.isPending ? 'Guardando...' : 'Guardar sesión'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
