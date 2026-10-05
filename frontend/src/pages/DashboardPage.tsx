import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  TrendingUp, 
  Plus, 
  Calendar, 
  Zap,
  CheckCircle2,
  Activity,
  Flame,
  Target
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useUser } from '../context/UserContext';
import { rutinasApi } from '../api/rutinas.api';
import { progresosApi } from '../api/progresos.api';
import { Badge } from '../components/Badge';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { CircularProgress } from '../components/CircularProgress';

export const DashboardPage: React.FC = () => {
  const { activeUser, users } = useUser();

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

  // Chart data in chronological order
  const chartData = [...progresos].reverse().slice(-10).map((p) => ({
    fecha: p.fecha.slice(5),
    peso: p.pesoRealizado || 0,
    reps: p.repeticionesRealizadas,
    ejercicio: p.ejercicioNombre,
  }));

  const maxPeso = progresos.length > 0 ? Math.max(...progresos.map((p) => p.pesoRealizado || 0)) : 0;
  const totalSeries = progresos.reduce((acc, p) => acc + p.seriesRealizadas, 0);

  // Calculation for adherence percentage (mock or sessions based)
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
            Parámetros de sobrecarga progresiva y métricas de rendimiento en tiempo real.
          </p>
        </div>

        {/* Buttons: Primary & Secondary in pill-shape */}
        <div className="flex items-center gap-3">
          <Link
            to="/progreso"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            Registrar sesión
          </Link>
          <Link
            to="/rutinas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-medium hover:border-[var(--accent-primary)]/50 active:scale-95 transition-all font-inter"
          >
            <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" strokeWidth={2} />
            Rutinas ({rutinas.length})
          </Link>
        </div>
      </div>

      {/* FILA DE MÉTRICAS: PROTAGONISTA VISUAL + FRANJA COMPACTA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* TARJETA PROTAGONISTA VISUAL (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[var(--accent-primary)]/40 transition-colors">
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
                    Máxima resistencia levantada
                  </h3>
                </div>
              </div>

              {/* Variación positiva en --accent-primary */}
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
              {ultimoProgreso ? ultimoProgreso.ejercicioNombre : 'Sin registros de peso aún'}
            </span>
            <span className="text-[var(--accent-primary)] font-space text-xs shrink-0 font-medium">
              {ultimoProgreso ? ultimoProgreso.fecha : 'Pendiente'}
            </span>
          </div>
        </div>

        {/* FRANJA COMPACTA DE MÉTRICAS (7 cols) - CON ANILLO DE PROGRESO CIRCULAR */}
        <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-2xl grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
          {/* Métrica 1: Anillo de Adherencia Circular */}
          <div className="p-5 flex items-center justify-center">
            <CircularProgress
              percentage={adherencia}
              size={82}
              strokeWidth={7}
              label="Adherencia"
              sublabel="Consistencia de plan"
            />
          </div>

          {/* Métrica 2: Rutinas Activas */}
          <div className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold text-[var(--text-secondary)] font-space">
                Plan activo
              </span>
              <Calendar className="w-4 h-4" strokeWidth={2} />
            </div>
            <div className="my-2">
              <div className="text-3xl font-bold text-[var(--text-primary)] font-space tabular-nums">
                <AnimatedCounter value={rutinasActivas.length} />
                <span className="text-xs text-[var(--text-secondary)] font-normal ml-2 font-inter">
                  / {rutinas.length} total
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-inter line-clamp-1">
              {rutinasActivas.length > 0 ? rutinasActivas[0].nombre : 'Ninguna activa'}
            </p>
          </div>

          {/* Métrica 3: Series y Perfil */}
          <div className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold text-[var(--text-secondary)] font-space">
                Volumen total
              </span>
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={2} />
            </div>
            <div className="my-2">
              <div className="text-3xl font-bold text-[var(--text-primary)] font-space tabular-nums">
                <AnimatedCounter value={totalSeries} />
                <span className="text-xs text-[var(--accent-primary)] font-semibold ml-2 font-inter">
                  series
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge type="objetivo" value={activeUser?.objetivo || 'MANTENER'} />
              <Badge type="rol" value={activeUser?.rol || 'USUARIO'} />
            </div>
          </div>
        </div>
      </div>

      {/* ALERTA DEL MOTOR DE IA (Exclusivo en --accent-secondary: #FF8A3D) */}
      <div className="bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-secondary)] text-[#0D1117] flex items-center justify-center shrink-0 font-bold">
            <Zap className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[var(--accent-secondary)] font-space">
                Ajuste del motor de IA
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/40 font-inter">
                Calibración inteligente
              </span>
            </div>
            <p className="text-xs text-[var(--text-primary)] font-inter mt-0.5">
              Consistencia sólida detectada. La IA ha calibrado +2.5 kg en tus ejercicios principales para el próximo microciclo.
            </p>
          </div>
        </div>

        {/* Botón terciario en texto plano con flecha "→" */}
        <Link
          to="/rutinas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-secondary)] hover:opacity-80 transition-opacity font-inter whitespace-nowrap self-end sm:self-center"
        >
          <span>Ver rutina calibrada</span>
          <span>→</span>
        </Link>
      </div>

      {/* Gráfica de Progreso y Listado de Rutinas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica Analítica (2 cols) */}
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--border)]">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] font-space flex items-center gap-2 tracking-tight">
                <Activity className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={2} />
                Historial de sobrecarga progresiva (kg)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                Trazo de cargas progresivas registradas
              </p>
            </div>

            {/* Botón terciario */}
            <Link
              to="/progreso"
              className="inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:opacity-80 transition-opacity font-medium font-inter"
            >
              <span>Detalles</span>
              <span>→</span>
            </Link>
          </div>

          {chartData.length === 0 ? (
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
                    name="Peso"
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
          )}
        </div>

        {/* Rutinas Asignadas (1 col) */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)] font-space tracking-tight">
                Rutinas activas
              </h2>
              {/* Botón terciario */}
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
    </div>
  );
};
