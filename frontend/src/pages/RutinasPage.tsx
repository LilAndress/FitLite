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
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Selecciona un usuario</h2>
        <p className="text-slate-400 text-sm">
          Por favor selecciona o crea un usuario en el menú superior para ver y gestionar rutinas.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit'] flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-400" />
            Rutinas de Entrenamiento
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organiza los días y ejercicios de tu plan para {activeUser.nombre}.
          </p>
        </div>
        <button
          onClick={() => setIsRutinaModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-500/20 text-xs transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Nueva Rutina
        </button>
      </div>

      {/* Routine Cards List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Cargando rutinas...</div>
      ) : rutinas.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No hay rutinas creadas</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Crea tu primera rutina (ej. "Pecho y Tríceps", "Día de Pierna") y añade los ejercicios correspondientes.
          </p>
          <button
            onClick={() => setIsRutinaModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20"
          >
            + Crear Rutina
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rutinas.map((rutina) => (
            <RutinaItem
              key={rutina.id}
              rutina={rutina}
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
        title="Crear Nueva Rutina"
      >
        <form onSubmit={handleRutinaSubmit((data) => createRutinaMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Rutina *</label>
            <input
              {...registerRutina('nombre')}
              placeholder="Ej. Espalda y Bíceps - Hipertrofia"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {rutinaErrors.nombre && (
              <p className="text-[11px] text-rose-400 mt-1">{rutinaErrors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción</label>
            <textarea
              {...registerRutina('descripcion')}
              placeholder="Detalles, enfoque o días recomendados..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRutinaModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createRutinaMutation.isPending}
              className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              {createRutinaMutation.isPending ? 'Guardando...' : 'Crear Rutina'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nuevo Ejercicio */}
      <Modal
        isOpen={Boolean(selectedRutinaForEjercicio)}
        onClose={() => setSelectedRutinaForEjercicio(null)}
        title={`Añadir Ejercicio a "${selectedRutinaForEjercicio?.nombre}"`}
      >
        <form onSubmit={handleEjercicioSubmit((data) => createEjercicioMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Ejercicio *</label>
            <input
              {...registerEjercicio('nombre')}
              placeholder="Ej. Press Militar con Barra"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {ejercicioErrors.nombre && (
              <p className="text-[11px] text-rose-400 mt-1">{ejercicioErrors.nombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Series Objetivo *</label>
              <input
                type="number"
                {...registerEjercicio('seriesObjetivo')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              {ejercicioErrors.seriesObjetivo && (
                <p className="text-[10px] text-rose-400 mt-1">{ejercicioErrors.seriesObjetivo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reps Objetivo *</label>
              <input
                type="number"
                {...registerEjercicio('repeticionesObjetivo')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              {ejercicioErrors.repeticionesObjetivo && (
                <p className="text-[10px] text-rose-400 mt-1">{ejercicioErrors.repeticionesObjetivo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Peso Obj. (kg)</label>
              <input
                type="number"
                step="0.5"
                {...registerEjercicio('pesoObjetivo')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              {ejercicioErrors.pesoObjetivo && (
                <p className="text-[10px] text-rose-400 mt-1">{ejercicioErrors.pesoObjetivo.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setSelectedRutinaForEjercicio(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createEjercicioMutation.isPending}
              className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              {createEjercicioMutation.isPending ? 'Guardando...' : 'Añadir Ejercicio'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Sub-component for individual routine card
interface RutinaItemProps {
  rutina: Rutina;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onAddEjercicio: () => void;
  onDeleteEjercicio: (id: number) => void;
}

const RutinaItem: React.FC<RutinaItemProps> = ({
  rutina,
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
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-700">
      {/* Top Bar of Card */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0 border border-slate-700">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-white font-['Outfit']">{rutina.nombre}</h3>
              <Badge type="status" value={rutina.activa} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {rutina.descripcion || 'Sin descripción'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={onToggleStatus}
            title={rutina.activa ? 'Desactivar rutina' : 'Activar rutina'}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              rutina.activa
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{rutina.activa ? 'Activa' : 'Inactiva'}</span>
          </button>

          <button
            onClick={onDelete}
            title="Eliminar rutina"
            className="p-2 rounded-xl bg-slate-800/80 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-700/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleExpand}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs"
          >
            <span>Ejercicios</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Exercises Section */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
              Lista de Ejercicios ({ejercicios.length})
            </h4>
            <button
              onClick={onAddEjercicio}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir Ejercicio
            </button>
          </div>

          {isLoading ? (
            <p className="text-xs text-slate-400 text-center py-4">Cargando ejercicios...</p>
          ) : ejercicios.length === 0 ? (
            <div className="text-center py-6 text-slate-400 border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs">No hay ejercicios en esta rutina todavía.</p>
              <button
                onClick={onAddEjercicio}
                className="mt-2 text-xs text-emerald-400 hover:underline font-medium"
              >
                + Añadir el primero
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ejercicios.map((ej) => (
                <div
                  key={ej.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between"
                >
                  <div>
                    <h5 className="text-sm font-semibold text-slate-100">{ej.nombre}</h5>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span>
                        <strong className="text-emerald-400">{ej.seriesObjetivo}</strong> series
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-emerald-400">{ej.repeticionesObjetivo}</strong> reps
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-emerald-400">{ej.pesoObjetivo || 0}</strong> kg
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteEjercicio(ej.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Eliminar ejercicio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
