import type { Rutina, Ejercicio, Progreso, WorkoutSessionState, WorkoutExercise, WorkoutSet } from '../types';

const STORAGE_KEY_PREFIX = 'fitlite_workout_session_';

export const getWorkoutSessionStorageKey = (userId: number): string => {
  return `${STORAGE_KEY_PREFIX}${userId}`;
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

export const initWorkoutSession = (
  userId: number,
  rutina: Rutina,
  ejercicios: Ejercicio[],
  historicalProgresos: Progreso[] = []
): WorkoutSessionState => {
  const todayStr = new Date().toISOString().split('T')[0];

  const workoutEjercicios: WorkoutExercise[] = ejercicios.map((ej) => {
    // Buscar historial más reciente para este ejercicio
    const historial = historicalProgresos.find((p) => {
      const matchCatalogo = ej.ejercicioCatalogoId && p.ejercicioCatalogoId === ej.ejercicioCatalogoId;
      const matchId = p.ejercicioId === ej.id;
      const matchNombre = p.ejercicioNombre && ej.nombre && p.ejercicioNombre.toLowerCase() === ej.nombre.toLowerCase();
      return matchCatalogo || matchId || matchNombre;
    });

    const targetSets = ej.seriesObjetivo > 0 ? ej.seriesObjetivo : 4;
    const defaultReps = historial?.repeticionesRealizadas || ej.repeticionesObjetivo || 10;
    const defaultWeight = historial?.pesoRealizado !== undefined && historial.pesoRealizado !== null
      ? historial.pesoRealizado
      : (ej.pesoObjetivo !== undefined && ej.pesoObjetivo !== null ? ej.pesoObjetivo : 20);

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
  };

  saveActiveSession(session);
  return session;
};
