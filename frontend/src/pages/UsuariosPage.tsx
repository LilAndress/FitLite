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
  Calendar
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { usuariosApi } from '../api/usuarios.api';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';

const usuarioSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
  objetivo: z.enum(['PERDER_PESO', 'GANAR_MASA', 'MANTENER', 'RESISTENCIA'] as const),
  rol: z.enum(['USUARIO', 'ENTRENADOR', 'ADMIN'] as const),
});

type UsuarioFormValues = z.infer<typeof usuarioSchema>;

export const UsuariosPage: React.FC = () => {
  const { users, activeUser, setActiveUser, refreshUsers, isLoadingUsers } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
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

  const deleteUsuarioMutation = useMutation({
    mutationFn: (id: number) => usuariosApi.delete(id),
    onSuccess: async () => {
      await refreshUsers();
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit'] flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Gestión de Usuarios
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administra los perfiles de usuario, objetivos físicos y roles en FitLite.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-500/20 text-xs transition-all hover:scale-105"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Usuario
        </button>
      </div>

      {/* Users Grid */}
      {isLoadingUsers ? (
        <div className="py-12 text-center text-slate-400 text-xs">Cargando usuarios...</div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No hay usuarios registrados</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Crea tu primer usuario para empezar a asignar rutinas y registrar entrenamientos.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20"
          >
            + Registrar Usuario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => {
            const isActive = activeUser?.id === u.id;
            return (
              <div
                key={u.id}
                className={`p-5 rounded-2xl bg-slate-900/80 border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isActive
                    ? 'border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-950/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-bl-lg tracking-wider">
                    Activo
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-base text-emerald-400">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-['Outfit']">{u.nombre}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {u.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 py-3 border-y border-slate-800/80 my-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-purple-400" /> Objetivo:
                      </span>
                      <Badge type="objetivo" value={u.objetivo} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Rol:
                      </span>
                      <Badge type="rol" value={u.rol} />
                    </div>
                    {u.fechaRegistro && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Registrado:
                        </span>
                        <span>{u.fechaRegistro.slice(0, 10)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setActiveUser(u)}
                    disabled={isActive}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isActive
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 cursor-default'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {isActive ? 'Seleccionado' : 'Usar Perfil'}
                  </button>

                  <button
                    onClick={() => deleteUsuarioMutation.mutate(u.id)}
                    className="p-2 rounded-xl bg-slate-800/60 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-700/60 transition-colors"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
        title="Crear Nuevo Usuario"
      >
        <form onSubmit={handleSubmit((data) => createUsuarioMutation.mutate(data))} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
            <input
              {...register('nombre')}
              placeholder="Ej. Juan Pérez"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {errors.nombre && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
            <input
              type="email"
              {...register('email')}
              placeholder="juan@ejemplo.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {errors.email && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña *</label>
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {errors.password && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Objetivo Físico *</label>
              <select
                {...register('objetivo')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="GANAR_MASA">Ganar Masa</option>
                <option value="PERDER_PESO">Perder Peso</option>
                <option value="MANTENER">Mantener</option>
                <option value="RESISTENCIA">Resistencia</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rol *</label>
              <select
                {...register('rol')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="USUARIO">Usuario</option>
                <option value="ENTRENADOR">Entrenador</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createUsuarioMutation.isPending}
              className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              {createUsuarioMutation.isPending ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
