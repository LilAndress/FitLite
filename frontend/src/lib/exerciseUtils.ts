/**
 * Utilidades para ejercicios y pesos en FitLite.
 */

// Palabras clave que identifican ejercicios de autocarga / peso corporal
export const BODYWEIGHT_KEYWORDS = [
  'corporal',
  'autocarga',
  'calistenia',
  'bodyweight',
  'dominada',
  'dominadas',
  'flexion',
  'flexiones',
  'fondo',
  'fondos',
  'push-up',
  'push-ups',
  'pushup',
  'pushups',
  'chin-up',
  'chin-ups',
  'chinup',
  'chinups',
  'pull-up',
  'pull-ups',
  'pullup',
  'pullups',
  'plancha',
  'abdominal',
  'abdominales',
  'crunch',
  'elevacion de piernas',
  'elevación de piernas',
  'elevacion de pierna',
  'elevación de pierna',
  'escalador',
  'escaladores',
  'mountain climber',
  'mountain climbers',
  'burpee',
  'burpees',
  'vacio abdominal',
  'vacío abdominal',
  'salto a la comba',
  'jump rope',
  'puente de gluteo',
  'puente de glúteo',
  'hiperextensiones',
  'hiperextension',
];

/**
 * Determina si un ejercicio se considera de peso corporal (autocarga).
 * Se evalúa tanto el nombre como la descripción técnica o una bandera explícita.
 */
export const isPesoCorporalExercise = (
  nombre?: string | null,
  descripcion?: string | null,
  esExplicitamentePesoCorporal?: boolean | null
): boolean => {
  if (esExplicitamentePesoCorporal === true) return true;
  if (!nombre && !descripcion) return false;
  const target = `${nombre || ''} ${descripcion || ''}`.toLowerCase();
  return BODYWEIGHT_KEYWORDS.some((kw) => target.includes(kw));
};

