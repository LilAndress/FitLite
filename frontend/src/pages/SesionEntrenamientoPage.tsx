import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  SkipForward, 
  AlertTriangle, 
  Sparkles, 
  Trophy, 
  Activity, 
  Flame, 
  CheckCircle2, 
  X, 
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { rutinasApi } from '../api/rutinas.api';
import { ejerciciosApi } from '../api/ejercicios.api';
import { progresosApi } from '../api/progresos.api';
import { RestTimer } from '../components/RestTimer';
import { Modal } from '../components/Modal';
import { 
  getActiveSession, 
  saveActiveSession, 
  clearActiveSession, 
  initWorkoutSession,
  saveCompletedSession,
  getPreviousCompletedSession
} from '../lib/workoutSessionStorage';
import { isPesoCorporalExercise } from '../lib/exerciseUtils';
import type { 
  WorkoutSessionState, 
  WorkoutExercise, 
  WorkoutSet, 
  EsfuerzoSesion, 
  SugerenciaSobrecarga
} from '../types';

export const SesionEntrenamientoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const rutinaId = Number(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdicional = searchParams.get('adicional') === 'true';
  const queryClient = useQueryClient();
  const { activeUser } = useUser();

  const [session, setSession] = useState<WorkoutSessionState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [showTechDesc, setShowTechDesc] = useState(false);
  const [abandonModalOpen, setAbandonModalOpen] = useState(false);

  // Estado del resumen final
  const [showSummary, setShowSummary] = useState(false);
  const [sugerenciaMotor, setSugerenciaMotor] = useState<SugerenciaSobrecarga | null>(null);
  const [sugerenciaAplicada, setSugerenciaAplicada] = useState(false);
  const [isLoadingSugerencia, setIsLoadingSugerencia] = useState(false);

  // Queries necesarias
  const { data: rutina, isLoading: isLoadingRutina } = useQuery({
    queryKey: ['rutina', rutinaId],
    queryFn: () => rutinasApi.getById(rutinaId),
    enabled: Boolean(rutinaId),
  });

  const { data: ejerciciosRutina = [], isLoading: isLoadingEjercicios } = useQuery({
    queryKey: ['ejercicios', rutinaId],
    queryFn: () => ejerciciosApi.getByRutina(rutinaId),
    enabled: Boolean(rutinaId),
  });

  const { data: userProgresos = [] } = useQuery({
    queryKey: ['progresos', activeUser?.id],
    queryFn: () => (activeUser ? progresosApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  // Inicializar o restaurar sesión
  useEffect(() => {
    if (!activeUser || !rutina || ejerciciosRutina.length === 0) return;

    const existing = getActiveSession(activeUser.id);
    if (existing && existing.rutinaId === rutinaId && !existing.isFinished && !isAdicional) {
      setSession(existing);
      const secondsSinceStart = Math.max(0, Math.floor((Date.now() - existing.startedAt) / 1000));
      setElapsedSeconds(secondsSinceStart);
    } else {
      const initialized = initWorkoutSession(activeUser.id, rutina, ejerciciosRutina, userProgresos, isAdicional);
      setSession(initialized);
      setElapsedSeconds(0);
    }
  }, [activeUser, rutina, ejerciciosRutina, userProgresos, rutinaId, isAdicional]);

  // Cronómetro en vivo
  useEffect(() => {
    if (!session || showSummary) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, showSummary]);

  // Guardar en localStorage cada vez que cambia la sesión
  const updateSessionState = (newSession: WorkoutSessionState) => {
    setSession(newSession);
    saveActiveSession(newSession);
  };

  // Mutación para guardar la serie en backend de inmediato
  const saveSetMutation = useMutation({
    mutationFn: async ({
      ejercicio,
      setIndex,
    }: {
      ejercicio: WorkoutExercise;
      setIndex: number;
    }) => {
      if (!activeUser || !session) return;
      const set = ejercicio.series[setIndex];
      const completedSetsCount = ejercicio.series.filter((s, i) => i === setIndex ? true : s.completada).length;

      return progresosApi.upsert({
        fecha: session.fecha,
        usuarioId: activeUser.id,
        ejercicioId: ejercicio.ejercicioId,
        ejercicioCatalogoId: ejercicio.ejercicioCatalogoId,
        seriesRealizadas: completedSetsCount,
        repeticionesRealizadas: set.repeticiones,
        pesoRealizado: set.peso,
        origen: 'REGISTRADO',
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progresos', activeUser?.id] });
      if (data && session) {
        // Actualizar id del backend en la serie
        const updatedEjercicios = [...session.ejercicios];
        const ej = updatedEjercicios[session.currentExerciseIndex];
        if (ej && ej.series[variables.setIndex]) {
          ej.series[variables.setIndex].backendProgresoId = data.id;
          updateSessionState({ ...session, ejercicios: updatedEjercicios });
        }
      }
    },
  });

  // Mutación para aplicar sugerencia del motor
  const aplicarSugerenciaMutation = useMutation({
    mutationFn: async (sug: SugerenciaSobrecarga) => {
      const ejActual = ejerciciosRutina.find((e) => e.id === sug.ejercicioId);
      if (!ejActual) throw new Error('Ejercicio no encontrado');

      return ejerciciosApi.update(sug.ejercicioId, {
        nombre: ejActual.nombre,
        ejercicioCatalogoId: ejActual.ejercicioCatalogoId,
        grupoMuscular: ejActual.grupoMuscular,
        descripcionTecnica: ejActual.descripcionTecnica,
        seriesObjetivo: ejActual.seriesObjetivo,
        repeticionesObjetivo: sug.repeticionesPropuestas || ejActual.repeticionesObjetivo,
        pesoObjetivo: sug.pesoPropuesto,
        rutinaId: rutinaId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios', rutinaId] });
      setSugerenciaAplicada(true);
    },
  });

  if (isLoadingRutina || isLoadingEjercicios || !session) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin mb-3" />
        <p className="text-sm font-semibold font-space text-[var(--text-primary)]">
          Preparando tu sesión de entrenamiento...
        </p>
        <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
          Calibrando ejercicios, pesos objetivo e historial previo.
        </p>
      </div>
    );
  }

  const currentExercise = session.ejercicios[session.currentExerciseIndex];
  const totalExercises = session.ejercicios.length;

  // Formato del cronómetro
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Manejadores de series
  const handleUpdateWeight = (setIndex: number, delta: number) => {
    const updated = [...session.ejercicios];
    const ej = updated[session.currentExerciseIndex];
    const currentWeight = ej.series[setIndex].peso;
    const newWeight = Math.max(0, Number((currentWeight + delta).toFixed(1)));
    ej.series[setIndex].peso = newWeight;
    updateSessionState({ ...session, ejercicios: updated });
  };

  const handleUpdateWeightInput = (setIndex: number, value: string) => {
    const val = parseFloat(value);
    const updated = [...session.ejercicios];
    const ej = updated[session.currentExerciseIndex];
    ej.series[setIndex].peso = isNaN(val) ? 0 : Math.max(0, val);
    updateSessionState({ ...session, ejercicios: updated });
  };

  const handleUpdateReps = (setIndex: number, delta: number) => {
    const updated = [...session.ejercicios];
    const ej = updated[session.currentExerciseIndex];
    const currentReps = ej.series[setIndex].repeticiones;
    const newReps = Math.max(1, currentReps + delta);
    ej.series[setIndex].repeticiones = newReps;
    updateSessionState({ ...session, ejercicios: updated });
  };

  const handleUpdateRepsInput = (setIndex: number, value: string) => {
    const val = parseInt(value, 10);
    const updated = [...session.ejercicios];
    const ej = updated[session.currentExerciseIndex];
    ej.series[setIndex].repeticiones = isNaN(val) ? 1 : Math.max(1, val);
    updateSessionState({ ...session, ejercicios: updated });
  };

  const handleToggleSetComplete = (setIndex: number) => {
    const updated = [...session.ejercicios];
    const ej = updated[session.currentExerciseIndex];
    const isNowComplete = !ej.series[setIndex].completada;

    if (isNowComplete) {
      const isBW = isPesoCorporalExercise(ej.nombre, ej.descripcionTecnica);
      if (!isBW && ej.series[setIndex].peso <= 0) {
        alert('No se permite guardar 0 kg salvo en ejercicios marcados como peso corporal.');
        return;
      }
    }

    ej.series[setIndex].completada = isNowComplete;

    updateSessionState({ ...session, ejercicios: updated });

    if (isNowComplete) {
      // Guardar en backend de inmediato
      saveSetMutation.mutate({ ejercicio: ej, setIndex });
      // Iniciar temporizador de descanso
      setShowRestTimer(true);
      setRestTimerSeconds(90);
    }
  };

  const handleAddSet = () => {
    const updated = [...session.ejercicios];
    const ej = updated[session.currentExerciseIndex];
    const lastSet = ej.series[ej.series.length - 1];
    const newSet: WorkoutSet = {
      numero: ej.series.length + 1,
      peso: lastSet ? lastSet.peso : 20,
      repeticiones: lastSet ? lastSet.repeticiones : 10,
      completada: false,
    };
    ej.series.push(newSet);
    updateSessionState({ ...session, ejercicios: updated });
  };

  const handleSkipExercise = () => {
    const updated = [...session.ejercicios];
    updated[session.currentExerciseIndex].saltado = true;
    updateSessionState({ ...session, ejercicios: updated });
    handleNextExercise();
  };

  const handleToggleDolor = () => {
    const updated = [...session.ejercicios];
    const current = updated[session.currentExerciseIndex].dolor;
    updated[session.currentExerciseIndex].dolor = !current;
    updateSessionState({ ...session, ejercicios: updated });
  };

  const handleSetEsfuerzo = (esfuerzo: EsfuerzoSesion) => {
    const updated = [...session.ejercicios];
    updated[session.currentExerciseIndex].esfuerzo = esfuerzo;
    updateSessionState({ ...session, ejercicios: updated });
  };

  const handleNextExercise = () => {
    if (session.currentExerciseIndex < totalExercises - 1) {
      updateSessionState({
        ...session,
        currentExerciseIndex: session.currentExerciseIndex + 1,
      });
      setShowTechDesc(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinalizeWorkout();
    }
  };

  const handlePrevExercise = () => {
    if (session.currentExerciseIndex > 0) {
      updateSessionState({
        ...session,
        currentExerciseIndex: session.currentExerciseIndex - 1,
      });
      setShowTechDesc(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Finalizar sesión y solicitar análisis / sugerencia del motor
  const handleFinalizeWorkout = async () => {
    if (!activeUser) return;
    setIsLoadingSugerencia(true);
    setShowSummary(true);

    const updatedSession: WorkoutSessionState = {
      ...session,
      isFinished: true,
      completedAt: Date.now(),
    };
    updateSessionState(updatedSession);

    // Guardar resumen en localStorage para historial y consulta inmediata
    const currentCompletedSets = session.ejercicios.reduce(
      (acc, ej) => acc + ej.series.filter((s) => s.completada).length,
      0
    );
    const currentPlannedSets = session.ejercicios.reduce((acc, ej) => acc + ej.series.length, 0);
    const currentVol = session.ejercicios.reduce((total, ej) => {
      const ejVolume = ej.series
        .filter((s) => s.completada)
        .reduce((sTotal, s) => sTotal + s.peso * s.repeticiones, 0);
      return total + ejVolume;
    }, 0);

    saveCompletedSession({
      rutinaId,
      rutinaNombre: session.rutinaNombre,
      usuarioId: activeUser.id,
      fecha: session.fecha,
      completedAt: Date.now(),
      duracionSegundos: elapsedSeconds,
      volumenTotalKg: currentVol,
      seriesCompletadas: currentCompletedSets,
      seriesPlaneadas: currentPlannedSets,
      esAdicional: session.esAdicional,
      ejercicios: session.ejercicios.map((e) => ({
        ejercicioId: e.ejercicioId,
        nombre: e.nombre,
        seriesCompletadas: e.series.filter((s) => s.completada).length,
        pesoMaximo: e.series.filter((s) => s.completada).reduce((max, s) => Math.max(max, s.peso), 0),
        repeticionesMaximas: e.series.filter((s) => s.completada).reduce((max, s) => Math.max(max, s.repeticiones), 0),
      })),
    });

    try {
      const feedbackPayload = {
        usuarioId: activeUser.id,
        rutinaId: rutinaId,
        esfuerzoGeneral: (session.ejercicios.find(e => e.esfuerzo)?.esfuerzo || 'JUSTO') as EsfuerzoSesion,
        sintioDolor: session.ejercicios.some((e) => e.dolor),
        ejercicios: session.ejercicios.map((e) => {
          const completedCount = e.series.filter((s) => s.completada).length;
          const maxPeso = e.series.filter((s) => s.completada).reduce((max, s) => Math.max(max, s.peso), 0);
          const avgReps = completedCount > 0
            ? Math.round(e.series.filter((s) => s.completada).reduce((acc, s) => acc + s.repeticiones, 0) / completedCount)
            : (e.series[0]?.repeticiones || 10);

          return {
            ejercicioId: e.ejercicioId,
            ejercicioNombre: e.nombre,
            seriesRealizadas: completedCount,
            repeticionesRealizadas: avgReps,
            pesoRealizado: maxPeso,
            saltado: e.saltado,
            esfuerzo: e.esfuerzo,
          };
        }),
      };

      const res = await rutinasApi.getSugerenciaSobrecarga(rutinaId, feedbackPayload);
      setSugerenciaMotor(res);
    } catch (err) {
      console.warn('No se pudo obtener sugerencia del motor:', err);
    } finally {
      setIsLoadingSugerencia(false);
    }
  };

  const handleFinishAndExit = () => {
    if (activeUser) {
      clearActiveSession(activeUser.id);
    }
    queryClient.invalidateQueries({ queryKey: ['progresos', activeUser?.id] });
    queryClient.invalidateQueries({ queryKey: ['rutinas', activeUser?.id] });
    navigate('/progreso');
  };

  const handleConfirmAbandon = () => {
    if (activeUser) {
      clearActiveSession(activeUser.id);
    }
    setAbandonModalOpen(false);
    navigate('/dashboard');
  };

  /* ─────────────── Cálculos para el resumen final ─────────────── */
  const completedSetsTotal = session.ejercicios.reduce(
    (acc, ej) => acc + ej.series.filter((s) => s.completada).length,
    0
  );
  const plannedSetsTotal = session.ejercicios.reduce((acc, ej) => acc + ej.series.length, 0);

  // Volumen total = suma de (peso * reps) de series completadas
  const totalVolumeKg = session.ejercicios.reduce((total, ej) => {
    const ejVolume = ej.series
      .filter((s) => s.completada)
      .reduce((sTotal, s) => sTotal + s.peso * s.repeticiones, 0);
    return total + ejVolume;
  }, 0);

  // Récords personales superados (PR)
  const personalRecordsBeaten: { ejercicio: string; nuevoPeso: number; anterior: number }[] = [];
  session.ejercicios.forEach((ej) => {
    const maxSessionWeight = ej.series.filter((s) => s.completada).reduce((max, s) => Math.max(max, s.peso), 0);
    if (maxSessionWeight > 0) {
      const historicalMax = userProgresos
        .filter((p) => {
          const matchCatalogo = ej.ejercicioCatalogoId && p.ejercicioCatalogoId === ej.ejercicioCatalogoId;
          const matchId = p.ejercicioId === ej.ejercicioId;
          const matchNombre = p.ejercicioNombre && ej.nombre && p.ejercicioNombre.toLowerCase() === ej.nombre.toLowerCase();
          return matchCatalogo || matchId || matchNombre;
        })
        .reduce((max, p) => Math.max(max, p.pesoRealizado || 0), 0);

      if (historicalMax > 0 && maxSessionWeight > historicalMax) {
        personalRecordsBeaten.push({
          ejercicio: ej.nombre,
          nuevoPeso: maxSessionWeight,
          anterior: historicalMax,
        });
      }
    }
  });

  // Comparación contra la última sesión completada de la misma rutina
  const prevCompletedSession = activeUser ? getPreviousCompletedSession(activeUser.id, rutinaId, session.fecha) : null;
  let previousSessionVolume: number | null = null;
  let previousSessionDateText = '';

  if (prevCompletedSession && prevCompletedSession.volumenTotalKg > 0) {
    previousSessionVolume = prevCompletedSession.volumenTotalKg;
    previousSessionDateText = prevCompletedSession.fecha;
  } else if (userProgresos.length > 0 && ejerciciosRutina.length > 0) {
    const routineCatIds = new Set<number>(
      ejerciciosRutina
        .map((e) => e.ejercicioCatalogoId || e.id)
        .filter((id): id is number => typeof id === 'number')
    );
    const priorRutinaProgresos = userProgresos.filter(
      (p) =>
        p.fecha < session.fecha &&
        ((p.ejercicioCatalogoId !== undefined && routineCatIds.has(p.ejercicioCatalogoId)) ||
          routineCatIds.has(p.ejercicioId))
    );
    if (priorRutinaProgresos.length > 0) {
      const dates = Array.from(new Set(priorRutinaProgresos.map((p) => p.fecha))).sort().reverse();
      const lastCompletedDate = dates[0];
      const itemsOnDate = priorRutinaProgresos.filter((p) => p.fecha === lastCompletedDate);
      const computedVol = itemsOnDate.reduce(
        (sum, p) => sum + (p.pesoRealizado || 0) * p.repeticionesRealizadas * p.seriesRealizadas,
        0
      );
      if (computedVol > 0) {
        previousSessionVolume = computedVol;
        previousSessionDateText = lastCompletedDate;
      }
    }
  }

  const volumeDiff = previousSessionVolume !== null ? Math.round(totalVolumeKg - previousSessionVolume) : null;
  const volumePct = previousSessionVolume && previousSessionVolume > 0
    ? (((totalVolumeKg - previousSessionVolume) / previousSessionVolume) * 100).toFixed(1)
    : null;

  // Análisis para la sugerencia del motor
  const targetExercise = session.ejercicios.find(
    (e) => sugerenciaMotor && e.ejercicioId === sugerenciaMotor.ejercicioId
  ) || session.ejercicios[0];

  const exerciseHistorial = userProgresos.filter((p) => {
    if (!targetExercise) return false;
    const matchCat = targetExercise.ejercicioCatalogoId && p.ejercicioCatalogoId === targetExercise.ejercicioCatalogoId;
    const matchId = p.ejercicioId === targetExercise.ejercicioId;
    const matchName = targetExercise.nombre && p.ejercicioNombre && p.ejercicioNombre.toLowerCase() === targetExercise.nombre.toLowerCase();
    return matchCat || matchId || matchName;
  });

  const uniquePastDates = Array.from(new Set(exerciseHistorial.map((p) => p.fecha)));
  const totalExerciseSessions = uniquePastDates.length + (uniquePastDates.includes(session.fecha) ? 0 : 1);

  const tieneDatosSuficientes = sugerenciaMotor?.tieneDatosSuficientes !== undefined
    ? sugerenciaMotor.tieneDatosSuficientes
    : totalExerciseSessions >= 2;

  const sesionesRestantes = sugerenciaMotor?.sesionesRestantes ?? Math.max(1, 2 - totalExerciseSessions);

  const targetSeries = targetExercise?.series.filter((s) => s.completada).length || targetExercise?.series.length || 4;
  const targetReps = targetExercise?.series[0]?.repeticiones || 10;
  const targetWeight = sugerenciaMotor?.pesoActual ?? (
    targetExercise?.series.reduce((max, s) => Math.max(max, s.peso), 0) || 20
  );
  const datosJustificacion = sugerenciaMotor?.datosJustificacion ||
    `${targetSeries}x${targetReps} con ${targetWeight} kg en tus últimas ${Math.min(totalExerciseSessions, 2)} sesiones`;

  /* ─────────────── VISTA: RESUMEN FINAL ─────────────── */
  if (showSummary) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 flex items-center justify-center mx-auto shadow-xl">
            <Trophy className="w-7 h-7 text-[var(--accent-primary)]" />
          </div>
          <h1 className="text-2xl font-bold font-space text-[var(--text-primary)] tracking-tight">
            ¡Entrenamiento completado!
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-inter">
            Rutina: <strong className="text-[var(--text-primary)]">{session.rutinaNombre}</strong>
          </p>
        </div>

        {/* Tarjetas métricas del resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] font-space block">
              Duración
            </span>
            <div className="text-xl font-bold font-space text-[var(--text-primary)] mt-1 flex items-center justify-center gap-1.5 tabular-nums">
              <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] font-space block">
              Volumen movido
            </span>
            <div className="text-xl font-bold font-space text-[var(--text-primary)] mt-1 flex items-center justify-center gap-1 tabular-nums">
              <span>{totalVolumeKg.toLocaleString()}</span>
              <span className="text-xs font-normal text-[var(--text-secondary)]">kg</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] font-space block">
              Series completadas
            </span>
            <div className="text-xl font-bold font-space text-[var(--text-primary)] mt-1 flex items-center justify-center gap-1 tabular-nums">
              <span className="text-[var(--accent-primary)]">{completedSetsTotal}</span>
              <span className="text-[var(--text-secondary)]">/</span>
              <span>{plannedSetsTotal}</span>
            </div>
          </div>
        </div>

        {/* Insignias de Récords Personales superados */}
        {personalRecordsBeaten.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Flame className="w-5 h-5 fill-current" />
              <h3 className="text-xs font-bold font-space uppercase tracking-wider">
                ¡Nuevos récords personales superados!
              </h3>
            </div>
            <div className="space-y-1.5">
              {personalRecordsBeaten.map((pr, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-inter">
                  <span className="text-[var(--text-primary)] font-medium">{pr.ejercicio}</span>
                  <span className="font-space font-bold text-amber-300">
                    {pr.nuevoPeso} kg <span className="text-[10px] text-amber-400/70 font-normal">(anterior: {pr.anterior} kg)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparación con la última sesión completada de la misma rutina */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-primary)]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold font-space text-[var(--text-primary)]">
                Comparativa de sobrecarga
              </p>
              {previousSessionVolume !== null ? (
                <p className="text-[11px] text-[var(--text-secondary)] font-inter">
                  Frente a la última sesión completada de esta rutina ({previousSessionDateText})
                </p>
              ) : (
                <p className="text-[11px] text-[var(--text-secondary)] font-inter">
                  Primera sesión de esta rutina: aún no hay con qué comparar
                </p>
              )}
            </div>
          </div>
          {previousSessionVolume !== null && volumeDiff !== null ? (
            <span
              className={`text-xs font-space font-bold ${
                volumeDiff >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {volumeDiff >= 0 ? `+${volumeDiff} kg (+${volumePct}%)` : `${volumeDiff} kg (${volumePct}%)`}
            </span>
          ) : (
            <span className="text-[10px] font-space text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2.5 py-1 rounded-full border border-[var(--border)]">
              Línea base registrada
            </span>
          )}
        </div>

        {/* Tarjeta de Sugerencia del Motor de IA (Acento Naranja) */}
        {isLoadingSugerencia ? (
          <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/30 text-center space-y-2">
            <Loader2 className="w-5 h-5 text-orange-400 animate-spin mx-auto" />
            <p className="text-xs text-orange-300 font-inter">
              El motor de IA está analizando tu tasa de esfuerzo para prescribir ajustes...
            </p>
          </div>
        ) : !tieneDatosSuficientes ? (
          /* Estado propio cuando no hay datos suficientes (< 2 sesiones) */
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 via-[var(--surface)] to-transparent border border-orange-500/30 shadow-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider font-space">
                    Sugerencia del Motor FitLite
                  </span>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] font-space">
                    Calibrando: {targetExercise?.nombre || 'Ejercicio principal'}
                  </h4>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-space bg-orange-500/15 text-orange-300 border border-orange-500/30">
                Fase de calibración
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0E121A] border border-orange-500/20 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)] font-space">
                  {sesionesRestantes === 1
                    ? 'Aún necesito 1 sesión más de este ejercicio para recomendarte'
                    : 'Aún necesito 2 sesiones más de este ejercicio para recomendarte'}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] font-inter mt-1 leading-relaxed">
                  El algoritmo de sobrecarga progresiva evalúa tu solvencia técnica y esfuerzo en sesiones consecutivas para prescribir incrementos seguros de kilaje.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Estado con datos suficientes (>= 2 sesiones) */
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 via-[var(--surface)] to-transparent border border-orange-500/40 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider font-space">
                    Sugerencia del Motor FitLite
                  </span>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] font-space">
                    Sobrecarga progresiva: {sugerenciaMotor?.ejercicioNombre || targetExercise?.nombre}
                  </h4>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-space bg-orange-500/20 text-orange-300 border border-orange-500/30">
                +2.5 kg
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-inter leading-relaxed">
              {sugerenciaMotor?.mensaje || 'El motor de IA detectó solvencia técnica y esfuerzo favorable.'}{' '}
              {sugerenciaMotor?.justificacion || 'Incrementar +2.5 kg en la próxima sesión para estimular la adaptación.'}
            </p>

            <div className="p-3.5 rounded-xl bg-[#0E121A] border border-orange-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-space">
                <span className="text-[var(--text-secondary)]">Carga objetivo actual:</span>
                <span className="text-[var(--text-primary)] font-semibold">
                  {sugerenciaMotor?.pesoActual ?? targetWeight} kg
                </span>
                <span className="text-orange-400 font-bold">
                  → {(sugerenciaMotor?.pesoPropuesto ?? (targetWeight + 2.5))} kg
                </span>
              </div>
              <div className="pt-2 border-t border-orange-500/15 flex items-center gap-1.5 text-[11px] text-orange-300 font-inter">
                <span className="font-semibold text-orange-400 font-space">Datos que la justifican:</span>
                <span className="tabular-nums font-medium">{datosJustificacion}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              {sugerenciaAplicada ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-inter">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Ajuste aplicado a tu rutina!</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSugerenciaMotor(null)}
                    className="px-4 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)] text-xs font-medium font-inter transition-colors cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sugerenciaMotor) {
                        aplicarSugerenciaMutation.mutate(sugerenciaMotor);
                      }
                    }}
                    disabled={aplicarSugerenciaMutation.isPending}
                    className="px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-[#0D1117] text-xs font-bold font-inter hover:brightness-110 active:scale-95 transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {aplicarSugerenciaMutation.isPending ? 'Aplicando...' : 'Aplicar sobrecarga'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción del resumen */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setAbandonModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 transition-colors font-inter cursor-pointer text-center"
          >
            Abandonar registro
          </button>
          <button
            type="button"
            onClick={handleFinishAndExit}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-bold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter cursor-pointer text-center shadow-lg shadow-[var(--accent-primary)]/20"
          >
            Finalizar sesión
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────── VISTA PRINCIPAL: MODO ENTRENAMIENTO ─────────────── */
  const completedCurrentExerciseSets = currentExercise.series.filter((s) => s.completada).length;

  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-6 space-y-4">
      {/* ─── CABECERA CON NOMBRE, CRONÓMETRO E INDICADOR ─── */}
      <header className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        {/* Barra superior de progreso de la rutina */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--border)]/40">
          <div
            className="h-full bg-[var(--accent-primary)] transition-all duration-300"
            style={{ width: `${((session.currentExerciseIndex + 1) / totalExercises) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 mt-1">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-primary)] font-space">
              Modo Entrenamiento
            </span>
            <h1 className="text-base sm:text-lg font-bold font-space text-[var(--text-primary)] truncate max-w-[220px] sm:max-w-xs">
              {session.rutinaNombre}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Cronómetro activo */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs font-space font-bold text-[var(--text-primary)] tabular-nums shadow-inner">
              <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-pulse" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>

            {/* Botón Salir / Abandonar */}
            <button
              type="button"
              onClick={() => setAbandonModalOpen(true)}
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 transition-colors"
              title="Abandonar sesión"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Indicador de Ejercicio X de Y */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]/60 text-xs text-[var(--text-secondary)] font-inter">
          <span className="font-space font-semibold text-[var(--text-primary)]">
            Ejercicio {session.currentExerciseIndex + 1} de {totalExercises}
          </span>
          <span className="text-[11px]">
            {completedCurrentExerciseSets} de {currentExercise.series.length} series completadas
          </span>
        </div>
      </header>

      {/* ─── TARJETA DEL EJERCICIO ACTIVO (UNO A LA VEZ) ─── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        {/* Cabecera del ejercicio */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold font-space text-[var(--text-primary)]">
                {currentExercise.nombre}
              </h2>
              {currentExercise.grupoMuscular && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 font-space">
                  {currentExercise.grupoMuscular}
                </span>
              )}
            </div>

            {/* Toggle descripción técnica colapsable */}
            {currentExercise.descripcionTecnica && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowTechDesc((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors font-inter cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showTechDesc ? 'Ocultar técnica' : 'Ver descripción técnica'}</span>
                  {showTechDesc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showTechDesc && (
                  <p className="mt-2 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] font-inter leading-relaxed animate-in fade-in duration-150">
                    {currentExercise.descripcionTecnica}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Botón Saltar Ejercicio */}
          <button
            type="button"
            onClick={handleSkipExercise}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-amber-400 hover:border-amber-400/40 transition-colors font-space shrink-0 active:scale-95 cursor-pointer"
            title="Saltar este ejercicio"
          >
            <SkipForward className="w-3 h-3" />
            <span className="hidden sm:inline">Saltar</span>
          </button>
        </div>

        {/* ─── TABLA DE SERIES INTERACTIVA ─── */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-[var(--text-secondary)] font-space px-2">
            <div className="col-span-2 text-center">SERIE</div>
            <div className="col-span-5 text-center">PESO (KG)</div>
            <div className="col-span-3 text-center">REPS</div>
            <div className="col-span-2 text-center">LISTO</div>
          </div>

          <div className="space-y-2">
            {currentExercise.series.map((set, setIdx) => (
              <div
                key={set.numero}
                className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                  set.completada
                    ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/40'
                    : 'bg-[var(--bg-primary)] border-[var(--border)] hover:border-[var(--border)]/80'
                }`}
              >
                {/* Número de Serie */}
                <div className="col-span-2 text-center">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-space text-xs font-bold mx-auto ${
                    set.completada
                      ? 'bg-[var(--accent-primary)] text-[#0D1117]'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                  }`}>
                    {set.numero}
                  </span>
                </div>

                {/* Peso con botones - / + (paso 2.5 kg) y touch targets >= 44px */}
                <div className="col-span-5 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateWeight(setIdx, -2.5)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-base font-bold text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-primary)]/50 active:scale-95 transition-all select-none cursor-pointer"
                    title="Restar 2.5 kg"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    value={set.peso}
                    onChange={(e) => handleUpdateWeightInput(setIdx, e.target.value)}
                    className="w-16 h-10 px-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-center font-space text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateWeight(setIdx, 2.5)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-base font-bold text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-primary)]/50 active:scale-95 transition-all select-none cursor-pointer"
                    title="Sumar 2.5 kg"
                  >
                    +
                  </button>
                </div>

                {/* Reps con botones - / + (paso 1 rep) y touch targets >= 44px */}
                <div className="col-span-3 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateReps(setIdx, -1)}
                    className="min-w-[40px] min-h-[44px] flex items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-bold text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-primary)]/50 active:scale-95 transition-all select-none cursor-pointer"
                    title="Restar 1 rep"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={set.repeticiones}
                    onChange={(e) => handleUpdateRepsInput(setIdx, e.target.value)}
                    className="w-12 h-10 px-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-center font-space text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateReps(setIdx, 1)}
                    className="min-w-[40px] min-h-[44px] flex items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-bold text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-primary)]/50 active:scale-95 transition-all select-none cursor-pointer"
                    title="Sumar 1 rep"
                  >
                    +
                  </button>
                </div>

                {/* Casilla de completada con touch target >= 44px */}
                <div className="col-span-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleToggleSetComplete(setIdx)}
                    className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                      set.completada
                        ? 'bg-[var(--accent-primary)] text-[#0D1117] border-[var(--accent-primary)] shadow-md shadow-[var(--accent-primary)]/30'
                        : 'bg-[var(--surface)] text-transparent border-[var(--border)] hover:border-[var(--accent-primary)]/50'
                    }`}
                    title={set.completada ? 'Marcar como incompleta' : 'Marcar como completada'}
                  >
                    <Check className={`w-5 h-5 stroke-[3] ${set.completada ? 'opacity-100 scale-100' : 'opacity-0 scale-75'} transition-all`} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Botón Agregar Serie */}
          <button
            type="button"
            onClick={handleAddSet}
            className="w-full py-2.5 rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--accent-primary)]/50 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] text-xs font-semibold font-space flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar serie</span>
          </button>
        </div>

        {/* ─── CONTROLES DEL EJERCICIO: DOLOR & ESFUERZO ─── */}
        <div className="pt-3 border-t border-[var(--border)] space-y-3.5">
          {/* Interruptor 'Sentí dolor' */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${currentExercise.dolor ? 'text-amber-400' : 'text-[var(--text-secondary)]'}`} />
              <span className="text-xs font-semibold text-[var(--text-primary)] font-space">
                Sentí dolor / molestia
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleDolor}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                currentExercise.dolor ? 'bg-amber-400' : 'bg-[var(--surface)] border border-[var(--border)]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-[#0D1117] absolute top-1 transition-transform ${
                currentExercise.dolor ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Aviso médico si se reportó dolor */}
          {currentExercise.dolor && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-inter flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Si el dolor continúa, consulta a un profesional. FitLite no da consejo médico.
              </p>
            </div>
          )}

          {/* Selector de tres opciones de esfuerzo: Fácil / Justo / Duro */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] font-space mb-2">
              Percepción de esfuerzo del ejercicio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: 'FACIL', label: 'Fácil', sub: 'RPE 6-7' },
                  { key: 'JUSTO', label: 'Justo', sub: 'RPE 8-9' },
                  { key: 'DURO', label: 'Duro', sub: 'RPE 10' },
                ] as const
              ).map((opt) => {
                const isSelected = currentExercise.esfuerzo === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSetEsfuerzo(opt.key)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? opt.key === 'FACIL'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                          : opt.key === 'JUSTO'
                          ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                          : 'bg-rose-500/15 border-rose-500/50 text-rose-300 font-bold'
                        : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-space">{opt.label}</span>
                    <span className="block text-[9px] text-[var(--text-secondary)] font-inter">{opt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── BOTONES DE NAVEGACIÓN ENTRE EJERCICIOS ─── */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevExercise}
            disabled={session.currentExerciseIndex === 0}
            className="px-4 py-2.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-inter cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <button
            type="button"
            onClick={handleNextExercise}
            className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-bold tracking-wide hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 font-inter cursor-pointer shadow-md shadow-[var(--accent-primary)]/20"
          >
            <span>{session.currentExerciseIndex === totalExercises - 1 ? 'Terminar sesión' : 'Siguiente ejercicio'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Temporizador de descanso flotante */}
      {showRestTimer && (
        <RestTimer
          initialSeconds={restTimerSeconds}
          onClose={() => setShowRestTimer(false)}
        />
      )}

      {/* Modal de confirmación para abandonar */}
      <Modal
        isOpen={abandonModalOpen}
        onClose={() => setAbandonModalOpen(false)}
        title="¿Abandonar entrenamiento?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)] font-inter">
            Las series que ya marcaste como completadas han quedado registradas en tu historial. Si abandonas ahora, se cerrará la sesión activa.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setAbandonModalOpen(false)}
              className="px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 transition-colors font-inter"
            >
              Continuar entrenando
            </button>
            <button
              type="button"
              onClick={handleConfirmAbandon}
              className="px-5 py-2 rounded-full bg-[var(--accent-error)] text-white text-xs font-semibold hover:brightness-110 transition-colors font-inter cursor-pointer"
            >
              Abandonar sesión
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
