import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { 
  Check, 
  ChevronsUpDown, 
  Search, 
  Plus, 
  Dumbbell, 
  X, 
  Sparkles, 
  Loader2,
  AlertCircle,
  Filter
} from 'lucide-react';
import { ejerciciosApi } from '../api/ejercicios.api';
import type { EjercicioCatalogo, GrupoMuscular } from '../types';

interface EjercicioComboboxProps {
  value: string;
  selectedCatalogoId?: number;
  onChange: (nombre: string, catalogoId?: number, item?: EjercicioCatalogo) => void;
  error?: string;
  disabled?: boolean;
}

const GRUPOS_MUSCULARES: { value: GrupoMuscular; label: string }[] = [
  { value: 'PECHO', label: 'Pecho' },
  { value: 'ESPALDA', label: 'Espalda' },
  { value: 'HOMBROS', label: 'Hombros' },
  { value: 'BICEPS', label: 'Bíceps' },
  { value: 'TRICEPS', label: 'Tríceps' },
  { value: 'PIERNAS', label: 'Piernas' },
  { value: 'GLUTEOS', label: 'Glúteos' },
  { value: 'CORE', label: 'Core' },
  { value: 'CARDIO', label: 'Cardio' },
];

const FILTRO_GRUPOS: { value: string; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  ...GRUPOS_MUSCULARES,
];

