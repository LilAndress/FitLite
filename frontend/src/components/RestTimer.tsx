import React, { useState, useEffect } from 'react';
import { Timer, X, Check, BellRing } from 'lucide-react';

interface RestTimerProps {
  initialSeconds?: number;
  onFinish?: () => void;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds = 90,
  onFinish,
  onClose,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customInput, setCustomInput] = useState(String(initialSeconds));

  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setSecondsLeft(initialSeconds);
    setIsPaused(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onFinish) onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, secondsLeft, onFinish]);

  const addSeconds = (amount: number) => {
    setSecondsLeft((prev) => Math.max(0, prev + amount));
    setTotalSeconds((prev) => Math.max(prev, prev + amount));
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val > 0) {
      setTotalSeconds(val);
      setSecondsLeft(val);
      setIsEditing(false);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPercent = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  const isFinished = secondsLeft === 0;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-50 bg-[#121620]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl p-4 transition-all duration-200 animate-in slide-in-from-bottom-5">
      {/* Barra de progreso sutil superior */}
      <div className="h-1 w-full bg-[var(--surface)] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isFinished
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-bounce'
              : 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
          }`}>
            {isFinished ? (
              <BellRing className="w-4 h-4 text-emerald-400" />
            ) : (
              <Timer className="w-4 h-4" />
            )}
          </div>

          <div>
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] font-space block">
              {isFinished ? '¡Tiempo completado!' : 'Descanso entre series'}
            </span>
            {isEditing ? (
              <form onSubmit={handleApplyCustom} className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="number"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="w-14 px-1.5 py-0.5 text-xs rounded bg-[var(--bg-primary)] border border-[var(--accent-primary)] text-center font-space"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1 rounded bg-[var(--accent-primary)] text-[#0D1117] hover:brightness-105"
                  title="Guardar segundos"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setCustomInput(String(secondsLeft));
                  setIsEditing(true);
                }}
                className="text-lg font-bold font-space text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors tabular-nums cursor-pointer text-left"
                title="Toca para editar duración"
              >
                {timeFormatted}
                <span className="text-[10px] text-[var(--text-secondary)] font-normal ml-1.5 font-inter">
                  (editar)
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Controles de ajuste rápido (+30s, -15s, Cerrar) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => addSeconds(-15)}
            className="px-2 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface)]/80 border border-[var(--border)] text-[11px] font-space font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-95"
            title="Restar 15 segundos"
          >
            -15s
          </button>
          <button
            type="button"
            onClick={() => addSeconds(30)}
            className="px-2 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface)]/80 border border-[var(--border)] text-[11px] font-space font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-95"
            title="Sumar 30 segundos"
          >
            +30s
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 transition-colors ml-1"
            title="Ocultar temporizador"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
