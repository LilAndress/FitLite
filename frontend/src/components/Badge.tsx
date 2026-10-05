import React from 'react';
import type { ObjetivoFisico, RolUsuario } from '../types';

interface BadgeProps {
  type: 'objetivo' | 'rol' | 'status';
  value: ObjetivoFisico | RolUsuario | boolean | string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  if (type === 'status') {
    const isActive = Boolean(value);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          isActive
            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
            : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
          }`}
        />
        {isActive ? 'Activa' : 'Inactiva'}
      </span>
    );
  }

  if (type === 'objetivo') {
    const labels: Record<string, { text: string; bg: string; textCol: string }> = {
      PERDER_PESO: { text: 'Perder Peso', bg: 'bg-amber-950/60', textCol: 'text-amber-400 border-amber-500/30' },
      GANAR_MASA: { text: 'Ganar Masa', bg: 'bg-emerald-950/60', textCol: 'text-emerald-400 border-emerald-500/30' },
      MANTENER: { text: 'Mantener', bg: 'bg-blue-950/60', textCol: 'text-blue-400 border-blue-500/30' },
      RESISTENCIA: { text: 'Resistencia', bg: 'bg-purple-950/60', textCol: 'text-purple-400 border-purple-500/30' },
    };
    const config = labels[String(value)] || { text: String(value), bg: 'bg-slate-800', textCol: 'text-slate-300 border-slate-700' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.textCol}`}>
        {config.text}
      </span>
    );
  }

  // Rol
  const rolLabels: Record<string, { text: string; bg: string; textCol: string }> = {
    ADMIN: { text: 'Admin', bg: 'bg-rose-950/60', textCol: 'text-rose-400 border-rose-500/30' },
    ENTRENADOR: { text: 'Entrenador', bg: 'bg-indigo-950/60', textCol: 'text-indigo-400 border-indigo-500/30' },
    USUARIO: { text: 'Usuario', bg: 'bg-cyan-950/60', textCol: 'text-cyan-400 border-cyan-500/30' },
  };
  const rolConfig = rolLabels[String(value)] || { text: String(value), bg: 'bg-slate-800', textCol: 'text-slate-300 border-slate-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold tracking-wide border uppercase ${rolConfig.bg} ${rolConfig.textCol}`}>
      {rolConfig.text}
    </span>
  );
};
