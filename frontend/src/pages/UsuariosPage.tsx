import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Trash2, 
  Target, 
  ShieldCheck,
  Calendar,
  Scale,
  Edit3,
  ShieldAlert,
  Power,
  PowerOff,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { usuariosApi } from '../api/usuarios.api';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import type { Usuario, UsuarioRequest } from '../types';

const usuarioSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
  pesoActual: z.number().positive('El peso debe ser mayor a 0').optional(),
  objetivo: z.enum(['PERDER_PESO', 'GANAR_MASA', 'MANTENER', 'RESISTENCIA'] as const),
  rol: z.enum(['USUARIO', 'ENTRENADOR', 'ADMIN'] as const),
});

type UsuarioFormValues = z.infer<typeof usuarioSchema>;

export const UsuariosPage: React.FC = () => {
  const { activeUser, refreshUsers } = useUser();
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.getAll(),
    enabled: activeUser?.rol === 'ADMIN',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal para confirmación de eliminación permanente
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);

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

  // Mutación para crear usuario desde el panel de administración
  const createUsuarioMutation = useMutation({
    mutationFn: (data: UsuarioFormValues) => {
      const payload: UsuarioRequest = {
        nombre: data.nombre.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        objetivo: data.objetivo,
        rol: data.rol,
        pesoActual: data.pesoActual !== undefined ? Number(data.pesoActual) : undefined,
      };
      return usuariosApi.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      await refetchUsers();
      await refreshUsers();
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

  // Mutación para toggle Activar / Desactivar cuenta
  const toggleEstadoMutation = useMutation({
    mutationFn: (id: number) => usuariosApi.toggleEstado(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      await refetchUsers();
      await refreshUsers();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error al modificar el estado de la cuenta');
    },
  });

  // Mutación para actualizar peso
  const updatePesoMutation = useMutation({
    mutationFn: async ({ id, peso, notas }: { id: number; peso: number; notas?: string }) => {
      return usuariosApi.actualizarPeso(id, { peso, notas });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      await refetchUsers();
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

  // Mutación para eliminar usuario
  const deleteUsuarioMutation = useMutation({
    mutationFn: (id: number) => usuariosApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      await refetchUsers();
      await refreshUsers();
      setUserToDelete(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error al eliminar el usuario');
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

  // =========================================================================
  // BLOQUEO DE SEGURIDAD 403: SOLO ROL ADMIN
  // =========================================================================
  if (!activeUser || activeUser.rol !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-6 shadow-xl shadow-red-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold font-space uppercase tracking-wider mb-4">
          Error 403 · Acceso Restringido
        </div>

        <h1 className="text-2xl sm:text-4xl font-black font-orbitron text-white tracking-tight uppercase">
          PERMISOS INSUFICIENTES
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-[var(--text-secondary)] font-inter max-w-md leading-relaxed">
          El directorio de atletas y la gestión de cuentas son de acceso exclusivo para administradores (<span className="text-[var(--accent-primary)] font-space font-semibold">ADMIN</span>). Tu cuenta actual ({activeUser?.nombre || 'Visitante'}) no posee privilegios de administración.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter shadow-md"
          >
            Volver a mi Dashboard →
          </Link>
          <Link
            to="/rutinas"
            className="px-6 py-3 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40 transition-all font-inter"
          >
            Ver mis rutinas
          </Link>
        </div>
      </div>
    );
  }

  // Métricas rápidas de administración
  const totalUsuarios = users.length;
  const totalActivos = users.filter((u) => u.activo !== false).length;
  const totalDesactivados = totalUsuarios - totalActivos;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-space tracking-wide uppercase">
              Panel Administrativo
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-space flex items-center gap-3 tracking-tight">
            <Users className="w-6 h-6 text-[var(--accent-primary)]" strokeWidth={2} />
            Directorio de atletas y usuarios
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
            Gestión centralizada de cuentas, activación/desactivación de accesos y monitoreo de actividad.
          </p>
        </div>

        {/* Primary Pill Button */}
        <button
          onClick={() => {
            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all self-start sm:self-auto font-inter cursor-pointer shadow-md"
        >
          <UserPlus className="w-4 h-4" strokeWidth={2.5} />
          Registrar nuevo usuario
        </button>
      </div>

      {/* Barra de métricas de usuarios */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl">
        <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col">
          <span className="text-[11px] text-[var(--text-secondary)] font-inter">Total registrados</span>
          <span className="text-xl sm:text-2xl font-bold font-space text-[var(--text-primary)] mt-0.5">
            {totalUsuarios}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col">
          <span className="text-[11px] text-[var(--text-secondary)] font-inter">Cuentas activas</span>
          <span className="text-xl sm:text-2xl font-bold font-space text-[var(--accent-primary)] mt-0.5">
            {totalActivos}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col">
          <span className="text-[11px] text-[var(--text-secondary)] font-inter">Desactivadas</span>
          <span className="text-xl sm:text-2xl font-bold font-space text-red-400 mt-0.5">
            {totalDesactivados}
          </span>
        </div>
      </div>

      {/* Error state */}
      {isUsersError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-inter flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{(usersError as any)?.response?.data?.message || (usersError as any)?.message || 'Error al cargar los usuarios'}</span>
          </div>
          <button
            onClick={() => refetchUsers()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Reintentar
          </button>
        </div>
      )}

      {/* Users Grid */}
      {isLoadingUsers ? (
        <div className="py-12 text-center text-[var(--text-secondary)] text-xs font-inter">Cargando perfiles...</div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]">
          <Users className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] font-space">No hay usuarios registrados</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 mb-5 font-inter">
            Comienza registrando tu primer atleta o administrador en la plataforma.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            + Registrar primer usuario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((u) => {
            const isCuentaActiva = u.activo !== false;
            return (
              <div
                key={u.id}
                className={`p-5 rounded-2xl bg-[var(--surface)] border transition-all relative flex flex-col justify-between ${
                  !isCuentaActiva
                    ? 'border-red-500/30 opacity-80'
                    : 'border-[var(--border)] hover:border-[var(--accent-primary)]/40'
                }`}
              >
                <div>
                  {/* Fila superior: Avatar + Datos + Badge Estado */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--accent-primary)] flex items-center justify-center font-bold text-base font-space shrink-0">
                        {u.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] font-space truncate">{u.nombre}</h3>
                        <p className="text-xs text-[var(--text-secondary)] font-inter flex items-center gap-1.5 mt-0.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" strokeWidth={1.8} />
                          <span className="truncate">{u.email}</span>
                        </p>
                      </div>
                    </div>

                    {/* Badge de Estado: Activa / Desactivada */}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-space tracking-wide uppercase flex items-center gap-1.5 shrink-0 ${
                      isCuentaActiva
                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isCuentaActiva ? 'bg-[var(--accent-primary)] animate-pulse' : 'bg-red-400'}`} />
                      {isCuentaActiva ? 'Activa' : 'Desactivada'}
                    </span>
                  </div>

                  {/* Fila de Parámetros */}
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
                          className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors cursor-pointer"
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

                    {/* Fecha de Alta */}
                    <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" strokeWidth={1.8} /> Alta:
                      </span>
                      <span className="font-space font-medium tabular-nums">
                        {u.fechaRegistro ? u.fechaRegistro.slice(0, 10) : '2026-10-05'}
                      </span>
                    </div>

                    {/* Último Acceso */}
                    <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--accent-secondary)]" strokeWidth={1.8} /> Último acceso:
                      </span>
                      <span className="font-space font-medium tabular-nums text-[11px]">
                        {u.ultimoAcceso ? u.ultimoAcceso.replace('T', ' ').slice(0, 16) : 'Sin accesos'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones de Tarjeta: Toggle Activar/Desactivar y Eliminar */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    onClick={() => toggleEstadoMutation.mutate(u.id)}
                    disabled={toggleEstadoMutation.isPending}
                    className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold font-inter flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      isCuentaActiva
                        ? 'bg-[var(--bg-primary)] text-amber-400 border border-amber-500/30 hover:bg-amber-500/10'
                        : 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/25'
                    }`}
                  >
                    {isCuentaActiva ? (
                      <>
                        <PowerOff className="w-3.5 h-3.5" />
                        <span>Desactivar cuenta</span>
                      </>
                    ) : (
                      <>
                        <Power className="w-3.5 h-3.5" />
                        <span>Activar cuenta</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setUserToDelete(u)}
                    className="p-2 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 border border-[var(--border)] transition-colors active:scale-95 cursor-pointer"
                    title="Eliminar usuario permanentemente"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Confirmar Eliminación con Advertencia */}
      <Modal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        title="Confirmar eliminación permanente"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1.5">
              <p className="font-semibold text-white">
                ¿Estás seguro de que deseas eliminar la cuenta de {userToDelete?.nombre}?
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Esta acción es <strong className="text-red-400">definitiva e irreversible</strong>. Se borrarán todas sus rutinas, historial de pesajes y progresos registrados.
              </p>
              <p className="text-[11px] text-amber-300 leading-relaxed font-medium">
                💡 Recomendación: Es preferible <strong>Desactivar la cuenta</strong> en lugar de eliminarla para preservar el histórico de métricas deportivas del atleta.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setUserToDelete(null)}
              className="px-4 py-2 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (userToDelete) {
                  deleteUsuarioMutation.mutate(userToDelete.id);
                }
              }}
              disabled={deleteUsuarioMutation.isPending}
              className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleteUsuarioMutation.isPending ? 'Borrando...' : 'Confirmar eliminación'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Registrar Usuario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar nuevo usuario"
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
              placeholder="Ej. Roberto Sánchez"
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
              {...register('email')}
              type="email"
              placeholder="roberto@fitlite.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
            {errors.email && (
              <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Contraseña *
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
            {errors.password && (
              <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{errors.password.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                Peso inicial (kg)
              </label>
              <input
                {...register('pesoActual', {
                  setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
                })}
                type="number"
                step="0.1"
                placeholder="75.5"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter tabular-nums"
              />
              {errors.pesoActual && (
                <p className="text-[11px] text-[var(--accent-error)] mt-1 font-inter">{errors.pesoActual.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                Rol *
              </label>
              <select
                {...register('rol')}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
              >
                <option value="USUARIO">Atleta / Usuario</option>
                <option value="ENTRENADOR">Entrenador</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Objetivo deportivo principal *
            </label>
            <select
              {...register('objetivo')}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            >
              <option value="GANAR_MASA">Ganar masa muscular (Hipertrofia)</option>
              <option value="PERDER_PESO">Perder peso (Déficit)</option>
              <option value="MANTENER">Mantenimiento</option>
              <option value="RESISTENCIA">Resistencia deportiva</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createUsuarioMutation.isPending}
              className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {createUsuarioMutation.isPending ? 'Guardando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Actualizar Peso */}
      <Modal
        isOpen={Boolean(selectedUserForWeight)}
        onClose={() => setSelectedUserForWeight(null)}
        title={`Actualizar peso · ${selectedUserForWeight?.nombre}`}
      >
        <form onSubmit={handleGuardarPeso} className="space-y-4">
          {pesoUpdateError && (
            <div className="p-3 rounded-xl bg-[var(--accent-error)]/10 border border-[var(--accent-error)]/30 text-[var(--accent-error)] text-xs font-inter">
              {pesoUpdateError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Nuevo peso corporal (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              value={pesoInput}
              onChange={(e) => setPesoInput(e.target.value)}
              placeholder="Ej. 74.5"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Notas / Observaciones (opcional)
            </label>
            <input
              type="text"
              value={notasInput}
              onChange={(e) => setNotasInput(e.target.value)}
              placeholder="Ej. Pesaje en ayunas post-ciclo"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setSelectedUserForWeight(null)}
              className="px-4 py-2 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updatePesoMutation.isPending}
              className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {updatePesoMutation.isPending ? 'Guardando...' : 'Guardar registro'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
