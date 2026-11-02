import { z } from 'zod';

export interface PasswordRule {
  id: string;
  label: string;
  errorMessage: string;
  validate: (password: string) => boolean;
}

/**
 * Single source of truth for password requirements:
 * 1. 8 a 64 caracteres
 * 2. Una mayúscula
 * 3. Una minúscula
 * 4. Un número
 * 5. Un símbolo
 * 6. Sin espacios
 */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: '8 a 64 caracteres',
    errorMessage: 'Debe tener entre 8 y 64 caracteres',
    validate: (pw: string) => pw.length >= 8 && pw.length <= 64,
  },
  {
    id: 'uppercase',
    label: 'Una mayúscula',
    errorMessage: 'Debe contener al menos una letra mayúscula',
    validate: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    id: 'lowercase',
    label: 'Una minúscula',
    errorMessage: 'Debe contener al menos una letra minúscula',
    validate: (pw: string) => /[a-z]/.test(pw),
  },
  {
    id: 'number',
    label: 'Un número',
    errorMessage: 'Debe contener al menos un número',
    validate: (pw: string) => /[0-9]/.test(pw),
  },
  {
    id: 'symbol',
    label: 'Un símbolo',
    errorMessage: 'Debe contener al menos un símbolo especial (!@#$%...)',
    validate: (pw: string) => /[^A-Za-z0-9\s]/.test(pw),
  },
  {
    id: 'no-spaces',
    label: 'Sin espacios',
    errorMessage: 'No puede contener espacios en blanco',
    validate: (pw: string) => pw.length > 0 && !/\s/.test(pw),
  },
];

/**
 * Zod schema constructed directly from the rules list to avoid duplicate rules.
 */
let builtSchema: z.ZodType<string> = z.string().min(1, 'La contraseña es obligatoria');
for (const rule of PASSWORD_RULES) {
  builtSchema = builtSchema.refine((val) => rule.validate(val), {
    message: rule.errorMessage,
  });
}
export const passwordSchema = builtSchema;

/**
 * Returns an array of rules with their boolean met/unmet state for the provided password.
 */
export function checkPasswordRules(password: string): { rule: PasswordRule; met: boolean }[] {
  return PASSWORD_RULES.map((rule) => ({
    rule,
    met: rule.validate(password || ''),
  }));
}

/**
 * Returns true only if all rules in PASSWORD_RULES are met.
 */
export function areAllPasswordRulesMet(password: string): boolean {
  if (!password) return false;
  return PASSWORD_RULES.every((rule) => rule.validate(password));
}

/**
 * Count of rules met.
 */
export function countRulesMet(password: string): number {
  if (!password) return 0;
  return PASSWORD_RULES.filter((rule) => rule.validate(password)).length;
}

export interface PasswordStrengthInfo {
  score: number; // 0 to 4 filled segments
  color: string;
  label: string;
}

/**
 * Calculates 4-segment strength bar filling and color:
 * - 0 rules met: 0 segments
 * - 1-2 rules met: 1 segment (rojo --accent-error)
 * - 3-4 rules met: 2 segments (naranja --accent-secondary)
 * - 5 rules met: 3 segments (naranja --accent-secondary)
 * - 6 rules met (all): 4 segments (lima --accent-primary)
 */
export function getPasswordStrength(password: string): PasswordStrengthInfo {
  const met = countRulesMet(password);
  if (met === 0) {
    return { score: 0, color: 'var(--border)', label: 'Muy débil' };
  }
  if (met <= 2) {
    return { score: 1, color: 'var(--accent-error)', label: 'Débil' };
  }
  if (met <= 4) {
    return { score: 2, color: 'var(--accent-secondary)', label: 'Media' };
  }
  if (met === 5) {
    return { score: 3, color: 'var(--accent-secondary)', label: 'Buena' };
  }
  return { score: 4, color: 'var(--accent-primary)', label: 'Fuerte' };
}
