import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Play, Sparkles, ChevronRight, AlertCircle, Plus, Check } from 'lucide-react';
import { Modal } from './Modal';
import { useUser } from '../context/UserContext';
import { isRoutineCompletedToday } from '../lib/workoutSessionStorage';
import type { Rutina, Progreso } from '../types';

interface StartWorkoutSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rutinasActivas: Rutina[];
  onSelectRoutine: (rutina: Rutina) => void;
  userProgresos?: Progreso[];
}

export const StartWorkoutSelectorModal: React.FC<StartWorkoutSelectorModalProps> = ({
  isOpen,
  onClose,
  rutinasActivas,
  onSelectRoutine,
  userProgresos = [],
}) => {
  const navigate = useNavigate();
  const { activeUser } = useUser();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar rutina activa"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-xs text-[var(--text-secondary)] font-inter">
          Tienes varias rutinas activas. Elige cuál deseas entrenar en esta sesión:
        </p>

        {rutinasActivas.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)] space-y-3">
            <AlertCircle className="w-8 h-8 text-[var(--accent-secondary)] mx-auto" />
            <p className="text-xs text-[var(--text-secondary)] font-inter">
              No tienes ninguna rutina activa en este momento.
            </p>
            <button
              onClick={() => {
                onClose();
                navigate('/rutinas');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold hover:brightness-105 active:scale-95 transition-all font-inter"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ver mis rutinas</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {rutinasActivas.map((rutina) => {
              const isCompleted = activeUser
                ? isRoutineCompletedToday(activeUser.id, rutina.id, userProgresos)
                : false;

              return (
                <button
                  key={rutina.id}
                  type="button"
                  onClick={() => {
                    onSelectRoutine(rutina);
                    onClose();
                  }}
                  className={`w-full group p-4 rounded-xl border transition-all text-left flex items-center justify-between gap-3 active:scale-[0.98] cursor-pointer ${
                    isCompleted
                      ? 'bg-[var(--bg-primary)] border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-[var(--bg-primary)] border-[var(--border)] hover:border-[var(--accent-primary)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-[var(--surface)] border-[var(--border)] group-hover:border-[var(--accent-primary)]/40 text-[var(--accent-primary)]'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        <Dumbbell className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-[var(--text-primary)] font-space truncate group-hover:text-[var(--accent-primary)] transition-colors">
                          {rutina.nombre}
                        </h4>
                        {isCompleted && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-inter inline-flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            Completada hoy
                          </span>
                        )}
                        {rutina.generadaPorIa && !isCompleted && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/20 font-inter inline-flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            IA
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] font-inter truncate mt-0.5">
                        {rutina.descripcion || 'Rutina activa programada'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full transition-all font-space text-xs font-semibold ${
                      isCompleted
                        ? 'bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-[#0D1117]'
                        : 'bg-[var(--accent-primary)]/10 group-hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] group-hover:text-[#0D1117]'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span className="hidden sm:inline">
                      {isCompleted ? 'Registrar otra vez' : 'Iniciar'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
