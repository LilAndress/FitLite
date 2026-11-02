import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { Check, ChevronsUpDown, Search, Dumbbell, X, Loader2, Star } from 'lucide-react';
import { ejerciciosApi } from '../api/ejercicios.api';
import type { EjercicioCatalogo, GrupoMuscular, Rutina } from '../types';

interface RegistroRapidoComboboxProps {
  value?: number;
  onChange: (catalogoId: number, nombre: string) => void;
  activeRoutines: Rutina[];
  error?: string;
  disabled?: boolean;
}

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

export const RegistroRapidoCombobox: React.FC<RegistroRapidoComboboxProps> = ({
  value,
  onChange,
  activeRoutines,
  error,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // 1. Obtener catálogo completo de ejercicios
  const { data: catalogo = [], isLoading: isLoadingCatalogo } = useQuery<EjercicioCatalogo[]>({
    queryKey: ['ejerciciosCatalogoCompleto'],
    queryFn: () => ejerciciosApi.getCatalogo(),
    staleTime: 60000,
  });

  // 2. Obtener ejercicios de las rutinas activas del usuario
  const { data: activeRoutineEjercicios = [] } = useQuery({
    queryKey: ['activeRoutineEjercicios', activeRoutines.map((r) => r.id).join(',')],
    queryFn: async () => {
      if (activeRoutines.length === 0) return [];
      const promises = activeRoutines.map(async (r) => {
        try {
          return await ejerciciosApi.getByRutina(r.id);
        } catch {
          return [];
        }
      });
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: activeRoutines.length > 0,
    staleTime: 60000,
  });

  // 3. Procesar ejercicios: separar los de rutinas activas (sin duplicados) y el resto del catálogo agrupados
  const { activeRoutineList, catalogByMuscle } = useMemo(() => {
    // Normalizar ejercicios de rutinas activas (sin duplicados, solo nombre limpio)
    const activeMap = new Map<number, { id: number; nombre: string; grupoMuscular?: GrupoMuscular }>();
    activeRoutineEjercicios.forEach((ej) => {
      const catId = ej.ejercicioCatalogoId || ej.id;
      if (!activeMap.has(catId)) {
        activeMap.set(catId, {
          id: catId,
          nombre: ej.nombre,
          grupoMuscular: ej.grupoMuscular,
        });
      }
    });

    // Catálogo agrupado por grupo muscular (sin duplicados)
    const grouped: Record<string, EjercicioCatalogo[]> = {};
    const seenCatalogIds = new Set<number>();

    catalogo.forEach((item) => {
      if (seenCatalogIds.has(item.id)) return;
      seenCatalogIds.add(item.id);

      const grupo = item.grupoMuscular || 'OTROS';
      if (!grouped[grupo]) {
        grouped[grupo] = [];
      }
      grouped[grupo].push(item);
    });

    return {
      activeRoutineList: Array.from(activeMap.values()),
      catalogByMuscle: grouped,
    };
  }, [catalogo, activeRoutineEjercicios]);

  // Nombre del ejercicio seleccionado actualmente
  const selectedExerciseName = useMemo(() => {
    if (!value) return '';
    const fromActive = activeRoutineList.find((e) => e.id === value);
    if (fromActive) return fromActive.nombre;
    const fromCat = catalogo.find((e) => e.id === value);
    if (fromCat) return fromCat.nombre;
    return '';
  }, [value, activeRoutineList, catalogo]);

  const handleSelect = (catalogoId: number, nombre: string) => {
    onChange(catalogoId, nombre);
    setOpen(false);
    setSearch('');
  };

  const filteredActiveList = useMemo(() => {
    if (!search.trim()) return activeRoutineList;
    const q = search.toLowerCase().trim();
    return activeRoutineList.filter((e) => e.nombre.toLowerCase().includes(q) || e.grupoMuscular?.toLowerCase().includes(q));
  }, [activeRoutineList, search]);

  const filteredCatalogGroups = useMemo(() => {
    if (!search.trim()) return catalogByMuscle;
    const q = search.toLowerCase().trim();
    const result: Record<string, EjercicioCatalogo[]> = {};

    Object.entries(catalogByMuscle).forEach(([group, items]) => {
      const matches = items.filter((item) => item.nombre.toLowerCase().includes(q) || group.toLowerCase().includes(q));
      if (matches.length > 0) {
        result[group] = matches;
      }
    });

    return result;
  }, [catalogByMuscle, search]);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter">
        Ejercicio *
      </label>

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border text-xs text-left font-inter transition-all ${
              error
                ? 'border-[var(--accent-error)]'
                : open
                ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30'
                : 'border-[var(--border)] hover:border-[var(--accent-primary)]/40'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {selectedExerciseName ? (
              <span className="text-[var(--text-primary)] font-semibold truncate flex items-center gap-2">
                <Dumbbell className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                {selectedExerciseName}
              </span>
            ) : (
              <span className="text-[var(--text-secondary)]/60">
                Seleccionar o buscar ejercicio...
              </span>
            )}
            <ChevronsUpDown className="w-4 h-4 text-[var(--text-secondary)] shrink-0 ml-2" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="w-[var(--radix-popover-trigger-width)] min-w-[320px] max-w-[500px] p-0 rounded-2xl bg-[#121620] border border-[var(--border)] shadow-2xl shadow-black/90 z-[110] overflow-hidden text-xs font-inter animate-in fade-in-0 zoom-in-95"
          >
            <Command shouldFilter={false} className="w-full flex flex-col">
              {/* Barra de búsqueda interactiva */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--border)] bg-[#0E121A]">
                <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Buscar ejercicio en catálogo..."
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

              {/* Lista con scroll */}
              <Command.List className="max-h-72 overflow-y-auto p-2 space-y-3">
                {isLoadingCatalogo && (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-[var(--text-secondary)]">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                    <span>Cargando catálogo de ejercicios...</span>
                  </div>
                )}

                {/* 1. SECCIÓN: EJERCICIOS DE TUS RUTINAS ACTIVAS (MOSTRADOS PRIMERO) */}
                {filteredActiveList.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)] font-space">
                      <Star className="w-3 h-3 fill-current" />
                      <span>De tus rutinas activas</span>
                    </div>
                    {filteredActiveList.map((item) => {
                      const isSelected = value === item.id;
                      const badgeStyle = (item.grupoMuscular && BADGE_COLORS[item.grupoMuscular]) || 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]';
                      return (
                        <Command.Item
                          key={`active-${item.id}`}
                          value={item.nombre}
                          onSelect={() => handleSelect(item.id, item.nombre)}
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold border border-[var(--accent-primary)]/30'
                              : 'text-[var(--text-primary)] hover:bg-[var(--surface)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{item.nombre}</span>
                            {item.grupoMuscular && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border shrink-0 font-inter ${badgeStyle}`}>
                                {item.grupoMuscular}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />}
                        </Command.Item>
                      );
                    })}
                  </div>
                )}

                {/* 2. SECCIÓN: AGRUPADOS POR GRUPO MUSCULAR (RESTO DEL CATÁLOGO) */}
                {Object.entries(filteredCatalogGroups).map(([grupo, items]) => {
                  const badgeStyle = BADGE_COLORS[grupo] || 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]';
                  return (
                    <div key={grupo} className="space-y-1 pt-1 border-t border-[var(--border)]/40">
                      <div className="flex items-center justify-between px-2 py-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider font-space uppercase ${badgeStyle}`}>
                          {grupo}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]/60">
                          {items.length} ejercicios
                        </span>
                      </div>

                      {items.map((item) => {
                        const isSelected = value === item.id;
                        return (
                          <Command.Item
                            key={`cat-${item.id}`}
                            value={item.nombre}
                            onSelect={() => handleSelect(item.id, item.nombre)}
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold border border-[var(--accent-primary)]/30'
                                : 'text-[var(--text-primary)] hover:bg-[var(--surface)]'
                            }`}
                          >
                            <span className="truncate">{item.nombre}</span>
                            {isSelected && <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />}
                          </Command.Item>
                        );
                      })}
                    </div>
                  );
                })}

                {!isLoadingCatalogo && filteredActiveList.length === 0 && Object.keys(filteredCatalogGroups).length === 0 && (
                  <div className="py-6 px-3 text-center text-xs text-[var(--text-secondary)] font-inter">
                    No se encontraron ejercicios coincidentes.
                  </div>
                )}
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {error && <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{error}</p>}
    </div>
  );
};
