import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Calendar, 
  Dumbbell, 
  Trash2, 
  Power,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { rutinasApi } from '../api/rutinas.api';
import { ejerciciosApi } from '../api/ejercicios.api';
import type { Rutina } from '../types';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';

// Zod schemas
const rutinaSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  descripcion: z.string().optional(),
});

type RutinaFormValues = z.infer<typeof rutinaSchema>;

const ejercicioSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  seriesObjetivo: z.coerce.number().min(1, 'Mínimo 1 serie'),
  repeticionesObjetivo: z.coerce.number().min(1, 'Mínimo 1 repetición'),
  pesoObjetivo: z.coerce.number().min(0, 'El peso no puede ser negativo').optional(),
});

type EjercicioFormValues = z.infer<typeof ejercicioSchema>;

export const RutinasPage: React.FC = () => {
  const { activeUser } = useUser();
  const queryClient = useQueryClient();

  const [expandedRutinaId, setExpandedRutinaId] = useState<number | null>(null);
  const [isRutinaModalOpen, setIsRutinaModalOpen] = useState(false);
  const [selectedRutinaForEjercicio, setSelectedRutinaForEjercicio] = useState<Rutina | null>(null);

  // Queries
  const { data: rutinas = [], isLoading } = useQuery({
    queryKey: ['rutinas', activeUser?.id],
    queryFn: () => (activeUser ? rutinasApi.getByUsuario(activeUser.id) : Promise.resolve([])),
    enabled: Boolean(activeUser),
  });

  // Routine Form
  const {
    register: registerRutina,
    handleSubmit: handleRutinaSubmit,
    reset: resetRutinaForm,
    formState: { errors: rutinaErrors },
  } = useForm<RutinaFormValues>({
    resolver: zodResolver(rutinaSchema),
  });

  // Exercise Form
  const {
    register: registerEjercicio,
    handleSubmit: handleEjercicioSubmit,
    reset: resetEjercicioForm,
    formState: { errors: ejercicioErrors },
  } = useForm<EjercicioFormValues>({
    resolver: zodResolver(ejercicioSchema),
    defaultValues: {
      seriesObjetivo: 4,
      repeticionesObjetivo: 10,
      pesoObjetivo: 0,
    },
  });

  // Mutations
  const createRutinaMutation = useMutation({
    mutationFn: (data: RutinaFormValues) => {
      if (!activeUser) throw new Error('No user selected');
      return rutinasApi.create({
        nombre: data.nombre,
        descripcion: data.descripcion,
        activa: true,
        usuarioId: activeUser.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutinas', activeUser?.id] });
      setIsRutinaModalOpen(false);
      resetRutinaForm();
    },
  });

  const toggleRutinaMutation = useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) =>
      rutinasApi.toggleEstado(id, activa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutinas', activeUser?.id] });
    },
  });

  const deleteRutinaMutation = useMutation({
    mutationFn: (id: number) => rutinasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutinas', activeUser?.id] });
    },
  });

  const createEjercicioMutation = useMutation({
    mutationFn: (data: EjercicioFormValues) => {
      if (!selectedRutinaForEjercicio) throw new Error('No routine selected');
      return ejerciciosApi.create({
        nombre: data.nombre,
        seriesObjetivo: data.seriesObjetivo,
        repeticionesObjetivo: data.repeticionesObjetivo,
        pesoObjetivo: data.pesoObjetivo || 0,
        rutinaId: selectedRutinaForEjercicio.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios', selectedRutinaForEjercicio?.id] });
      setSelectedRutinaForEjercicio(null);
      resetEjercicioForm();
    },
  });

  const deleteEjercicioMutation = useMutation({
    mutationFn: (id: number) => ejerciciosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
    },
  });

  if (!activeUser) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--accent-secondary)] mx-auto mb-3" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-[var(--text-primary)] font-space mb-2 tracking-tight">Selecciona un perfil</h2>
        <p className="text-[var(--text-secondary)] text-xs font-inter">
          Selecciona un usuario en la barra superior para gestionar sus rutinas.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-space flex items-center gap-3 tracking-tight">
            <Calendar className="w-6 h-6 text-[var(--accent-primary)]" strokeWidth={2} />
            Planes de entrenamiento / <span className="text-[var(--accent-primary)]">{activeUser.nombre}</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
            Programación semanal de cargas, ejercicios y microciclos biomecánicos.
          </p>
        </div>

        {/* Primary Pill Button */}
        <button
          onClick={() => setIsRutinaModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all self-start sm:self-auto font-inter"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nueva rutina
        </button>
      </div>

      {/* Routine Cards List */}
      {isLoading ? (
        <div className="py-12 text-center text-[var(--text-secondary)] text-xs font-inter">Cargando rutinas...</div>
      ) : rutinas.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]">
          <Calendar className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] font-space">No hay rutinas asignadas</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 mb-5 font-inter">
            Crea una rutina (ej. "Hipertrofia - Torso") y añade los ejercicios con sus series y peso objetivo.
          </p>
          <button
            onClick={() => setIsRutinaModalOpen(true)}
            className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter hover:brightness-105 active:scale-95 transition-all"
          >
            + Crear primera rutina
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rutinas.map((rutina, idx) => (
            <RutinaItem
              key={rutina.id}
              rutina={rutina}
              hasAiAdjustment={idx === 0}
              isExpanded={expandedRutinaId === rutina.id}
              onToggleExpand={() =>
                setExpandedRutinaId(expandedRutinaId === rutina.id ? null : rutina.id)
              }
              onToggleStatus={() =>
                toggleRutinaMutation.mutate({ id: rutina.id, activa: !rutina.activa })
              }
              onDelete={() => deleteRutinaMutation.mutate(rutina.id)}
              onAddEjercicio={() => setSelectedRutinaForEjercicio(rutina)}
              onDeleteEjercicio={(eId) => deleteEjercicioMutation.mutate(eId)}
            />
          ))}
        </div>
      )}

      {/* Modal Nueva Rutina */}
      <Modal
        isOpen={isRutinaModalOpen}
        onClose={() => setIsRutinaModalOpen(false)}
        title="Nueva rutina"
      >
        <form onSubmit={handleRutinaSubmit((data) => createRutinaMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Nombre de la rutina *
            </label>
            <input
              {...registerRutina('nombre')}
              placeholder="Ej. Espalda & Bíceps - Hipertrofia"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
            {rutinaErrors.nombre && (
              <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{rutinaErrors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Descripción / Notas
            </label>
            <textarea
              {...registerRutina('descripcion')}
              placeholder="Detalles de la sesión, calentamiento y grupos musculares..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsRutinaModalOpen(false)}
              className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createRutinaMutation.isPending}
              className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter"
            >
              {createRutinaMutation.isPending ? 'Guardando...' : 'Crear rutina'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nuevo Ejercicio */}
      <Modal
        isOpen={Boolean(selectedRutinaForEjercicio)}
        onClose={() => setSelectedRutinaForEjercicio(null)}
        title={`Añadir ejercicio a ${selectedRutinaForEjercicio?.nombre || ''}`}
      >
        <form onSubmit={handleEjercicioSubmit((data) => createEjercicioMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Nombre del ejercicio *
            </label>
            <input
              {...registerEjercicio('nombre')}
              placeholder="Ej. Press Militar con Barra"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
            {ejercicioErrors.nombre && (
              <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{ejercicioErrors.nombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Series *
              </label>
              <input
                type="number"
                {...registerEjercicio('seriesObjetivo')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {ejercicioErrors.seriesObjetivo && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{ejercicioErrors.seriesObjetivo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Reps *
              </label>
              <input
                type="number"
                {...registerEjercicio('repeticionesObjetivo')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {ejercicioErrors.repeticionesObjetivo && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{ejercicioErrors.repeticionesObjetivo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.5"
                {...registerEjercicio('pesoObjetivo')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
              />
              {ejercicioErrors.pesoObjetivo && (
                <p className="text-[10px] text-[var(--accent-error)] mt-1 font-inter">{ejercicioErrors.pesoObjetivo.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setSelectedRutinaForEjercicio(null)}
              className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createEjercicioMutation.isPending}
              className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter"
            >
              {createEjercicioMutation.isPending ? 'Guardando...' : 'Añadir ejercicio'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Subcomponente de Rutina individual
interface RutinaItemProps {
  rutina: Rutina;
  hasAiAdjustment?: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onAddEjercicio: () => void;
  onDeleteEjercicio: (id: number) => void;
}

const RutinaItem: React.FC<RutinaItemProps> = ({
  rutina,
  hasAiAdjustment,
  isExpanded,
  onToggleExpand,
  onToggleStatus,
  onDelete,
  onAddEjercicio,
  onDeleteEjercicio,
}) => {
  const { data: ejercicios = [], isLoading } = useQuery({
    queryKey: ['ejercicios', rutina.id],
    queryFn: () => ejerciciosApi.getByRutina(rutina.id),
    enabled: isExpanded,
  });

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden transition-colors hover:border-[var(--border)]/80">
      {/* Top Bar of Card */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-bold text-[var(--text-primary)] font-space tracking-tight">{rutina.nombre}</h3>
              <Badge type="status" value={rutina.activa} />
              {hasAiAdjustment && (
                <Badge type="ai" label="Ajuste de cargas IA" />
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
              {rutina.descripcion || 'Sin descripción asignada'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {/* Secondary Pill Button: Estado */}
          <button
            onClick={onToggleStatus}
            title={rutina.activa ? 'Desactivar rutina' : 'Activar rutina'}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold font-space flex items-center gap-1.5 border transition-all active:scale-95 ${
              rutina.activa
                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/20'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Power className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>{rutina.activa ? 'Activa' : 'Inactiva'}</span>
          </button>

          <button
            onClick={onDelete}
            title="Eliminar rutina"
            className="p-2 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 border border-[var(--border)] transition-colors active:scale-95"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </button>

          <button
            onClick={onToggleExpand}
            className="px-4 py-1.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40 border border-[var(--border)] transition-colors flex items-center gap-1.5 text-xs font-semibold font-inter active:scale-95"
          >
            <span>Ejercicios</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" strokeWidth={2} /> : <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Expanded Exercises Section */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-primary)]/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] font-space flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={2} />
              Ejercicios programados ({ejercicios.length})
            </h4>

            {/* Tertiary Button: Plain text with arrow */}
            <button
              onClick={onAddEjercicio}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:opacity-80 transition-opacity font-inter"
            >
              <span>+ Añadir ejercicio</span>
              <span>→</span>
            </button>
          </div>

          {isLoading ? (
            <p className="text-xs text-[var(--text-secondary)] text-center py-4 font-inter">Cargando ejercicios...</p>
          ) : ejercicios.length === 0 ? (
            <div className="text-center py-6 text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]">
              <p className="text-xs font-inter">No hay ejercicios asignados en esta rutina.</p>
              <button
                onClick={onAddEjercicio}
                className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] font-medium font-inter hover:underline"
              >
                <span>Añadir el primero</span>
                <span>→</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ejercicios.map((ej) => (
                <div
                  key={ej.id}
                  className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-start justify-between group hover:border-[var(--accent-primary)]/40 transition-colors"
                >
                  <div>
                    <h5 className="text-xs font-semibold text-[var(--text-primary)] font-space">{ej.nombre}</h5>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-secondary)] font-space tabular-nums">
                      <span className="text-[var(--text-primary)] font-semibold">{ej.seriesObjetivo} series</span>
                      <span className="text-[var(--text-secondary)]">×</span>
                      <span className="text-[var(--text-primary)] font-semibold">{ej.repeticionesObjetivo} reps</span>
                      <span className="text-[var(--text-secondary)]">•</span>
                      <span className="text-[var(--accent-primary)] font-bold">{ej.pesoObjetivo || 0} kg</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteEjercicio(ej.id)}
                    className="text-[var(--text-secondary)] hover:text-[var(--accent-error)] p-1 transition-colors"
                    title="Eliminar ejercicio"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
