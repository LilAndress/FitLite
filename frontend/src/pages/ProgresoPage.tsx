import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  LineChart as LineChartIcon, 
  Plus, 
  Trash2, 
  Calendar, 
  Dumbbell, 
  Filter, 
  TrendingUp, 
  Award,
  AlertCircle
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

  // Fetch exercises from all routines of active user using useQuery (prevents re-render loops)
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
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Selecciona un usuario</h2>
        <p className="text-slate-400 text-sm">
          Por favor selecciona un usuario en el menú superior para ver y registrar tu progreso.
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

  // Stats calculation
  const maxPeso = progresos.length > 0 ? Math.max(...progresos.map((p) => p.pesoRealizado || 0)) : 0;
  const totalSeries = progresos.reduce((acc, p) => acc + p.seriesRealizadas, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit'] flex items-center gap-2">
            <LineChartIcon className="w-6 h-6 text-emerald-400" />
            Evolución y Registro de Progreso
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualiza tu sobrecarga progresiva en peso y repeticiones a lo largo del tiempo.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-500/20 text-xs transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Registrar Sesión de Hoy
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Carga Máxima</span>
            <div className="text-2xl font-black text-white font-['Outfit']">{maxPeso} kg</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total de Series</span>
            <div className="text-2xl font-black text-white font-['Outfit']">{totalSeries}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Sesiones Totales</span>
            <div className="text-2xl font-black text-white font-['Outfit']">{progresos.length}</div>
          </div>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Gráfico de Sobrecarga Progresiva
            </h2>
            <p className="text-xs text-slate-400">
              Evolución cronológica de peso levantado (kg) y repeticiones.
            </p>
          </div>

          {/* Exercise Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filtroEjercicioId}
              onChange={(e) => setFiltroEjercicioId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
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
          <div className="h-72 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
            <Dumbbell className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-xs">No hay datos suficientes para graficar con este filtro.</p>
          </div>
        ) : (
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={11} tickLine={false} unit="kg" />
                <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={11} tickLine={false} unit=" reps" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="peso"
                  name="Peso (kg)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="reps"
                  name="Repeticiones"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white font-['Outfit']">Historial de Registros</h3>
          <span className="text-xs text-slate-400 font-medium">
            {filteredProgresos.length} entradas
          </span>
        </div>

        {isLoadingProgresos ? (
          <div className="p-8 text-center text-xs text-slate-400">Cargando historial...</div>
        ) : filteredProgresos.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No se han encontrado registros de entrenamiento para este usuario.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 uppercase tracking-wider text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Fecha</th>
                  <th className="py-3.5 px-4 font-semibold">Ejercicio</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Series</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Repeticiones</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Peso Levantado</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredProgresos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">{p.fecha}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-100">{p.ejercicioNombre}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">{p.seriesRealizadas}</td>
                    <td className="py-3 px-4 text-center">{p.repeticionesRealizadas}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {p.pesoRealizado || 0} kg
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deleteProgresoMutation.mutate(p.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
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
        title="Registrar Sesión de Entrenamiento"
      >
        <form onSubmit={handleSubmit((data) => createProgresoMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ejercicio *</label>
            {ejerciciosDisponibles.length === 0 ? (
              <p className="text-xs text-amber-400 bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/20">
                Primero debes crear una rutina y agregarle ejercicios en la pestaña de Rutinas.
              </p>
            ) : (
              <select
                {...register('ejercicioId')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
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
              <p className="text-[11px] text-rose-400 mt-1">{errors.ejercicioId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Entrenamiento *</label>
            <input
              type="date"
              {...register('fecha')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
            {errors.fecha && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.fecha.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Series Realizadas *</label>
              <input
                type="number"
                {...register('seriesRealizadas')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              {errors.seriesRealizadas && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.seriesRealizadas.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reps Realizadas *</label>
              <input
                type="number"
                {...register('repeticionesRealizadas')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              {errors.repeticionesRealizadas && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.repeticionesRealizadas.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Peso (kg) *</label>
              <input
                type="number"
                step="0.5"
                {...register('pesoRealizado')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              {errors.pesoRealizado && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.pesoRealizado.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createProgresoMutation.isPending || ejerciciosDisponibles.length === 0}
              className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {createProgresoMutation.isPending ? 'Guardando...' : 'Guardar Progreso'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
