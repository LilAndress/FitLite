import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  ArrowRight, 
  Zap, 
  Scale, 
  LineChart, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  ChevronRight, 
  Flame,
  Cpu
} from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { ScrollReveal } from '../components/ScrollReveal';
import { AnimatedCounter } from '../components/AnimatedCounter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0D1117] text-[var(--text-primary)] font-inter selection:bg-[var(--accent-primary)] selection:text-[#0D1117] overflow-x-hidden">
      {/* 1. NAVBAR PÚBLICA */}
      <PublicNavbar />

      {/* 2. HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Imagen de fondo de alto impacto con efecto parallax sutil continuo */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/auth-hero.jpg"
            alt="Atleta entrenando con barra pesada y tiza"
            className="w-full h-full object-cover object-center filter grayscale contrast-125 brightness-75 animate-slow-zoom will-change-transform"
          />
          {/* Overlays degradados para contraste y legibilidad impecable */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117]/80 via-[#0D1117]/70 to-[#0D1117]" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0D1117]/60 to-[#0D1117]" />
          
          {/* Resplandor ambiental de IA (glow continuo discreto) */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[var(--accent-primary)]/15 rounded-full blur-[130px] pointer-events-none animate-pulse-glow" />
        </div>

        {/* Contenido Central del Hero */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Badge superior */}
          <ScrollReveal delay={100}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface)]/80 border border-[var(--accent-primary)]/40 backdrop-blur-md text-[var(--accent-primary)] text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-space tracking-wide">MOTOR DE IA & SOBRECARGA PROGRESIVA</span>
            </div>
          </ScrollReveal>

          {/* Headline grande tipo 'ENTRENA. AVANZA. MEJORA. CON IA.' */}
          <ScrollReveal delay={200}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-orbitron tracking-tight leading-[1.08] text-white uppercase drop-shadow-xl">
              ENTRENA. AVANZA. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[#d9ff85] to-[var(--accent-primary)]">
                MEJORA. CON IA.
              </span>
            </h1>
          </ScrollReveal>

          {/* Subtítulo corto */}
          <ScrollReveal delay={300}>
            <p className="mt-6 text-sm sm:text-base lg:text-lg text-[var(--text-secondary)] max-w-2xl font-inter leading-relaxed">
              FitLite calibra tus series, repeticiones y cargas automáticamente según tu rendimiento real. 
              Elimina el estancamiento con sobrecarga progresiva asistida por datos científicos.
            </p>
          </ScrollReveal>

          {/* Botones de llamada a la acción (CTA) */}
          <ScrollReveal delay={400}>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                to="/registro"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-sm tracking-wide hover:brightness-105 hover:shadow-[0_0_25px_rgba(183,255,59,0.4)] active:scale-95 transition-all font-inter group"
              >
                <span>Comenzar gratis</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#como-funciona"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[var(--surface)]/80 hover:bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)]/40 text-[var(--text-primary)] text-sm font-medium transition-all active:scale-95 font-inter backdrop-blur-sm"
              >
                <span>Ver cómo funciona</span>
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
              </a>
            </div>
          </ScrollReveal>

          {/* Franja de Métricas animadas del Hero */}
          <ScrollReveal delay={500} className="w-full">
            <div className="mt-14 pt-8 border-t border-[var(--border)]/70 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold font-space text-[var(--accent-primary)] tabular-nums">
                  +<AnimatedCounter value={14200} duration={1200} />
                </div>
                <div className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                  Atletas activos
                </div>
              </div>
              <div className="text-center border-x border-[var(--border)]/70">
                <div className="text-2xl sm:text-3xl font-bold font-space text-[var(--text-primary)] tabular-nums">
                  <AnimatedCounter value={98.6} decimals={1} duration={1200} suffix="%" />
                </div>
                <div className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                  Adherencia media
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold font-space text-[var(--accent-secondary)] tabular-nums">
                  +<AnimatedCounter value={2.8} decimals={1} duration={1200} suffix="M" />
                </div>
                <div className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                  Series calibradas
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 3. SECCIÓN DE CARACTERÍSTICAS (3 COLUMNAS) */}
      <section id="caracteristicas" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[var(--border)]/60">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--accent-primary)] font-space mb-3 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Tecnología aplicada</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-orbitron tracking-tight text-[var(--text-primary)] uppercase">
              CARACTERÍSTICAS DISEÑADAS PARA EL RENDIMIENTO
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[var(--text-secondary)] font-inter leading-relaxed">
              Un ecosistema de entrenamiento inteligente creado para deportistas que buscan optimizar cada levantamiento con rigor científico.
            </p>
          </div>
        </ScrollReveal>

        {/* Grid de 3 Columnas con Micro-interacciones en los íconos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Card 1: Rutinas que se adaptan */}
          <ScrollReveal delay={150}>
            <div className="group h-full p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div>
                {/* Ícono con micro-interacción al hover */}
                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--accent-primary)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 group-hover:border-[var(--accent-primary)] group-hover:shadow-[0_0_20px_rgba(183,255,59,0.3)] transition-all duration-300">
                  <Cpu className="w-7 h-7" strokeWidth={1.8} />
                </div>
                <h3 className="text-lg font-bold font-orbitron text-[var(--text-primary)] tracking-wide uppercase mb-3">
                  RUTINAS QUE SE ADAPTAN
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-inter leading-relaxed">
                  El motor de IA analiza tu volumen semanal y tu tasa de fatiga acumulada para prescribir aumentos exactos (+2.5 kg) en tus levantamientos clave, evitando estancamientos y lesiones.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--border)] flex items-center gap-2 text-xs font-semibold text-[var(--accent-primary)] font-space">
                <span>Algoritmo adaptativo</span>
                <span>→</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2: Seguimiento real */}
          <ScrollReveal delay={300}>
            <div className="group h-full p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div>
                {/* Ícono con micro-interacción al hover */}
                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] text-[#38bdf8] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 group-hover:border-[#38bdf8] group-hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-300">
                  <Scale className="w-7 h-7" strokeWidth={1.8} />
                </div>
                <h3 className="text-lg font-bold font-orbitron text-[var(--text-primary)] tracking-wide uppercase mb-3">
                  SEGUIMIENTO REAL
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-inter leading-relaxed">
                  Bitácora integral de kilajes realizados, seguimiento histórico de peso corporal en ayunas y cálculo de adherencia a tus microciclos, todo sincronizado en un centro de mando en tiempo real.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--border)] flex items-center gap-2 text-xs font-semibold text-[#38bdf8] font-space">
                <span>Control antropométrico</span>
                <span>→</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 3: Resultados medibles */}
          <ScrollReveal delay={450}>
            <div className="group h-full p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div>
                {/* Ícono con micro-interacción al hover */}
                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--accent-secondary)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 group-hover:border-[var(--accent-secondary)] group-hover:shadow-[0_0_20px_rgba(255,138,61,0.3)] transition-all duration-300">
                  <LineChart className="w-7 h-7" strokeWidth={1.8} />
                </div>
                <h3 className="text-lg font-bold font-orbitron text-[var(--text-primary)] tracking-wide uppercase mb-3">
                  RESULTADOS MEDIBLES
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-inter leading-relaxed">
                  Gráficas analíticas de evolución de fuerza máxima, volumen acumulado y composición física para que visualices tu progreso con absoluta transparencia y fundamentos matemáticos.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--border)] flex items-center gap-2 text-xs font-semibold text-[var(--accent-secondary)] font-space">
                <span>Curvas de progreso</span>
                <span>→</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. SECCIÓN 'CÓMO FUNCIONA' (PASOS NUMERADOS) */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[var(--border)]/60 bg-gradient-to-b from-transparent via-[#10151c]/40 to-transparent">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--accent-primary)] font-space mb-3 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              <span>Metodología</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-orbitron tracking-tight text-[var(--text-primary)] uppercase">
              CÓMO FUNCIONA EL SISTEMA
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[var(--text-secondary)] font-inter leading-relaxed">
              Un flujo de 4 pasos continuos que convierten tus entrenamientos diarios en adaptaciones biológicas constantes.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Pasos numerados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Paso 1 */}
          <ScrollReveal delay={100}>
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)]/40 transition-all duration-200 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black font-space text-[var(--accent-primary)] opacity-80">
                    01
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)] font-space">
                    Inicio
                  </span>
                </div>
                <h4 className="text-base font-bold font-orbitron text-[var(--text-primary)] mb-2">
                  Regístrate y define tu meta
                </h4>
                <p className="text-xs text-[var(--text-secondary)] font-inter leading-relaxed">
                  Crea tu perfil con tu edad, estatura, peso corporal inicial y nivel deportivo para alimentar el baseline del motor.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[var(--border)]/70 flex items-center gap-2 text-xs text-[var(--text-secondary)] font-inter">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Perfil antropométrico</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Paso 2 */}
          <ScrollReveal delay={200}>
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)]/40 transition-all duration-200 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black font-space text-[var(--accent-primary)] opacity-80">
                    02
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)] font-space">
                    Acción
                  </span>
                </div>
                <h4 className="text-base font-bold font-orbitron text-[var(--text-primary)] mb-2">
                  Entrena tu rutina inicial
                </h4>
                <p className="text-xs text-[var(--text-secondary)] font-inter leading-relaxed">
                  Ejecuta tus sesiones guiadas y anota con facilidad los kilajes y repeticiones ejecutadas en cada serie en tu bitácora.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[var(--border)]/70 flex items-center gap-2 text-xs text-[var(--text-secondary)] font-inter">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Registro en tiempo real</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Paso 3 */}
          <ScrollReveal delay={300}>
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)]/40 transition-all duration-200 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black font-space text-[var(--accent-primary)] opacity-80">
                    03
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)] font-space">
                    Análisis
                  </span>
                </div>
                <h4 className="text-base font-bold font-orbitron text-[var(--text-primary)] mb-2">
                  La IA analiza tu progreso
                </h4>
                <p className="text-xs text-[var(--text-secondary)] font-inter leading-relaxed">
                  Los modelos algorítmicos procesan tu volumen efectivo, consistencia de asistencia y ratio de superación de cargas.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[var(--border)]/70 flex items-center gap-2 text-xs text-[var(--text-secondary)] font-inter">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Cálculo de sobrecarga</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Paso 4 */}
          <ScrollReveal delay={400}>
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)]/40 transition-all duration-200 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black font-space text-[var(--accent-primary)] opacity-80">
                    04
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)] font-space">
                    Evolución
                  </span>
                </div>
                <h4 className="text-base font-bold font-orbitron text-[var(--text-primary)] mb-2">
                  Tu rutina se calibra sola
                </h4>
                <p className="text-xs text-[var(--text-secondary)] font-inter leading-relaxed">
                  Recibe automáticamente los nuevos pesos objetivo para tu siguiente ciclo sin adivinar ni estancarte jamás.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[var(--border)]/70 flex items-center gap-2 text-xs text-[var(--text-secondary)] font-inter">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Microciclos optimizados</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. CTA FINAL DESTACADO */}
      <section id="metricas" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="relative rounded-3xl p-10 sm:p-14 lg:p-16 overflow-hidden bg-gradient-to-r from-[var(--surface)] via-[#151f15] to-[var(--surface)] border border-[var(--accent-primary)]/30 text-center shadow-2xl">
            {/* Glow de fondo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--accent-primary)]/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 flex items-center justify-center mb-6">
                <Flame className="w-6 h-6" strokeWidth={2} />
              </div>

              <h2 className="text-3xl sm:text-5xl font-black font-orbitron text-white tracking-tight leading-tight uppercase">
                MÁS FUERTE QUE AYER. <br />
                <span className="text-[var(--accent-primary)]">EMPIEZA HOY CON IA.</span>
              </h2>

              <p className="mt-4 text-xs sm:text-sm text-[var(--text-secondary)] font-inter leading-relaxed max-w-lg">
                Comienza a registrar tus entrenamientos con sobrecarga progresiva automática. Toma el control total de tu composición física.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  to="/registro"
                  className="px-8 py-4 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-sm tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter shadow-lg hover:shadow-[0_0_30px_rgba(183,255,59,0.5)]"
                >
                  Crear mi cuenta gratis
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-4 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)]/40 text-xs font-semibold text-[var(--text-primary)] font-inter transition-all active:scale-95"
                >
                  Ya tengo una cuenta →
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-6 text-[11px] text-[var(--text-secondary)] font-inter">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  Sin tarjeta de crédito
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  Calibración instantánea
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 6. FOOTER PÚBLICO */}
      <footer className="border-t border-[var(--border)]/70 bg-[#0B0E13] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo y lema */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <span className="text-lg font-bold tracking-tight font-space text-[var(--text-primary)]">
                Fit<span className="text-[var(--accent-primary)]">Lite</span> Pro
              </span>
            </Link>
            <span className="hidden sm:inline text-xs text-[var(--text-secondary)]/40">|</span>
            <p className="text-xs text-[var(--text-secondary)] font-inter">
              Plataforma deportiva inteligente y sobrecarga progresiva.
            </p>
          </div>

          {/* Links de navegación */}
          <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)] font-inter">
            <a href="#caracteristicas" className="hover:text-[var(--accent-primary)] transition-colors">
              Características
            </a>
            <a href="#como-funciona" className="hover:text-[var(--accent-primary)] transition-colors">
              Cómo funciona
            </a>
            <Link to="/login" className="hover:text-[var(--accent-primary)] transition-colors">
              Iniciar sesión
            </Link>
            <Link to="/registro" className="text-[var(--accent-primary)] font-semibold hover:underline">
              Registro
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[var(--border)]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--text-secondary)]/60 font-inter">
          <p>© {new Date().getFullYear()} FitLite Pro. Todos los derechos reservados.</p>
          <p className="font-space">Tecnología de Inteligencia Artificial para el acondicionamiento físico.</p>
        </div>
      </footer>
    </div>
  );
};
