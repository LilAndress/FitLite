import React from 'react';
import type { ObjetivoFisico, RolUsuario } from '../types';

interface BadgeProps {
  type: 'objetivo' | 'rol' | 'status' | 'ai' | 'error';
  value?: ObjetivoFisico | RolUsuario | boolean | string;
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, label }) => {
  if (type === 'ai') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/30 font-space tracking-tight">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-secondary)]" />
        {label || 'Motor IA'}
      </span>
    );
  }

  if (type === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-error)]/10 text-[var(--accent-error)] border border-[var(--accent-error)]/30 font-space tracking-tight">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-error)]" />
        {label || 'Estancamiento'}
      </span>
    );
  }

  if (type === 'status') {
    const isActive = Boolean(value);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border font-space tracking-tight ${
          isActive
            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/40'
            : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isActive ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-secondary)]'
          }`}
        />
        {isActive ? 'Activa' : 'Inactiva'}
      </span>
    );
  }

  if (type === 'objetivo') {
    const labels: Record<string, string> = {
      PERDER_PESO: 'Perder peso',
      GANAR_MASA: 'Ganar masa',
      MANTENER: 'Mantenimiento',
      RESISTENCIA: 'Resistencia',
    };
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] font-inter">
        {labels[String(value)] || String(value)}
      </span>
    );
  }

  // Rol
  const rolLabels: Record<string, string> = {
    USUARIO: 'Atleta',
    ENTRENADOR: 'Entrenador',
    ADMIN: 'Admin',
  };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface)] text-[var(--accent-primary)] border border-[var(--border)] font-space">
      {rolLabels[String(value)] || String(value)}
    </span>
  );
};
