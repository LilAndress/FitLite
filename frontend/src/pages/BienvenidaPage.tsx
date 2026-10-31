import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, 
  History, 
  ClipboardList, 
  Dumbbell, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  Clock, 
  Calendar, 
  AlertCircle,
  ShieldCheck,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { rutinasApi } from '../api/rutinas.api';
import { usuariosApi } from '../api/usuarios.api';
import type { RutinaIaBorradorResponse, PesoDeclarado } from '../types';

type OnboardingStep = 
  | 'selection'           // Initial 3 large cards
  | 'returning-form'      // Form for "He entrenado antes"
  | 'loading-draft'       // Generating IA routine
  | 'preview-draft'       // Draft preview with save / regenerate / skip
  | 'error-draft';        // Error generation state

export const BienvenidaPage: React.FC = () => {
  const { activeUser, setActiveUser, refreshUsers } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<OnboardingStep>('selection');
  const [selectedPath, setSelectedPath] = useState<'NUNCA' | 'RETOMANDO' | 'MANUAL' | null>(null);

  // Returning athlete form state
  const [tiempoTotal, setTiempoTotal] = useState<string>('6 meses a 2 años');
  const [tiempoSinEntrenar, setTiempoSinEntrenar] = useState<string>('1 a 6 meses');
  const [pesoPressBanca, setPesoPressBanca] = useState<string>('');
  const [pesoSentadilla, setPesoSentadilla] = useState<string>('');
  const [pesoJalon, setPesoJalon] = useState<string>('');

  // Draft state
  const [borrador, setBorrador] = useState<RutinaIaBorradorResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Complete onboarding helper
  const finishOnboardingMutation = useMutation({
    mutationFn: async (pesos?: PesoDeclarado[]) => {
      if (!activeUser) throw new Error('No hay usuario activo');
      return usuariosApi.completarOnboarding({
        usuarioId: activeUser.id,
        situacionInicial: selectedPath === 'NUNCA' ? 'NUNCA_ENTRENADO' : selectedPath === 'RETOMANDO' ? 'ENTRENADO_ANTES' : 'TIENE_RUTINA',
        tiempoTotalEntrenando: selectedPath === 'RETOMANDO' ? tiempoTotal : undefined,
        tiempoSinEntrenar: selectedPath === 'RETOMANDO' ? tiempoSinEntrenar : undefined,
        pesosDeclarados: pesos && pesos.length > 0 ? pesos : undefined,
      });
    },
    onSuccess: async (updatedUser) => {
      setActiveUser(updatedUser);
      await refreshUsers();
      queryClient.invalidateQueries({ queryKey: ['rutinas'] });
      queryClient.invalidateQueries({ queryKey: ['progresos'] });
    },
  });

  const getDeclaredWeights = (): PesoDeclarado[] => {
    const list: PesoDeclarado[] = [];
    const pb = parseFloat(pesoPressBanca);
    if (!isNaN(pb) && pb > 0) {
      list.push({ ejercicioNombre: 'Press banca plano con barra', peso: pb, repeticiones: 10 });
    }
    const sq = parseFloat(pesoSentadilla);
    if (!isNaN(sq) && sq > 0) {
      list.push({ ejercicioNombre: 'Sentadilla trasera con barra', peso: sq, repeticiones: 10 });
    }
    const jl = parseFloat(pesoJalon);
    if (!isNaN(jl) && jl > 0) {
      list.push({ ejercicioNombre: 'Jalón al pecho en polea', peso: jl, repeticiones: 10 });
    }
    return list;
  };

  // Generate Draft Mutation
  const generarBorradorMutation = useMutation({
    mutationFn: async (isReturning: boolean) => {
      if (!activeUser) throw new Error('No hay usuario activo');
      const perfil = activeUser.perfilSalud;
      const declared = isReturning ? getDeclaredWeights() : [];

      return rutinasApi.generarBorradorIa({
        usuarioId: activeUser.id,
        diasPorSemana: perfil?.diasDisponiblesSemana || 4,
        minutosPorSesion: perfil?.minutosPorSesion || 60,
        situacionInicial: isReturning ? 'ENTRENADO_ANTES' : 'NUNCA_ENTRENADO',
        tiempoTotalEntrenando: isReturning ? tiempoTotal : undefined,
        tiempoSinEntrenar: isReturning ? tiempoSinEntrenar : undefined,
        pesosDeclarados: declared.length > 0 ? declared : undefined,
      });
    },
    onSuccess: (data) => {
      setBorrador(data);
      setStep('preview-draft');
      setErrorMessage(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'No pudimos generar la rutina en este momento. Intenta nuevamente.';
      setErrorMessage(msg);
      setStep('error-draft');
    },
  });

  // Save routine mutation
  const guardarBorradorMutation = useMutation({
    mutationFn: async () => {
      if (!activeUser || !borrador) throw new Error('Datos incompletos');
      // 1. Guardar rutina
      await rutinasApi.guardarBorradorIa({
        usuarioId: activeUser.id,
        nombre: borrador.nombre,
        descripcion: borrador.descripcion,
        ejercicios: borrador.ejercicios.map((ej) => ({
          nombre: ej.nombre,
          grupoMuscular: ej.grupoMuscular,
          seriesObjetivo: ej.seriesObjetivo,
          repeticionesObjetivo: ej.repeticionesObjetivo,
          pesoObjetivo: ej.pesoObjetivo,
        })),
      });

      // 2. Finalizar onboarding y registrar marcas base si hubo
      const declared = selectedPath === 'RETOMANDO' ? getDeclaredWeights() : [];
      return finishOnboardingMutation.mutateAsync(declared);
    },
    onSuccess: () => {
      navigate('/dashboard');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Error al guardar la rutina en tu cuenta.';
      setErrorMessage(msg);
    },
  });

  // Handlers for the 3 selection cards
  const handleSelectNunca = () => {
    setSelectedPath('NUNCA');
    setStep('loading-draft');
    generarBorradorMutation.mutate(false);
  };

  const handleSelectRetomando = () => {
    setSelectedPath('RETOMANDO');
    setStep('returning-form');
  };

  const handleSelectManual = async () => {
    setSelectedPath('MANUAL');
    await finishOnboardingMutation.mutateAsync([]);
    navigate('/rutinas?crear=true');
  };

  const handleGenerateReturning = () => {
    setStep('loading-draft');
    generarBorradorMutation.mutate(true);
  };

  const handleRegenerate = () => {
    setStep('loading-draft');
    setBorrador(null);
    generarBorradorMutation.mutate(selectedPath === 'RETOMANDO');
  };

  const handleSkip = async () => {
    const declared = selectedPath === 'RETOMANDO' ? getDeclaredWeights() : [];
    await finishOnboardingMutation.mutateAsync(declared);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-inter py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[var(--accent-primary)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-[var(--accent-secondary)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between mb-8 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
            <Zap className="w-5 h-5" />
          </div>
          <span className="font-space font-bold tracking-tight text-lg">
            Fit<span className="text-[var(--accent-primary)]">Lite</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)] font-space">
            Paso inicial
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[11px] font-semibold text-[var(--accent-primary)]">
            Onboarding
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center z-10">
        {/* ================= STEP 1: INITIAL 3 CARDS ================= */}
        {step === 'selection' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-xl mx-auto space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 font-space tracking-tight">
                <Sparkles className="w-3.5 h-3.5" />
                Configuración del atleta
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] font-space tracking-tight">
                ¿Cómo quieres empezar?
              </h1>
              <p className="text-sm text-[var(--text-secondary)] font-inter leading-relaxed">
                Selecciona tu punto de partida. Personalizaremos tu primera experiencia de entrenamiento de acuerdo con tu trayectoria.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
              {/* Card 1: Nunca he entrenado */}
              <button
                type="button"
                onClick={handleSelectNunca}
                className="group relative p-6 sm:p-7 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)] transition-all duration-300 text-left flex flex-col justify-between hover:shadow-xl hover:shadow-[var(--accent-primary)]/5 active:scale-[0.98] cursor-pointer"
              >
                <div>
                  <div className="w-13 h-13 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] mb-5 group-hover:scale-110 group-hover:bg-[var(--accent-primary)] group-hover:text-[#0D1117] transition-all duration-300 shadow-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] font-space tracking-tight mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
                    Nunca he entrenado
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-inter">
                    Aprende los fundamentos. Diseñaremos una rutina adaptada a tu perfil desde cero con IA y técnica guiada.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--border)]/60 flex items-center justify-between text-xs font-semibold text-[var(--accent-primary)] font-space">
                  <span>Generar con IA</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Card 2: He entrenado antes, pero no tengo rutina */}
              <button
                type="button"
                onClick={handleSelectRetomando}
                className="group relative p-6 sm:p-7 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-secondary)] transition-all duration-300 text-left flex flex-col justify-between hover:shadow-xl hover:shadow-[var(--accent-secondary)]/5 active:scale-[0.98] cursor-pointer"
              >
                <div>
                  <div className="w-13 h-13 rounded-2xl bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/30 flex items-center justify-center text-[var(--accent-secondary)] mb-5 group-hover:scale-110 group-hover:bg-[var(--accent-secondary)] group-hover:text-[#0D1117] transition-all duration-300 shadow-sm">
                    <History className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] font-space tracking-tight mb-2 group-hover:text-[var(--accent-secondary)] transition-colors">
                    He entrenado antes, pero no tengo rutina
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-inter">
                    Retoma con una rutina inteligente considerando tu experiencia acumulada y tus tiempos de descanso.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--border)]/60 flex items-center justify-between text-xs font-semibold text-[var(--accent-secondary)] font-space">
                  <span>Ajustar experiencia</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Card 3: Ya tengo una rutina */}
              <button
                type="button"
                onClick={handleSelectManual}
                className="group relative p-6 sm:p-7 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--text-primary)] transition-all duration-300 text-left flex flex-col justify-between hover:shadow-xl active:scale-[0.98] cursor-pointer"
              >
                <div>
                  <div className="w-13 h-13 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--text-primary)] mb-5 group-hover:scale-110 group-hover:bg-white group-hover:text-[#0D1117] transition-all duration-300 shadow-sm">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] font-space tracking-tight mb-2 group-hover:text-white transition-colors">
                    Ya tengo una rutina
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-inter">
                    ¿Tienes tu plan armado? Abre el constructor manual y carga tus ejercicios, series y objetivos de sobrecarga.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--border)]/60 flex items-center justify-between text-xs font-semibold text-[var(--text-primary)] font-space">
                  <span>Constructor manual</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: RETURNING ATHLETE FORM ================= */}
        {step === 'returning-form' && (
          <div className="max-w-xl mx-auto w-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <span className="text-[11px] font-semibold text-[var(--accent-secondary)] font-space">
                  Nivel y antecedentes
                </span>
                <h2 className="text-xl font-bold text-[var(--text-primary)] font-space tracking-tight mt-0.5">
                  Cuéntanos sobre tu entrenamiento previo
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStep('selection')}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Select 1: Tiempo total entrenando */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                  Tiempo total entrenando en tu vida:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'menos de 6 meses', label: 'Menos de 6 meses' },
                    { id: '6 meses a 2 años', label: '6 meses a 2 años' },
                    { id: 'más de 2 años', label: 'Más de 2 años' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTiempoTotal(opt.id)}
                      className={`p-2.5 rounded-xl border text-xs font-inter font-medium text-center transition-all cursor-pointer ${
                        tiempoTotal === opt.id
                          ? 'bg-[var(--accent-secondary)]/15 border-[var(--accent-secondary)] text-[var(--accent-secondary)] font-bold shadow-sm'
                          : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select 2: Hace cuánto dejó de entrenar */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                  ¿Hace cuánto dejaste de entrenar regularmente?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'menos de 1 mes', label: 'Menos de 1 mes' },
                    { id: '1 a 6 meses', label: '1 a 6 meses' },
                    { id: 'más de 6 meses', label: 'Más de 6 meses' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTiempoSinEntrenar(opt.id)}
                      className={`p-2.5 rounded-xl border text-xs font-inter font-medium text-center transition-all cursor-pointer ${
                        tiempoSinEntrenar === opt.id
                          ? 'bg-[var(--accent-secondary)]/15 border-[var(--accent-secondary)] text-[var(--accent-secondary)] font-bold shadow-sm'
                          : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional: Pesos aproximados en ejercicios base */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)] font-space flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    Peso aproximado en ejercicios base (Opcional)
                  </label>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-inter italic mb-3">
                  Si no lo recuerdas, déjalo vacío.
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                    <span className="text-xs font-medium font-inter flex-1 text-[var(--text-secondary)]">
                      Press de banca plano
                    </span>
                    <div className="flex items-center gap-1.5 w-28">
                      <input
                        type="number"
                        min="0"
                        step="2.5"
                        placeholder="Ej. 60"
                        value={pesoPressBanca}
                        onChange={(e) => setPesoPressBanca(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-right font-space text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-secondary)]"
                      />
                      <span className="text-[11px] text-[var(--text-secondary)] font-space">kg</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                    <span className="text-xs font-medium font-inter flex-1 text-[var(--text-secondary)]">
                      Sentadilla o Prensa
                    </span>
                    <div className="flex items-center gap-1.5 w-28">
                      <input
                        type="number"
                        min="0"
                        step="2.5"
                        placeholder="Ej. 80"
                        value={pesoSentadilla}
                        onChange={(e) => setPesoSentadilla(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-right font-space text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-secondary)]"
                      />
                      <span className="text-[11px] text-[var(--text-secondary)] font-space">kg</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                    <span className="text-xs font-medium font-inter flex-1 text-[var(--text-secondary)]">
                      Jalón al pecho / Remo
                    </span>
                    <div className="flex items-center gap-1.5 w-28">
                      <input
                        type="number"
                        min="0"
                        step="2.5"
                        placeholder="Ej. 50"
                        value={pesoJalon}
                        onChange={(e) => setPesoJalon(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-right font-space text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-secondary)]"
                      />
                      <span className="text-[11px] text-[var(--text-secondary)] font-space">kg</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-inter underline underline-offset-4 cursor-pointer"
              >
                Saltar por ahora
              </button>
              <button
                type="button"
                onClick={handleGenerateReturning}
                className="px-6 py-2.5 rounded-full bg-[var(--accent-secondary)] text-[#0D1117] text-xs font-bold font-space tracking-tight hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                Generar mi rutina con IA
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: LOADING SKELETON ================= */}
        {step === 'loading-draft' && (
          <div className="max-w-xl mx-auto w-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 space-y-6 text-center animate-fadeIn shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] mx-auto animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-space tracking-tight">
                Generando tu rutina con Coach IA...
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-inter mt-1.5 max-w-sm mx-auto leading-relaxed">
                Analizando tu nivel, frecuencia semanal, equipamiento disponible y zonas a proteger para crear tu programa ideal.
              </p>
            </div>

            {/* Skeleton visual */}
            <div className="space-y-2.5 pt-2 animate-pulse">
              <div className="h-4 bg-[var(--border)]/40 rounded-lg w-2/3 mx-auto" />
              <div className="h-3 bg-[var(--border)]/20 rounded-lg w-4/5 mx-auto" />
              <div className="space-y-2 pt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: DRAFT PREVIEW ================= */}
        {step === 'preview-draft' && borrador && (
          <div className="max-w-2xl mx-auto w-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-space">
                    Borrador propuesto por IA
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-space tracking-tight">
                  {borrador.nombre}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-inter mt-1 leading-relaxed">
                  {borrador.descripcion}
                </p>
              </div>
            </div>

            {borrador.razonamiento && (
              <div className="p-3.5 rounded-xl bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/25 text-xs font-inter flex items-start gap-2.5 text-[var(--text-secondary)]">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-secondary)] shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-[var(--text-primary)]">
                  <span className="font-semibold text-[var(--accent-secondary)] font-space mr-1">Enfoque técnico:</span>
                  {borrador.razonamiento}
                </p>
              </div>
            )}

            {/* Exercises list */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)] font-space uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  Ejercicios prescritos ({borrador.ejercicios.length})
                </span>
                <span className="text-[11px] text-[var(--text-secondary)] font-inter">
                  Series × Reps
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {borrador.ejercicios.map((ej, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-between gap-3 hover:border-[var(--accent-primary)]/30 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[var(--text-primary)] font-space">
                          {ej.nombre}
                        </span>
                        {ej.grupoMuscular && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 font-inter">
                            {ej.grupoMuscular}
                          </span>
                        )}
                      </div>
                      {ej.nota && (
                        <p className="text-[10px] text-[var(--text-secondary)] font-inter mt-1 truncate">
                          {ej.nota}
                        </p>
                      )}
                    </div>
                    <div className="text-xs font-space font-semibold text-[var(--text-primary)] tabular-nums shrink-0 bg-[var(--surface)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                      {ej.seriesObjetivo} × {ej.repeticionesObjetivo}
                      {ej.pesoObjetivo ? ` • ${ej.pesoObjetivo} kg` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions: Guardar, Regenerar, Saltar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-inter underline underline-offset-4 cursor-pointer order-3 sm:order-1"
              >
                Saltar por ahora
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end order-1 sm:order-2">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={guardarBorradorMutation.isPending}
                  className="px-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold font-inter active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerar
                </button>
                <button
                  type="button"
                  onClick={() => guardarBorradorMutation.mutate()}
                  disabled={guardarBorradorMutation.isPending}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-bold font-space tracking-tight hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {guardarBorradorMutation.isPending ? 'Guardando...' : 'Guardar en mis rutinas'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: ERROR STATE ================= */}
        {step === 'error-draft' && (
          <div className="max-w-md mx-auto w-full bg-[var(--surface)] border border-red-500/30 rounded-3xl p-8 space-y-6 text-center animate-fadeIn shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-space tracking-tight">
                No pudimos generar el borrador
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-inter mt-1.5 leading-relaxed">
                {errorMessage || 'Ocurrió un problema de conexión con el motor de IA.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-white"
              >
                Saltar por ahora
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="px-5 py-2 rounded-full bg-[var(--accent-secondary)] text-[#0D1117] text-xs font-bold font-space flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
