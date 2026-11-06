import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Flame, AlertCircle, Check, Eye, RotateCcw } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { rutinasApi } from '../api/rutinas.api';
import { progresosApi } from '../api/progresos.api';
import {
  getActiveSession,
  clearActiveSession,
  isRoutineCompletedToday,
  getCompletedSessionToday,
} from '../lib/workoutSessionStorage';
import { StartWorkoutSelectorModal } from './StartWorkoutSelectorModal';
import { Modal } from './Modal';
import type { Rutina, CompletedSessionSummary } from '../types';

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

  // Estados para resumen y confirmación de sesión adicional
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [confirmAdicionalOpen, setConfirmAdicionalOpen] = useState(false);
  const [routineForAdicional, setRoutineForAdicional] = useState<Rutina | null>(null);

  // Consulta de rutinas activas del usuario
  const { data: rutinasActivas = [] } = useQuery({
    queryKey: ['rutinasActivas', activeUser?.id],
    queryFn: () => (activeUser ? rutinasApi.getActivasByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  // Consulta de progresos del usuario para verificar completitud hoy
  const { data: userProgresos = [] } = useQuery({
    queryKey: ['progresos', activeUser?.id],
    queryFn: () => (activeUser ? progresosApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  const activeSession = activeUser ? getActiveSession(activeUser.id) : null;
  const hasOngoingSession = Boolean(activeSession && !activeSession.isFinished);

  // Si se provee una rutina específica
  const isThisRoutineActiveSession =
    hasOngoingSession && specificRoutine && activeSession?.rutinaId === specificRoutine.id;

  // Determinar si la rutina objetivo está completada hoy
  const targetRoutineForCompletion = specificRoutine || (rutinasActivas.length === 1 ? rutinasActivas[0] : null);
  const isTargetCompletedToday = Boolean(
    !hasOngoingSession &&
      targetRoutineForCompletion &&
      activeUser &&
      isRoutineCompletedToday(activeUser.id, targetRoutineForCompletion.id, userProgresos)
  );

  const todaySummary: CompletedSessionSummary | null =
    activeUser && targetRoutineForCompletion
      ? getCompletedSessionToday(activeUser.id, targetRoutineForCompletion.id)
      : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Caso 1: Hay sesión en curso y el botón es general o es la rutina activa
    if (hasOngoingSession && (!specificRoutine || isThisRoutineActiveSession)) {
      navigate(`/sesion/${activeSession?.rutinaId}`);
      return;
    }

    // Caso 2: Hay sesión en curso pero se hizo clic en otra rutina específica
    if (hasOngoingSession && specificRoutine && activeSession?.rutinaId !== specificRoutine.id) {
      setPendingRoutine(specificRoutine);
      setConflictModalOpen(true);
      return;
    }

    // Caso 3: Rutina específica
    if (specificRoutine) {
      navigate(`/sesion/${specificRoutine.id}`);
      return;
    }

    // Caso 4: Botón general sin sesión en curso
    if (rutinasActivas.length === 1) {
      if (isTargetCompletedToday) {
        setRoutineForAdicional(rutinasActivas[0]);
        setConfirmAdicionalOpen(true);
      } else {
        navigate(`/sesion/${rutinasActivas[0].id}`);
      }
    } else {
      setIsSelectorOpen(true);
    }
  };

  const handleSelectFromModal = (rutina: Rutina) => {
    const isCompleted = activeUser
      ? isRoutineCompletedToday(activeUser.id, rutina.id, userProgresos)
      : false;

    if (isCompleted) {
      setRoutineForAdicional(rutina);
      setConfirmAdicionalOpen(true);
    } else {
      navigate(`/sesion/${rutina.id}`);
    }
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

  const handleStartAdicional = () => {
    const target = routineForAdicional || specificRoutine || (rutinasActivas.length === 1 ? rutinasActivas[0] : null);
    setConfirmAdicionalOpen(false);
    if (target) {
      navigate(`/sesion/${target.id}?adicional=true`);
    }
  };

  // Texto del botón cuando no está completada
  const isContinue = hasOngoingSession && (!specificRoutine || isThisRoutineActiveSession);
  const defaultLabel = isContinue ? 'Continuar sesión' : 'Empezar rutina';
  const label = labelOverride || defaultLabel;

  // Si está completada hoy y no hay sesión en curso para otra rutina
  if (isTargetCompletedToday && targetRoutineForCompletion) {
    if (variant === 'card') {
      return (
        <>
          <div className={`flex items-center gap-1.5 shrink-0 sm:flex-nowrap flex-wrap ${className}`}>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold font-space shrink-0">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>Completada hoy</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSummaryModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)] text-xs font-semibold font-inter transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
            >
              <Eye className="w-3 h-3" />
              <span>Ver resumen</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRoutineForAdicional(targetRoutineForCompletion);
                setConfirmAdicionalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)] hover:text-[#0D1117] text-xs font-semibold font-inter transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Registrar otra vez</span>
            </button>
          </div>

          <SummaryModal
            isOpen={summaryModalOpen}
            onClose={() => setSummaryModalOpen(false)}
            rutina={targetRoutineForCompletion}
            summary={todaySummary}
          />

          <ConfirmAdicionalModal
            isOpen={confirmAdicionalOpen}
            onClose={() => setConfirmAdicionalOpen(false)}
            onConfirm={handleStartAdicional}
            rutina={routineForAdicional || targetRoutineForCompletion}
          />
        </>
      );
    }

    // Variante primary / default
    return (
      <>
        <div className={`flex items-center gap-2 flex-wrap ${className}`}>
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold font-space">
            <Check className="w-4 h-4" strokeWidth={2.5} />
            <span>Completada hoy</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSummaryModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)] text-xs font-semibold font-inter transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver resumen</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRoutineForAdicional(targetRoutineForCompletion);
              setConfirmAdicionalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold hover:brightness-105 active:scale-95 transition-all font-inter cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Registrar otra vez</span>
          </button>
        </div>

        <SummaryModal
          isOpen={summaryModalOpen}
          onClose={() => setSummaryModalOpen(false)}
          rutina={targetRoutineForCompletion}
          summary={todaySummary}
        />

        <ConfirmAdicionalModal
          isOpen={confirmAdicionalOpen}
          onClose={() => setConfirmAdicionalOpen(false)}
          onConfirm={handleStartAdicional}
          rutina={routineForAdicional || targetRoutineForCompletion}
        />
      </>
    );
  }

  // Estilos según variante (normal o continuar sesión)
  let styleClasses = '';
  if (variant === 'primary') {
    styleClasses = isContinue
      ? 'inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-[var(--accent-secondary)] text-[#0D1117] font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all font-inter cursor-pointer'
      : 'inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter cursor-pointer';
  } else if (variant === 'card') {
    styleClasses = isContinue
      ? 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-400 hover:bg-amber-400 hover:text-[#0D1117] text-xs font-semibold font-space active:scale-95 transition-all cursor-pointer shrink-0'
      : 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[#0D1117] text-xs font-semibold font-space active:scale-95 transition-all cursor-pointer shrink-0';
  } else {
    styleClasses =
      'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 text-xs font-medium active:scale-95 transition-all font-inter cursor-pointer';
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
        userProgresos={userProgresos}
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
                Actualmente tienes activa la sesión de{' '}
                <strong className="text-[var(--text-primary)]">"{activeSession?.rutinaNombre}"</strong>.
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] font-inter">
            ¿Deseas descartar esa sesión para empezar{' '}
            <strong className="text-[var(--text-primary)]">"{pendingRoutine?.nombre}"</strong> o prefieres continuar con
            la actual?
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

      {/* Modal de confirmación para Registrar otra vez */}
      <ConfirmAdicionalModal
        isOpen={confirmAdicionalOpen}
        onClose={() => setConfirmAdicionalOpen(false)}
        onConfirm={handleStartAdicional}
        rutina={routineForAdicional || specificRoutine}
      />
    </>
  );
};

/* ─────────────── Modal: Confirmación Sesión Adicional ─────────────── */
interface ConfirmAdicionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rutina?: Rutina | null;
}

const ConfirmAdicionalModal: React.FC<ConfirmAdicionalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  rutina,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar otra vez"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-inter flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-semibold text-sm font-space text-[var(--text-primary)]">
              Sesión adicional de {rutina?.nombre || 'esta rutina'}
            </p>
            <p className="mt-2 text-xs text-[var(--text-primary)] leading-relaxed font-inter">
              Esta sesión se guardará como adicional y no se usará para tus recomendaciones ni tu adherencia.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 transition-all font-inter cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold hover:brightness-105 transition-all font-inter cursor-pointer"
          >
            Confirmar e iniciar
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ─────────────── Modal: Ver Resumen de Sesión de Hoy ─────────────── */
interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rutina: Rutina;
  summary: CompletedSessionSummary | null;
}

const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  rutina,
  summary,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Resumen de hoy · ${rutina.nombre}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] text-[var(--text-secondary)] font-space block">Volumen</span>
            <span className="text-base font-bold font-space text-[var(--accent-primary)] tabular-nums">
              {summary?.volumenTotalKg ? summary.volumenTotalKg.toLocaleString() : 0} kg
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-secondary)] font-space block">Series</span>
            <span className="text-base font-bold font-space text-[var(--text-primary)] tabular-nums">
              {summary?.seriesCompletadas || 'Completada'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-secondary)] font-space block">Duración</span>
            <span className="text-base font-bold font-space text-[var(--text-primary)] tabular-nums">
              {summary?.duracionSegundos
                ? `${Math.floor(summary.duracionSegundos / 60)} min`
                : 'Hoy'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[var(--text-secondary)] font-space uppercase tracking-wider">
            Detalle de ejercicios
          </h4>
          {summary?.ejercicios && summary.ejercicios.length > 0 ? (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {summary.ejercicios.map((ej, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-[var(--text-primary)] font-space truncate">{ej.nombre}</span>
                  <div className="flex items-center gap-3 shrink-0 text-xs font-space">
                    <span className="text-[var(--text-secondary)]">{ej.seriesCompletadas} series</span>
                    <span className="font-bold text-[var(--accent-primary)]">{ej.pesoMaximo} kg</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-secondary)] font-inter py-3 text-center">
              Sesión completada y registrada el día de hoy.
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 transition-all font-inter cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};
