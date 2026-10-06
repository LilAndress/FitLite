import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Users, 
  UserPlus, 
  Mail, 
  CheckCircle, 
  Trash2, 
  Target, 
  ShieldCheck,
  Calendar,
  Scale,
  Edit3
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { usuariosApi } from '../api/usuarios.api';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import type { Usuario } from '../types';

const usuarioSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
  pesoActual: z.coerce.number().positive('El peso debe ser mayor a 0').optional(),
  objetivo: z.enum(['PERDER_PESO', 'GANAR_MASA', 'MANTENER', 'RESISTENCIA'] as const),
  rol: z.enum(['USUARIO', 'ENTRENADOR', 'ADMIN'] as const),
});

type UsuarioFormValues = z.infer<typeof usuarioSchema>;

export const UsuariosPage: React.FC = () => {
  const { users, activeUser, setActiveUser, refreshUsers, isLoadingUsers } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado para modal de actualización rápida de peso
  const [selectedUserForWeight, setSelectedUserForWeight] = useState<Usuario | null>(null);
  const [pesoInput, setPesoInput] = useState<string>('');
  const [notasInput, setNotasInput] = useState<string>('');
  const [pesoUpdateError, setPesoUpdateError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      objetivo: 'GANAR_MASA',
      rol: 'USUARIO',
    },
  });

  const createUsuarioMutation = useMutation({
    mutationFn: (data: UsuarioFormValues) => usuariosApi.create(data),
    onSuccess: async (newUser) => {
      await refreshUsers();
      setActiveUser(newUser);
      setIsModalOpen(false);
      reset();
      setErrorMessage(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Error al crear el usuario. ¿Email duplicado?';
      setErrorMessage(msg);
    },
  });

  const onSubmitNuevoUsuario = (data: UsuarioFormValues) => {
    createUsuarioMutation.mutate(data);
  };

  const updatePesoMutation = useMutation({
    mutationFn: async ({ id, peso, notas }: { id: number; peso: number; notas?: string }) => {
      return usuariosApi.actualizarPeso(id, { peso, notas });
    },
    onSuccess: async () => {
      await refreshUsers();
      setSelectedUserForWeight(null);
      setPesoInput('');
      setNotasInput('');
      setPesoUpdateError(null);
    },
    onError: (err: any) => {
      setPesoUpdateError(err.response?.data?.message || 'Error al actualizar el peso');
    },
  });

  const deleteUsuarioMutation = useMutation({
    mutationFn: (id: number) => usuariosApi.delete(id),
    onSuccess: async () => {
      await refreshUsers();
    },
  });

  const handleGuardarPeso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForWeight) return;
    const pesoNum = parseFloat(pesoInput);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      setPesoUpdateError('Por favor ingresa un peso válido mayor a 0 kg');
      return;
    }
    updatePesoMutation.mutate({
      id: selectedUserForWeight.id,
      peso: pesoNum,
      notas: notasInput.trim() || undefined,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-space flex items-center gap-3 tracking-tight">
            <Users className="w-6 h-6 text-[var(--accent-primary)]" strokeWidth={2} />
            Directorio de atletas y usuarios
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
            Gestión de perfiles, metas físicas, peso corporal y permisos de acceso.
          </p>
        </div>

        {/* Primary Pill Button */}
        <button
          onClick={() => {
            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all self-start sm:self-auto font-inter"
        >
          <UserPlus className="w-4 h-4" strokeWidth={2.5} />
          Registrar atleta
        </button>
      </div>

      {/* Users Grid */}
      {isLoadingUsers ? (
        <div className="py-12 text-center text-[var(--text-secondary)] text-xs font-inter">Cargando perfiles...</div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]">
          <Users className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] font-space">No hay usuarios registrados</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 mb-5 font-inter">
            Crea tu primer usuario para empezar a asignar rutinas y registrar sesiones de entrenamiento.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter hover:brightness-105 active:scale-95 transition-all"
          >
            + Registrar primer usuario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((u) => {
            const isActive = activeUser?.id === u.id;
            return (
              <div
                key={u.id}
                className={`p-5 rounded-2xl bg-[var(--surface)] border transition-all relative flex flex-col justify-between ${
                  isActive
                    ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/50'
                    : 'border-[var(--border)] hover:border-[var(--border)]/80'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-[var(--accent-primary)] text-[#0D1117] text-[10px] font-bold px-3 py-1 rounded-bl-xl font-space tracking-wide">
                    Activo
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-11 h-11 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--accent-primary)] flex items-center justify-center font-bold text-base font-space">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] font-space">{u.nombre}</h3>
                      <p className="text-xs text-[var(--text-secondary)] font-inter flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-[var(--text-secondary)]" strokeWidth={1.8} />
                        <span>{u.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 py-3 border-y border-[var(--border)] my-3 text-xs font-inter">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-[var(--accent-primary)]" strokeWidth={1.8} /> Peso actual:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-space font-semibold text-[var(--text-primary)]">
                          {u.pesoActual ? `${u.pesoActual} kg` : 'Sin registrar'}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedUserForWeight(u);
                            setPesoInput(u.pesoActual ? String(u.pesoActual) : '');
                            setNotasInput('');
                            setPesoUpdateError(null);
                          }}
                          className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                          title="Actualizar peso corporal"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[var(--text-secondary)]" strokeWidth={1.8} /> Objetivo:
                      </span>
                      <Badge type="objetivo" value={u.objetivo} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-secondary)]" strokeWidth={1.8} /> Rol:
                      </span>
                      <Badge type="rol" value={u.rol} />
                    </div>
                    {u.fechaRegistro && (
                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" strokeWidth={1.8} /> Alta:
                        </span>
                        <span className="font-space font-medium tabular-nums">{u.fechaRegistro.slice(0, 10)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    onClick={() => setActiveUser(u)}
                    disabled={isActive}
                    className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold font-inter flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      isActive
                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 cursor-default'
                        : 'bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40 border border-[var(--border)]'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} color={isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                    {isActive ? 'Perfil en uso' : 'Usar perfil'}
                  </button>

                  <button
                    onClick={() => deleteUsuarioMutation.mutate(u.id)}
                    className="p-2 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 border border-[var(--border)] transition-colors active:scale-95"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar Usuario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar nuevo atleta"
      >
        <form onSubmit={handleSubmit(onSubmitNuevoUsuario)} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[var(--accent-error)]/10 border border-[var(--accent-error)]/30 text-[var(--accent-error)] text-xs font-inter">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Nombre completo *
            </label>
            <input
              {...register('nombre')}
              placeholder="Ej. Juan Pérez"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
            {errors.nombre && (
              <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Correo electrónico *
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="juan@fitlite.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
            {errors.email && (
              <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Contraseña de acceso *
            </label>
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
            {errors.password && (
              <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Peso actual inicial (kg) - Opcional
            </label>
            <input
              type="number"
              step="0.1"
              {...register('pesoActual')}
              placeholder="Ej. 75.5"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
            {errors.pesoActual && (
              <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{errors.pesoActual.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Objetivo físico *
              </label>
              <select
                {...register('objetivo')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
              >
                <option value="GANAR_MASA">Ganar masa muscular</option>
                <option value="PERDER_PESO">Perder peso</option>
                <option value="MANTENER">Mantenimiento</option>
                <option value="RESISTENCIA">Resistencia</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1">
                Rol de usuario *
              </label>
              <select
                {...register('rol')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
              >
                <option value="USUARIO">Atleta</option>
                <option value="ENTRENADOR">Entrenador</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createUsuarioMutation.isPending}
              className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter"
            >
              {createUsuarioMutation.isPending ? 'Creando...' : 'Crear atleta'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Actualización Rápida de Peso */}
      <Modal
        isOpen={Boolean(selectedUserForWeight)}
        onClose={() => {
          setSelectedUserForWeight(null);
          setPesoUpdateError(null);
        }}
        title={`Actualizar peso corporal - ${selectedUserForWeight?.nombre}`}
      >
        <form onSubmit={handleGuardarPeso} className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)] font-inter">
            Al registrar el nuevo peso corporal, se actualizará el valor actual del perfil y se creará automáticamente un registro en el historial de seguimiento.
          </p>

          {pesoUpdateError && (
            <div className="p-3 rounded-xl bg-[var(--accent-error)]/10 border border-[var(--accent-error)]/30 text-[var(--accent-error)] text-xs font-inter">
              {pesoUpdateError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Nuevo peso actual (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              value={pesoInput}
              onChange={(e) => setPesoInput(e.target.value)}
              placeholder="Ej. 76.2"
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Notas u observaciones (Opcional)
            </label>
            <input
              type="text"
              value={notasInput}
              onChange={(e) => setNotasInput(e.target.value)}
              placeholder="Ej. En ayunas después de entrenar"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setSelectedUserForWeight(null)}
              className="px-5 py-2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold font-inter active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updatePesoMutation.isPending}
              className="px-6 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter"
            >
              {updatePesoMutation.isPending ? 'Guardando...' : 'Guardar y registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
