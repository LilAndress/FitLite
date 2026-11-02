import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Scale, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { useUser } from '../context/UserContext';
import { pesosCorporalesApi } from '../api/pesos.api';
import type { PesoCorporal } from '../types';

interface PesoCorporalModalProps {
  isOpen: boolean;
  onClose: () => void;
  historialPesos: PesoCorporal[];
  editingPeso?: PesoCorporal | null;
  onSuccessSave?: (variacionTexto: string) => void;
}

export const PesoCorporalModal: React.FC<PesoCorporalModalProps> = ({
  isOpen,
  onClose,
  historialPesos,
  editingPeso,
  onSuccessSave,
}) => {
  const { activeUser, refreshUsers } = useUser();
  const queryClient = useQueryClient();

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [pesoVal, setPesoVal] = useState('');
  const [fechaVal, setFechaVal] = useState(getTodayStr());
  const [notasVal, setNotasVal] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [savedVariation, setSavedVariation] = useState<string | null>(null);

  // Último peso registrado antes de este
  const ultimoRegistro = historialPesos.length > 0 ? historialPesos[0] : null;
  const ultimoPesoNum = ultimoRegistro?.peso ?? activeUser?.pesoActual ?? null;

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setPendingConfirmation(false);
      setSavedVariation(null);

      if (editingPeso) {
        setPesoVal(String(editingPeso.peso));
        setFechaVal(editingPeso.fecha);
        setNotasVal(editingPeso.notas || '');
      } else {
        setPesoVal(ultimoPesoNum ? String(ultimoPesoNum) : '');
        setFechaVal(getTodayStr());
        setNotasVal('');
      }
    }
  }, [isOpen, editingPeso, ultimoPesoNum]);

  const registroExistente = historialPesos.find(
    (p) => p.fecha === fechaVal && (!editingPeso || p.id !== editingPeso.id)
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeUser) throw new Error('No user selected');
      const numPeso = parseFloat(pesoVal);

      if (editingPeso) {
        return pesosCorporalesApi.update(editingPeso.id, {
          peso: numPeso,
          fecha: fechaVal,
          usuarioId: activeUser.id,
          notas: notasVal.trim() || undefined,
        });
      } else if (registroExistente) {
        return pesosCorporalesApi.update(registroExistente.id, {
          peso: numPeso,
          fecha: fechaVal,
          usuarioId: activeUser.id,
          notas: notasVal.trim() || undefined,
        });
      } else {
        return pesosCorporalesApi.create({
          peso: numPeso,
          fecha: fechaVal,
          usuarioId: activeUser.id,
          notas: notasVal.trim() || undefined,
        });
      }
    },
    onSuccess: async (data) => {
      await refreshUsers();
      queryClient.invalidateQueries({ queryKey: ['pesosCorporales', activeUser?.id] });

      // Calcular variación respecto al registro anterior
      let varText = '';
      if (ultimoPesoNum !== null) {
        const diff = Number((data.peso - ultimoPesoNum).toFixed(1));
        if (diff > 0) {
          varText = `+${diff} kg respecto a tu registro anterior (${ultimoPesoNum} kg)`;
        } else if (diff < 0) {
          varText = `${diff} kg respecto a tu registro anterior (${ultimoPesoNum} kg)`;
        } else {
          varText = `Sin cambios respecto al registro anterior (${ultimoPesoNum} kg)`;
        }
      } else {
        varText = `Primer registro histórico: ${data.peso} kg`;
      }

      setSavedVariation(varText);
      if (onSuccessSave) {
        onSuccessSave(varText);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Error al guardar el pesaje corporal';
      setErrorMsg(msg);
      setPendingConfirmation(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const num = parseFloat(pesoVal);
    if (isNaN(num)) {
      setErrorMsg('Ingresa un número válido para el peso');
      return;
    }

    if (num < 30 || num > 300) {
      setErrorMsg('El peso corporal debe estar entre 30 kg y 300 kg');
      return;
    }

    // Comprobar diferencia > 3 kg con el último peso
    if (ultimoPesoNum !== null && !pendingConfirmation && Math.abs(num - ultimoPesoNum) > 3) {
      setPendingConfirmation(true);
      return;
    }

    saveMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPeso ? 'Editar pesaje corporal' : 'Registrar pesaje corporal'}
      maxWidth="max-w-md"
    >
      {savedVariation ? (
        <div className="py-6 text-center space-y-3 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold font-space text-[var(--text-primary)]">
            ¡Pesaje guardado exitosamente!
          </h4>
          <p className="text-xs font-semibold text-[var(--accent-primary)] font-space">
            {savedVariation}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tarjeta informativa de último peso */}
          {ultimoRegistro && !editingPeso && (
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-between text-xs font-inter">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Scale className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                <span>Último peso registrado:</span>
              </div>
              <span className="font-space font-bold text-[var(--text-primary)]">
                {ultimoRegistro.peso} kg <span className="text-[10px] text-[var(--text-secondary)] font-normal font-inter">({ultimoRegistro.fecha})</span>
              </span>
            </div>
          )}

          {registroExistente && !editingPeso && (
            <div className="p-2.5 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs font-inter flex items-center gap-2">
              <Scale className="w-3.5 h-3.5 shrink-0" />
              <span>Ya existe un pesaje para esta fecha ({registroExistente.peso} kg). Al guardar, se actualizará tu valor.</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[var(--accent-error)]/10 border border-[var(--accent-error)]/30 text-[var(--accent-error)] text-xs font-inter flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Banner de confirmación si la diferencia es mayor a 3 kg */}
          {pendingConfirmation && ultimoPesoNum !== null && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-inter space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold font-space text-[var(--text-primary)] text-xs">
                    ¿Es correcto este valor?
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                    La diferencia con tu último peso ({ultimoPesoNum} kg) es de{' '}
                    <strong className="text-amber-300 font-space font-bold">
                      {Math.abs(parseFloat(pesoVal) - ultimoPesoNum).toFixed(1)} kg
                    </strong>. ¿Deseas confirmar este registro?
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingConfirmation(false)}
                  className="px-3 py-1 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)] text-[11px] font-medium font-inter cursor-pointer"
                >
                  Revisar valor
                </button>
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="px-4 py-1 rounded-full bg-amber-400 text-[#0D1117] text-[11px] font-bold font-inter hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                >
                  {saveMutation.isPending ? 'Guardando...' : 'Sí, es correcto'}
                </button>
              </div>
            </div>
          )}

          {/* Campo de Peso Corporal (paso 0.1 kg, entre 30 y 300) */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Peso corporal (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={pesoVal}
              onChange={(e) => {
                setPesoVal(e.target.value);
                setPendingConfirmation(false);
              }}
              placeholder="Ej. 76.5"
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-space font-medium tabular-nums"
            />
            <p className="text-[10px] text-[var(--text-secondary)]/70 mt-1 font-inter">
              Rango válido: 30 a 300 kg (incrementos de 0.1 kg)
            </p>
          </div>

          {/* Campo de Fecha (por defecto hoy) */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Fecha de pesaje *
            </label>
            <input
              type="date"
              value={fechaVal}
              onChange={(e) => setFechaVal(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
          </div>

          {/* Campo de Notas (opcional) */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Notas u observaciones (Opcional)
            </label>
            <input
              type="text"
              value={notasVal}
              onChange={(e) => setNotasVal(e.target.value)}
              placeholder="Ej. En ayunas, tras descanso"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending || pendingConfirmation}
              className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter cursor-pointer"
            >
              {saveMutation.isPending
                ? 'Guardando...'
                : editingPeso
                ? 'Guardar cambios'
                : 'Registrar pesaje'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
