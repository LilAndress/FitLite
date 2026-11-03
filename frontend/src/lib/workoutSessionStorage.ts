import type {
  Rutina,
  Ejercicio,
  Progreso,
  WorkoutSessionState,
  WorkoutExercise,
  WorkoutSet,
  CompletedSessionSummary,
} from '../types';
import { fechaLocalISO } from './dateUtils';

const STORAGE_KEY_PREFIX = 'fitlite_workout_session_';
const COMPLETED_SESSIONS_PREFIX = 'fitlite_completed_sessions_';

export const getWorkoutSessionStorageKey = (userId: number): string => {
  return `${STORAGE_KEY_PREFIX}${userId}`;
};

export const getCompletedSessionsStorageKey = (userId: number): string => {
  return `${COMPLETED_SESSIONS_PREFIX}${userId}`;
};

export const getActiveSession = (userId: number): WorkoutSessionState | null => {
  try {
    const raw = localStorage.getItem(getWorkoutSessionStorageKey(userId));
    if (!raw) return null;
    const session: WorkoutSessionState = JSON.parse(raw);
    if (!session || !session.rutinaId || !session.ejercicios || session.isFinished) {
      return null;
    }
    return session;
  } catch (err) {
    console.error('Error al recuperar sesión activa de localStorage:', err);
    return null;
  }
};

export const saveActiveSession = (session: WorkoutSessionState): void => {
  try {
    localStorage.setItem(getWorkoutSessionStorageKey(session.usuarioId), JSON.stringify(session));
  } catch (err) {
    console.error('Error al guardar sesión activa en localStorage:', err);
  }
};

export const clearActiveSession = (userId: number): void => {
  try {
    localStorage.removeItem(getWorkoutSessionStorageKey(userId));
  } catch (err) {
    console.error('Error al limpiar sesión activa de localStorage:', err);
  }
};

export const getCompletedSessions = (userId: number): CompletedSessionSummary[] => {
  try {
    const raw = localStorage.getItem(getCompletedSessionsStorageKey(userId));
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Error al recuperar sesiones completadas de localStorage:', err);
    return [];
  }
};

export const saveCompletedSession = (summary: CompletedSessionSummary): void => {
  try {
    const existing = getCompletedSessions(summary.usuarioId);
    // Filtrar si ya existía una sesión para este mismo momento o reemplazar/añadir
    const filtered = existing.filter(
      (s) => !(s.rutinaId === summary.rutinaId && s.fecha === summary.fecha && !summary.esAdicional && !s.esAdicional)
    );
    filtered.unshift(summary);
    localStorage.setItem(
      getCompletedSessionsStorageKey(summary.usuarioId),
      JSON.stringify(filtered.slice(0, 50)) // Guardar hasta 50 sesiones recientes
    );
  } catch (err) {
    console.error('Error al guardar sesión completada en localStorage:', err);
  }
};

export const getCompletedSessionToday = (
  userId: number,
  rutinaId: number
): CompletedSessionSummary | null => {
  const todayStr = fechaLocalISO();
  const sessions = getCompletedSessions(userId);
  return sessions.find((s) => s.rutinaId === rutinaId && s.fecha === todayStr) || null;
};

export const getPreviousCompletedSession = (
  userId: number,
  rutinaId: number,
  currentSessionFecha?: string
): CompletedSessionSummary | null => {
  const referenceDate = currentSessionFecha || fechaLocalISO();
  const sessions = getCompletedSessions(userId);
  return (
    sessions.find(
      (s) => s.rutinaId === rutinaId && s.fecha < referenceDate && (!s.esAdicional || s.volumenTotalKg > 0)
    ) || null
  );
};

export const isRoutineCompletedToday = (
  userId: number,
  rutinaId: number,
  userProgresos: Progreso[] = [],
  routineExerciseIds: number[] = []
): boolean => {
  const todayStr = fechaLocalISO();

  // 1. Revisar si hay sesión guardada en localStorage completada hoy
  const fromStorage = getCompletedSessionToday(userId, rutinaId);
  if (fromStorage) return true;

  // 2. Revisar si en los progresos del usuario hay registros de hoy para los ejercicios de esta rutina
  if (routineExerciseIds.length > 0 && userProgresos.length > 0) {
    const hasTodayProgress = userProgresos.some(
      (p) =>
        p.fecha === todayStr &&
        (routineExerciseIds.includes(p.ejercicioId) ||
          (p.ejercicioCatalogoId && routineExerciseIds.includes(p.ejercicioCatalogoId)))
    );
    if (hasTodayProgress) return true;
  }

  return false;
};

export const initWorkoutSession = (
  userId: number,
  rutina: Rutina,
  ejercicios: Ejercicio[],
  historicalProgresos: Progreso[] = [],
  isAdicional: boolean = false
): WorkoutSessionState => {
  const todayStr = fechaLocalISO();

  const workoutEjercicios: WorkoutExercise[] = ejercicios.map((ej) => {
    // Buscar historial más reciente para este ejercicio
    const historial = historicalProgresos.find((p) => {
      const matchCatalogo = ej.ejercicioCatalogoId && p.ejercicioCatalogoId === ej.ejercicioCatalogoId;
      const matchId = p.ejercicioId === ej.id;
      const matchNombre =
        p.ejercicioNombre && ej.nombre && p.ejercicioNombre.toLowerCase() === ej.nombre.toLowerCase();
      return matchCatalogo || matchId || matchNombre;
    });

    const targetSets = ej.seriesObjetivo > 0 ? ej.seriesObjetivo : 4;
    const defaultReps = historial?.repeticionesRealizadas || ej.repeticionesObjetivo || 10;
    const defaultWeight =
      historial?.pesoRealizado !== undefined && historial.pesoRealizado !== null
        ? historial.pesoRealizado
        : ej.pesoObjetivo !== undefined && ej.pesoObjetivo !== null
        ? ej.pesoObjetivo
        : 20;

    const sets: WorkoutSet[] = Array.from({ length: targetSets }).map((_, idx) => ({
      numero: idx + 1,
      peso: defaultWeight,
      repeticiones: defaultReps,
      completada: false,
    }));

    return {
      ejercicioId: ej.id,
      ejercicioCatalogoId: ej.ejercicioCatalogoId,
      nombre: ej.nombre,
      grupoMuscular: ej.grupoMuscular,
      descripcionTecnica: ej.descripcionTecnica,
      series: sets,
      dolor: false,
      esfuerzo: undefined,
      saltado: false,
    };
  });

  const session: WorkoutSessionState = {
    rutinaId: rutina.id,
    rutinaNombre: rutina.nombre,
    usuarioId: userId,
    fecha: todayStr,
    startedAt: Date.now(),
    currentExerciseIndex: 0,
    ejercicios: workoutEjercicios,
    isFinished: false,
    esAdicional: isAdicional,
  };

  saveActiveSession(session);
  return session;
};
