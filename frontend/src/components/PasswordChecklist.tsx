import React from 'react';
import { Check, Circle } from 'lucide-react';
import { checkPasswordRules, getPasswordStrength } from '../lib/passwordRules';

export interface PasswordChecklistProps {
  /** Valor actual de la contraseña */
  value: string;
  /** Si el campo de contraseña está enfocado actualmente */
  isFocused?: boolean;
  /** Forzar que el checklist se muestre siempre */
  showAlways?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({
  value,
  isFocused = false,
  showAlways = false,
  className = '',
}) => {
  const shouldShow = showAlways || isFocused || (value && value.length > 0);

  if (!shouldShow) {
    return null;
  }

  const evaluatedRules = checkPasswordRules(value);
  const strength = getPasswordStrength(value);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={`p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] transition-all duration-200 space-y-3 animate-in fade-in-50 duration-200 ${className}`}
    >
      {/* Barra de fortaleza de 4 segmentos */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-inter">
          <span className="text-[var(--text-secondary)]">Nivel de seguridad</span>
          <span
            className="font-semibold transition-colors duration-200 font-space"
            style={{ color: strength.color }}
          >
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1.5 h-1.5 w-full" role="progressbar" aria-valuenow={strength.score} aria-valuemin={0} aria-valuemax={4}>
          {[1, 2, 3, 4].map((seg) => {
            const isFilled = seg <= strength.score;
            return (
              <div
                key={seg}
                className="flex-1 h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  backgroundColor: isFilled ? strength.color : 'var(--border)',
                  opacity: isFilled ? 1 : 0.45,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Lista de reglas con íconos, texto y transiciones */}
      <ul className="space-y-1.5 text-xs font-inter">
        {evaluatedRules.map(({ rule, met }) => (
          <li
            key={rule.id}
            className={`flex items-center gap-2.5 transition-colors duration-200 ${
              met ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
            }`}
          >
            <span
              className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-200 transform ${
                met
                  ? 'scale-100 text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 ring-1 ring-[var(--accent-primary)]/30'
                  : 'scale-90 text-[var(--text-secondary)] opacity-70'
              }`}
              aria-hidden="true"
            >
              {met ? (
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              ) : (
                <Circle className="w-2 h-2 stroke-[2.5]" />
              )}
            </span>
            <span className="text-[11px] leading-tight">
              {rule.label}
            </span>
            <span className="sr-only">
              {met ? 'Requisito cumplido:' : 'Requisito no cumplido:'} {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
