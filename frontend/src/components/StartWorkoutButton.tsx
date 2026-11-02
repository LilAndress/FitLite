import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Flame, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { rutinasApi } from '../api/rutinas.api';
import { getActiveSession, clearActiveSession } from '../lib/workoutSessionStorage';
import { StartWorkoutSelectorModal } from './StartWorkoutSelectorModal';
import { Modal } from './Modal';
import type { Rutina } from '../types';

interface StartWorkoutButtonProps {
  variant?: 'primary' | 'card' | 'outline';
  specificRoutine?: Rutina;
  className?: string;
  labelOverride?: string;
}

export const StartWorkoutButton: React.FC<StartWorkoutButtonProps> = ({
  variant = 'primary',
  specificRoutine,
  className = '',
  labelOverride,
}) => {
  const { activeUser } = useUser();
  const navigate = useNavigate();

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [pendingRoutine, setPendingRoutine] = useState<Rutina | null>(null);

  // Consulta de rutinas activas del usuario
  const { data: rutinasActivas = [] } = useQuery({
    queryKey: ['rutinasActivas', activeUser?.id],
    queryFn: () => (activeUser ? rutinasApi.getActivasByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  const activeSession = activeUser ? getActiveSession(activeUser.id) : null;
  const hasOngoingSession = Boolean(activeSession && !activeSession.isFinished);

  // Si se provee una rutina específica (ej. en una tarjeta de rutina)
  const isThisRoutineActiveSession = hasOngoingSession && specificRoutine && activeSession?.rutinaId === specificRoutine.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Caso 1: Hay una sesión en curso y el botón es general (dashboard/progreso)
    // O es la tarjeta de esa misma rutina
    if (hasOngoingSession && (!specificRoutine || isThisRoutineActiveSession)) {
      navigate(`/sesion/${activeSession?.rutinaId}`);
      return;
    }

    // Caso 2: Hay una sesión en curso pero el usuario hizo clic en OTRA rutina específica
    if (hasOngoingSession && specificRoutine && activeSession?.rutinaId !== specificRoutine.id) {
      setPendingRoutine(specificRoutine);
      setConflictModalOpen(true);
      return;
    }

    // Caso 3: No hay sesión en curso
    if (specificRoutine) {
      navigate(`/sesion/${specificRoutine.id}`);
      return;
    }

    // Caso 4: Botón general sin sesión en curso
    if (rutinasActivas.length === 1) {
      navigate(`/sesion/${rutinasActivas[0].id}`);
    } else {
      setIsSelectorOpen(true);
    }
  };

  const handleSelectFromModal = (rutina: Rutina) => {
    navigate(`/sesion/${rutina.id}`);
  };

  const handleConfirmAbandonAndStart = () => {
    if (activeUser) {
      clearActiveSession(activeUser.id);
    }
    setConflictModalOpen(false);
    if (pendingRoutine) {
      navigate(`/sesion/${pendingRoutine.id}`);
    }
  };

  // Texto del botón
  const isContinue = hasOngoingSession && (!specificRoutine || isThisRoutineActiveSession);
  const defaultLabel = isContinue ? 'Continuar sesión' : 'Empezar rutina';
  const label = labelOverride || defaultLabel;

  // Estilos según variante
  let styleClasses = '';
  if (variant === 'primary') {
    styleClasses = isContinue
      ? 'inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-[var(--accent-secondary)] text-[#0D1117] font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all font-inter cursor-pointer'
      : 'inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter cursor-pointer';
  } else if (variant === 'card') {
    styleClasses = isContinue
      ? 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-400 hover:bg-amber-400 hover:text-[#0D1117] text-xs font-semibold font-space active:scale-95 transition-all cursor-pointer'
      : 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[#0D1117] text-xs font-semibold font-space active:scale-95 transition-all cursor-pointer';
  } else {
    styleClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 text-xs font-medium active:scale-95 transition-all font-inter cursor-pointer';
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${styleClasses} ${className}`}
      >
        {isContinue ? (
          <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-amber-300" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current" />
        )}
        <span>{label}</span>
      </button>

      {/* Selector modal para múltiples rutinas activas */}
      <StartWorkoutSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        rutinasActivas={rutinasActivas}
        onSelectRoutine={handleSelectFromModal}
      />

      {/* Modal de confirmación si ya hay otra rutina en curso */}
      <Modal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title="Sesión en curso detectada"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-inter flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold text-sm font-space text-[var(--text-primary)]">
                Ya tienes una sesión en curso
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                Actualmente tienes activa la sesión de <strong className="text-[var(--text-primary)]">"{activeSession?.rutinaNombre}"</strong>.
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] font-inter">
            ¿Deseas descartar esa sesión para empezar <strong className="text-[var(--text-primary)]">"{pendingRoutine?.nombre}"</strong> o prefieres continuar con la actual?
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setConflictModalOpen(false);
                if (activeSession) {
                  navigate(`/sesion/${activeSession.rutinaId}`);
                }
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 transition-all font-inter"
            >
              Continuar sesión actual
            </button>
            <button
              type="button"
              onClick={handleConfirmAbandonAndStart}
              className="w-full sm:w-auto px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold hover:brightness-105 transition-all font-inter"
            >
              Iniciar nueva rutina
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