// Color mapping badges por grupo muscular
const BADGE_COLORS: Record<string, string> = {
  PECHO: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  ESPALDA: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  HOMBROS: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  BICEPS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  TRICEPS: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  PIERNAS: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  GLUTEOS: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
  CORE: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  CARDIO: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export const EjercicioCombobox: React.FC<EjercicioComboboxProps> = ({
  value,
  selectedCatalogoId,
  onChange,
  error,
  disabled = false,
}) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGrupoFilter, setSelectedGrupoFilter] = useState<string>('TODOS');

  // Estado del sub-formulario inline para creación
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoGrupo, setNuevoGrupo] = useState<GrupoMuscular>('PECHO');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Debounce para optimizar llamadas al endpoint /ejercicios/buscar?query=
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Consulta GET /ejercicios/buscar?query=&grupoMuscular= (muestra TODOS si query está vacío)
  const { data: resultados = [], isLoading } = useQuery<EjercicioCatalogo[]>({
    queryKey: ['ejerciciosBuscar', debouncedSearch, selectedGrupoFilter],
    queryFn: () => ejerciciosApi.buscarCatalogo(debouncedSearch, selectedGrupoFilter),
    enabled: open,
    staleTime: 30000,
  });

  // Mutación para crear nuevo ejercicio en el catálogo global
  const crearCatalogoMutation = useMutation({
    mutationFn: (data: { nombre: string; grupoMuscular: GrupoMuscular; descripcionTecnica?: string }) =>
      ejerciciosApi.crearCatalogo(data),
    onSuccess: (nuevoEjercicio) => {
      queryClient.invalidateQueries({ queryKey: ['catalogoEjercicios'] });
      queryClient.invalidateQueries({ queryKey: ['ejerciciosBuscar'] });
      // Seleccionar automáticamente el ejercicio recién creado
      onChange(nuevoEjercicio.nombre, nuevoEjercicio.id, nuevoEjercicio);
      setShowCreateForm(false);
      setOpen(false);
      setSearch('');
      setCreateError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Error al crear el ejercicio en el catálogo';
      setCreateError(msg);
    },
  });

  const handleSelectEjercicio = (ejercicio: EjercicioCatalogo) => {
    onChange(ejercicio.nombre, ejercicio.id, ejercicio);
    setOpen(false);
    setSearch('');
  };

  const handleOpenCreateForm = (nombreInicial: string) => {
    setNuevoNombre(nombreInicial);
    // Pre-seleccionar el grupo filtrado si el usuario no tenía seleccionado 'TODOS'
    const initialGroup = selectedGrupoFilter !== 'TODOS' ? (selectedGrupoFilter as GrupoMuscular) : 'PECHO';
    setNuevoGrupo(initialGroup);
    setNuevaDescripcion('');
    setCreateError(null);
    setShowCreateForm(true);
    setOpen(false);
  };

  const handleGuardarNuevoEjercicio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      setCreateError('El nombre del ejercicio es obligatorio');
      return;
    }
    crearCatalogoMutation.mutate({
      nombre: nuevoNombre.trim(),
      grupoMuscular: nuevoGrupo,
      descripcionTecnica: nuevaDescripcion.trim() || undefined,
    });
  };

  const hasExactMatch = resultados.some(
    (item) => item.nombre.toLowerCase().trim() === search.toLowerCase().trim()
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter">
          Nombre del ejercicio *
        </label>
        {selectedCatalogoId && (
          <span className="text-[10px] text-[var(--accent-primary)] font-inter font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Catálogo global
          </span>
        )}
      </div>

      {/* Popover + Command Combobox */}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || showCreateForm}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border text-xs text-left font-inter transition-all ${
              error
                ? 'border-[var(--accent-error)]'
                : open
                ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30'
                : 'border-[var(--border)] hover:border-[var(--accent-primary)]/40'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {value ? (
              <span className="text-[var(--text-primary)] font-medium truncate flex items-center gap-2">
                <Dumbbell className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                {value}
              </span>
            ) : (
              <span className="text-[var(--text-secondary)]/50">
                Seleccionar o buscar ejercicio del catálogo...
              </span>
            )}
            <ChevronsUpDown className="w-4 h-4 text-[var(--text-secondary)] shrink-0 ml-2" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="w-[var(--radix-popover-trigger-width)] min-w-[340px] max-w-[520px] p-0 rounded-2xl bg-[#121620] border border-[var(--border)] shadow-2xl shadow-black/90 z-[100] overflow-hidden text-xs font-inter animate-in fade-in-0 zoom-in-95"
          >
            <Command shouldFilter={false} className="w-full flex flex-col">
              {/* Barra de búsqueda interactiva */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--border)] bg-[#0E121A]">
                <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Buscar por nombre o escribir nuevo..."
                  className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none font-inter"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-[var(--text-secondary)] hover:text-white p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Barra de filtrado por Grupo Muscular con scroll horizontal suave */}
              <div className="px-2.5 py-2 border-b border-[var(--border)] bg-[#10141D] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <Filter className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0 ml-1 mr-0.5" />
                {FILTRO_GRUPOS.map((g) => {
                  const isActive = selectedGrupoFilter === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setSelectedGrupoFilter(g.value)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-[var(--accent-primary)] text-[#0D1117] shadow-sm font-bold scale-[1.02]'
                          : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-primary)]/40 border border-[var(--border)]'
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>

              {/* Tira informativa con contador de resultados */}
              <div className="flex items-center justify-between px-3.5 py-1.5 text-[10px] text-[var(--text-secondary)]/70 bg-[#0E121A]/80 border-b border-[var(--border)]/40 font-inter">
                <span>
                  {selectedGrupoFilter === 'TODOS'
                    ? 'Catálogo completo'
                    : `Filtrando por: ${FILTRO_GRUPOS.find((g) => g.value === selectedGrupoFilter)?.label}`}
                </span>
                <span className="font-medium text-[var(--text-secondary)]">
                  {isLoading ? 'Buscando...' : `${resultados.length} disponibles`}
                </span>
              </div>

              {/* Lista de ejercicios disponibles */}
              <Command.List className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-[var(--text-secondary)] font-inter">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                    <span>Cargando ejercicios disponibles...</span>
                  </div>
                )}

                {!isLoading && resultados.length === 0 && (
                  <div className="py-6 px-3 text-center text-xs text-[var(--text-secondary)] font-inter space-y-1">
                    <p className="font-medium text-[var(--text-primary)]">No hay coincidencias en el catálogo</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {search ? `Ningún ejercicio contiene "${search}"` : 'No hay ejercicios en este grupo'}
                    </p>
                  </div>
                )}

                {!isLoading &&
                  resultados.map((ej) => {
                    const isSelected = value.toLowerCase() === ej.nombre.toLowerCase();
                    const badgeStyle = (ej.grupoMuscular && BADGE_COLORS[ej.grupoMuscular]) || 'bg-[var(--surface)] text-[var(--accent-primary)] border-[var(--border)]';

                    return (
                      <Command.Item
                        key={ej.id}
                        value={ej.nombre}
                        onSelect={() => handleSelectEjercicio(ej)}
                        className={`flex items-start justify-between gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold border border-[var(--accent-primary)]/30'
                            : 'text-[var(--text-primary)] hover:bg-[var(--surface)] hover:text-white'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{ej.nombre}</span>
                            {ej.grupoMuscular && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border shrink-0 font-inter ${badgeStyle}`}>
                                {ej.grupoMuscular}
                              </span>
                            )}
                          </div>
                          {ej.descripcionTecnica && (
                            <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5 font-normal">
                              {ej.descripcionTecnica}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                        )}
                      </Command.Item>
                    );
                  })}

                {/* Opción de Crear ejercicio nuevo si no hay coincidencia exacta */}
                {search.trim().length > 0 && !hasExactMatch && (
                  <div className="pt-1 mt-1 border-t border-[var(--border)]/60">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateForm(search.trim())}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-semibold text-xs text-left transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                      <span className="truncate">
                        Crear ejercicio nuevo: <strong className="underline">"{search.trim()}"</strong>
                      </span>
                    </button>
                  </div>
                )}
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {error && !showCreateForm && (
        <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{error}</p>
      )}

      {/* Sub-formulario inline para creación en catálogo */}
      {showCreateForm && (
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--accent-primary)]/40 shadow-xl space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              <h5 className="text-xs font-bold text-[var(--text-primary)] font-space">
                Nuevo ejercicio en catálogo global
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-[var(--text-secondary)] hover:text-white p-1 rounded-md transition-colors"
              title="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {createError && (
            <div className="p-2.5 rounded-xl bg-[var(--accent-error)]/10 border border-[var(--accent-error)]/30 text-[var(--accent-error)] text-[11px] font-inter flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Nombre del ejercicio *
              </label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej. Press inclinado con mancuernas"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Grupo muscular *
              </label>
              <select
                value={nuevoGrupo}
                onChange={(e) => setNuevoGrupo(e.target.value as GrupoMuscular)}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
              >
                {GRUPOS_MUSCULARES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Descripción técnica (opcional)
              </label>
              <textarea
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                placeholder="Explica brevemente la ejecución correcta"
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]/50">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-full border border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarNuevoEjercicio}
                disabled={crearCatalogoMutation.isPending || !nuevoNombre.trim()}
                className="px-4 py-1.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-[11px] font-bold font-inter hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {crearCatalogoMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando en catálogo...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span>Guardar y seleccionar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
