import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  Dumbbell, 
  TrendingUp, 
  Target, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useUser } from '../context/UserContext';
import { rutinasApi } from '../api/rutinas.api';
import { progresosApi } from '../api/progresos.api';
import { Badge } from '../components/Badge';

export const DashboardPage: React.FC = () => {
  const { activeUser, users } = useUser();

  const { data: rutinas = [], isLoading: isLoadingRutinas } = useQuery({
    queryKey: ['rutinas', activeUser?.id],
    queryFn: () => (activeUser ? rutinasApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  const { data: progresos = [], isLoading: isLoadingProgresos } = useQuery({
    queryKey: ['progresos', activeUser?.id],
    queryFn: () => (activeUser ? progresosApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  if (!activeUser && users.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-6 border border-emerald-500/20">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white font-['Outfit'] mb-3">
          ¡Bienvenido a <span className="text-emerald-400">FitLite</span>!
        </h1>
        <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
          Comienza creando tu perfil de usuario para gestionar rutinas, objetivos físicos y registrar tu evolución diaria.
        </p>
        <Link
          to="/usuarios"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Crear Primer Usuario
        </Link>
      </div>
    );
  }

  const rutinasActivas = rutinas.filter((r) => r.activa);
  const ultimoProgreso = progresos.length > 0 ? progresos[0] : null;

  // Chart data formatting: reverse order so chronological
  const chartData = [...progresos].reverse().slice(-10).map((p) => ({
    fecha: p.fecha.slice(5),
    peso: p.pesoRealizado || 0,
    reps: p.repeticionesRealizadas,
    ejercicio: p.ejercicioNombre,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>Panel de Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Hola, <span className="text-emerald-400">{activeUser?.nombre}</span> 💪
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Monitorea tus entrenamientos, mantén la consistencia y alcanza tu objetivo físico de{' '}
              <span className="text-slate-200 font-medium lowercase">
                {activeUser?.objetivo.replace('_', ' ')}
              </span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/progreso"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-500/20 text-xs transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Registrar Progreso
            </Link>
            <Link
              to="/rutinas"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 text-xs transition-all"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              Ver Rutinas
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Rutinas Activas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Outfit']">
            {isLoadingRutinas ? '...' : rutinasActivas.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {rutinas.length} rutinas totales creadas
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Registros Realizados</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Outfit']">
            {isLoadingProgresos ? '...' : progresos.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Series y repeticiones registradas</p>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Última Carga</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-['Outfit']">
            {ultimoProgreso ? `${ultimoProgreso.pesoRealizado || 0} kg` : '0 kg'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {ultimoProgreso ? ultimoProgreso.ejercicioNombre : 'Sin registros aún'}
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Objetivo</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1">
            {activeUser ? (
              <Badge type="objetivo" value={activeUser.objetivo} />
            ) : (
              <span className="text-sm text-slate-400">-</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Rol: <span className="text-slate-300 font-semibold">{activeUser?.rol}</span>
          </p>
        </div>
      </div>

      {/* Progress Chart & Recent Routines Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (2 spans) */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Evolución de Cargas Recientes (kg)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Seguimiento de peso levantado a lo largo del tiempo
              </p>
            </div>
            <Link
              to="/progreso"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
            >
              Historial completo <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
              <Dumbbell className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm">Aún no hay progresos registrados para graficar.</p>
              <Link to="/progreso" className="text-xs text-emerald-400 mt-2 underline">
                Registra tu primera serie
              </Link>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="kg" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="peso"
                    name="Peso (kg)"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPeso)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Active Routines Column (1 span) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white font-['Outfit']">Rutinas Activas</h2>
              <Link to="/rutinas" className="text-xs text-emerald-400 hover:underline">
                Ver todas ({rutinas.length})
              </Link>
            </div>

            {rutinasActivas.length === 0 ? (
              <div className="py-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs">No tienes rutinas activas asignadas.</p>
                <Link
                  to="/rutinas"
                  className="mt-3 inline-block px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold"
                >
                  + Crear Rutina
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {rutinasActivas.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">{r.nombre}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {r.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                    <Badge type="status" value={r.activa} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/60 mt-4">
            <Link
              to="/rutinas"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Explorar Rutinas y Ejercicios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
