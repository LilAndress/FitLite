import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Shield, Calendar, ChevronRight, Save, Loader2,
  CheckCircle2, AlertCircle, Eye, EyeOff, Scale, Dumbbell,
  Heart, Lock, Trash2, X, Info, ChevronDown,
  Activity, AlertTriangle
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { usuariosApi } from '../api/usuarios.api';
import { pesosCorporalesApi } from '../api/pesos.api';
import { Modal } from '../components/Modal';
import { ScrollReveal } from '../components/ScrollReveal';
import type { Usuario, LugarEntrenamiento, PesoCorporalRequest } from '../types';

/* ─────────────── Zod Schemas ─────────────── */

const personalSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email no válido'),
  passwordConfirmacion: z.string().optional(),
});

const fisicoSchema = z.object({
  edad: z.coerce.number().int().min(10, 'Edad mínima: 10 años').max(120, 'Edad máxima: 120 años').optional().nullable(),
  estatura: z.coerce.number().min(50, 'Mínimo 50 cm').max(300, 'Máximo 300 cm').optional().nullable(),
  objetivo: z.enum(['PERDER_PESO', 'GANAR_MASA', 'MANTENER', 'RESISTENCIA'] as const),
  nivelExperiencia: z.enum(['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'] as const).optional().nullable(),
});

const entrenamientoSchema = z.object({
  lugarEntrenamiento: z.enum(['GIMNASIO', 'CASA', 'CALISTENIA_PARQUE'] as const),
  diasDisponiblesSemana: z.coerce.number().min(1, 'Mínimo 1 día').max(7, 'Máximo 7 días'),
  minutosPorSesion: z.coerce.number().min(10, 'Mínimo 10 min').max(240, 'Máximo 240 min'),
  equipamientoDisponible: z.array(z.string()),
});

const saludSchema = z.object({
  zonasMolestia: z.array(z.string()),
  tieneDiscapacidad: z.boolean(),
  detalleDiscapacidad: z.string().optional().nullable(),
  enfermedadesPreexistentes: z.string().optional().nullable(),
  consentimientoIA: z.boolean(),
});

const passwordSchema = z.object({
  passwordActual: z.string().min(1, 'Requerida'),
  passwordNueva: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmarPassword: z.string().min(1, 'Confirma la nueva contraseña'),
}).refine(d => d.passwordNueva === d.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
});

const pesoModalSchema = z.object({
  peso: z.coerce.number().positive('El peso debe ser mayor a 0 kg'),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  notas: z.string().optional(),
});

type PersonalForm = z.infer<typeof personalSchema>;
type FisicoForm = z.infer<typeof fisicoSchema>;
type EntrenamientoForm = z.infer<typeof entrenamientoSchema>;
type SaludForm = z.infer<typeof saludSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type PesoModalForm = z.infer<typeof pesoModalSchema>;

type SectionKey = 'personal' | 'fisico' | 'entrenamiento' | 'salud' | 'seguridad' | 'peligro';

/* ─────────────── Constants ─────────────── */

const SECTIONS: { key: SectionKey; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'personal', label: 'Información personal', icon: User, description: 'Nombre y correo electrónico' },
  { key: 'fisico', label: 'Perfil físico', icon: Activity, description: 'Edad, estatura, objetivo y nivel' },
  { key: 'entrenamiento', label: 'Preferencias de entrenamiento', icon: Dumbbell, description: 'Lugar, días y equipamiento' },
  { key: 'salud', label: 'Salud y privacidad', icon: Heart, description: 'Lesiones, condiciones y consentimiento IA' },
  { key: 'seguridad', label: 'Seguridad', icon: Lock, description: 'Cambio de contraseña' },
  { key: 'peligro', label: 'Zona de peligro', icon: AlertTriangle, description: 'Eliminación de cuenta' },
];

const ZONAS_LESION = [
  'Hombros', 'Cuello', 'Espalda baja', 'Espalda alta', 'Rodillas',
  'Codos', 'Muñecas', 'Caderas', 'Tobillos', 'Pies',
];

const EQUIPAMIENTO = [
  'Mancuernas', 'Barra olímpica', 'Kettlebells', 'Bandas elásticas',
  'Polea', 'Banco ajustable', 'Rack de sentadilla', 'Barra de dominadas',
  'TRX', 'Balón medicinal', 'Cuerda de saltar', 'Rueda abdominal',
];

const OBJETIVO_LABELS: Record<string, string> = {
  PERDER_PESO: 'Perder peso',
  GANAR_MASA: 'Ganar masa muscular',
  MANTENER: 'Mantener forma',
  RESISTENCIA: 'Resistencia',
};

const NIVEL_LABELS: Record<string, string> = {
  PRINCIPIANTE: 'Principiante',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
};

const LUGAR_LABELS: Record<string, string> = {
  GIMNASIO: 'Gimnasio',
  CASA: 'Casa',
  CALISTENIA_PARQUE: 'Parque / Calistenia',
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

/* ─────────────── Toast Component ─────────────── */

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300 font-inter text-sm font-medium ${
      type === 'success'
        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]'
        : 'bg-[var(--accent-error)]/10 border-[var(--accent-error)]/40 text-[var(--accent-error)]'
    }`}>
      {type === 'success'
        ? <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
        : <AlertCircle className="w-4.5 h-4.5 shrink-0" />
      }
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 p-0.5 rounded-full hover:bg-[var(--border)]/40 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/* ─────────────── Password Strength ─────────────── */

function getPasswordStrength(pw: string): { label: string; score: number; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Muy débil', score: 1, color: 'var(--accent-error)' };
  if (score === 2) return { label: 'Débil', score: 2, color: '#FF8A3D' };
  if (score === 3) return { label: 'Aceptable', score: 3, color: '#FFC53D' };
  if (score === 4) return { label: 'Fuerte', score: 4, color: 'var(--accent-primary)' };
  return { label: 'Muy fuerte', score: 5, color: 'var(--accent-primary)' };
}

/* ─────────────── Main Component ─────────────── */

export const PerfilPage: React.FC = () => {
  const { activeUser, setActiveUser, logout, refreshUsers } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<SectionKey>('personal');
  const [mobileOpenSection, setMobileOpenSection] = useState<SectionKey | null>('personal');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [emailChanged, setEmailChanged] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pesoModalOpen, setPesoModalOpen] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [deleteHealthModalOpen, setDeleteHealthModalOpen] = useState(false);

  // Unsaved changes tracking per section
  const [dirtyMap, setDirtyMap] = useState<Record<SectionKey, boolean>>({
    personal: false, fisico: false, entrenamiento: false, salud: false, seguridad: false, peligro: false,
  });

  // ─── Fetch user data ───
  const { data: userData, isLoading } = useQuery({
    queryKey: ['perfil-me'],
    queryFn: () => usuariosApi.getMe(),
    enabled: !!activeUser,
  });

  const user: Usuario | null = userData || activeUser;

  // ─── Navigation guard ───
  useEffect(() => {
    const hasDirty = Object.values(dirtyMap).some(Boolean);
    if (!hasDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtyMap]);

  const confirmLeaveSection = useCallback((nextSection: SectionKey) => {
    if (dirtyMap[activeSection]) {
      if (!window.confirm('Tienes cambios sin guardar. ¿Deseas salir de esta sección?')) return;
      setDirtyMap(m => ({ ...m, [activeSection]: false }));
    }
    setActiveSection(nextSection);
  }, [activeSection, dirtyMap]);

  // ─── PERSONAL FORM ───
  const { register: regPersonal, handleSubmit: submitPersonal, formState: { errors: errPersonal }, reset: resetPersonal, watch: watchPersonal }
    = useForm<PersonalForm>({ resolver: zodResolver(personalSchema) });

  useEffect(() => {
    if (user) {
      resetPersonal({ nombre: user.nombre, email: user.email, passwordConfirmacion: '' });
    }
  }, [user, resetPersonal]);

  const watchedEmail = watchPersonal('email');
  useEffect(() => {
    setEmailChanged(!!user && !!watchedEmail && watchedEmail !== user.email);
  }, [watchedEmail, user]);

  const personalMutation = useMutation({
    mutationFn: (data: PersonalForm) => usuariosApi.updateMe({
      nombre: data.nombre,
      email: data.email,
      passwordConfirmacion: data.passwordConfirmacion || undefined,
    }),
    onSuccess: (updated) => {
      setActiveUser(updated);
      queryClient.invalidateQueries({ queryKey: ['perfil-me'] });
      setToast({ message: 'Información personal actualizada', type: 'success' });
      setDirtyMap(m => ({ ...m, personal: false }));
    },
    onError: (err: any) => {
      setToast({ message: err.response?.data?.message || 'Error al guardar', type: 'error' });
    },
  });

  // ─── FISICO FORM ───
  const { register: regFisico, handleSubmit: submitFisico, formState: { errors: errFisico }, reset: resetFisico }
    = useForm<FisicoForm>({ resolver: zodResolver(fisicoSchema) });

  useEffect(() => {
    if (user) {
      resetFisico({
        edad: user.edad ?? undefined,
        estatura: user.estatura ?? undefined,
        objetivo: user.objetivo,
        nivelExperiencia: user.nivelExperiencia ?? undefined,
      });
    }
  }, [user, resetFisico]);

  const fisicoMutation = useMutation({
    mutationFn: (data: FisicoForm) => usuariosApi.updateMe({
      nombre: user!.nombre,
      email: user!.email,
      objetivo: data.objetivo,
      edad: data.edad ?? undefined,
      estatura: data.estatura ?? undefined,
      nivelExperiencia: data.nivelExperiencia ?? undefined,
    }),
    onSuccess: (updated) => {
      setActiveUser(updated);
      queryClient.invalidateQueries({ queryKey: ['perfil-me'] });
      setToast({ message: 'Perfil físico actualizado', type: 'success' });
      setDirtyMap(m => ({ ...m, fisico: false }));
    },
    onError: (err: any) => {
      setToast({ message: err.response?.data?.message || 'Error al guardar', type: 'error' });
    },
  });

  // ─── ENTRENAMIENTO FORM ───
  const { register: regEntreno, handleSubmit: submitEntreno, formState: { errors: errEntreno }, reset: resetEntreno, control: controlEntreno }
    = useForm<EntrenamientoForm>({ resolver: zodResolver(entrenamientoSchema) });

  useEffect(() => {
    if (user?.perfilSalud) {
      resetEntreno({
        lugarEntrenamiento: user.perfilSalud.lugarEntrenamiento || 'GIMNASIO',
        diasDisponiblesSemana: user.perfilSalud.diasDisponiblesSemana || 3,
        minutosPorSesion: user.perfilSalud.minutosPorSesion || 60,
        equipamientoDisponible: user.perfilSalud.equipamientoDisponible || [],
      });
    }
  }, [user, resetEntreno]);

  const entrenoMutation = useMutation({
    mutationFn: (data: EntrenamientoForm) => usuariosApi.updateMe({
      nombre: user!.nombre,
      email: user!.email,
      perfilSalud: {
        tieneDiscapacidad: user?.perfilSalud?.tieneDiscapacidad ?? false,
        zonasMolestia: user?.perfilSalud?.zonasMolestia ?? [],
        enfermedadesPreexistentes: user?.perfilSalud?.enfermedadesPreexistentes ?? undefined,
        lugarEntrenamiento: data.lugarEntrenamiento as LugarEntrenamiento,
        equipamientoDisponible: data.equipamientoDisponible,
        diasDisponiblesSemana: data.diasDisponiblesSemana,
        minutosPorSesion: data.minutosPorSesion,
      },
    }),
    onSuccess: (updated) => {
      setActiveUser(updated);
      queryClient.invalidateQueries({ queryKey: ['perfil-me'] });
      setToast({ message: 'Preferencias de entrenamiento actualizadas', type: 'success' });
      setDirtyMap(m => ({ ...m, entrenamiento: false }));
    },
    onError: (err: any) => {
      setToast({ message: err.response?.data?.message || 'Error al guardar', type: 'error' });
    },
  });

  // ─── SALUD FORM ───
  const { register: regSalud, handleSubmit: submitSalud, reset: resetSalud, control: controlSalud, watch: watchSalud }
    = useForm<SaludForm>({ resolver: zodResolver(saludSchema) });

  useEffect(() => {
    if (user) {
      resetSalud({
        zonasMolestia: user.perfilSalud?.zonasMolestia ?? [],
        tieneDiscapacidad: user.perfilSalud?.tieneDiscapacidad ?? false,
        detalleDiscapacidad: user.perfilSalud?.detalleDiscapacidad ?? '',
        enfermedadesPreexistentes: user.perfilSalud?.enfermedadesPreexistentes ?? '',
        consentimientoIA: user.consentimientoIA !== false,
      });
    }
  }, [user, resetSalud]);

  const watchConsent = watchSalud('consentimientoIA');

  const saludMutation = useMutation({
    mutationFn: (data: SaludForm) => usuariosApi.updateMe({
      nombre: user!.nombre,
      email: user!.email,
      consentimientoIA: data.consentimientoIA,
      perfilSalud: {
        tieneDiscapacidad: data.tieneDiscapacidad,
        detalleDiscapacidad: data.detalleDiscapacidad ?? undefined,
        zonasMolestia: data.zonasMolestia,
        enfermedadesPreexistentes: data.enfermedadesPreexistentes ?? undefined,
        lugarEntrenamiento: user?.perfilSalud?.lugarEntrenamiento ?? 'GIMNASIO',
        equipamientoDisponible: user?.perfilSalud?.equipamientoDisponible ?? [],
        diasDisponiblesSemana: user?.perfilSalud?.diasDisponiblesSemana ?? 3,
        minutosPorSesion: user?.perfilSalud?.minutosPorSesion ?? 60,
      },
    }),
    onSuccess: (updated) => {
      setActiveUser(updated);
      queryClient.invalidateQueries({ queryKey: ['perfil-me'] });
      setToast({ message: 'Datos de salud actualizados', type: 'success' });
      setDirtyMap(m => ({ ...m, salud: false }));
    },
    onError: (err: any) => {
      setToast({ message: err.response?.data?.message || 'Error al guardar', type: 'error' });
    },
  });

  // ─── PASSWORD FORM ───
  const { register: regPw, handleSubmit: submitPw, formState: { errors: errPw }, reset: resetPw, watch: watchPw }
    = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const newPwValue = watchPw('passwordNueva') || '';
  const pwStrength = getPasswordStrength(newPwValue);

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) => usuariosApi.changePassword({
      passwordActual: data.passwordActual,
      passwordNueva: data.passwordNueva,
    }),
    onSuccess: () => {
      resetPw();
      setToast({ message: 'Contraseña cambiada correctamente', type: 'success' });
      setDirtyMap(m => ({ ...m, seguridad: false }));
    },
    onError: (err: any) => {
      setToast({ message: err.response?.data?.message || 'Error al cambiar contraseña', type: 'error' });
    },
  });

  // ─── DELETE ACCOUNT ───
  const deleteMutation = useMutation({
    mutationFn: (password: string) => usuariosApi.deleteMe(password),
    onSuccess: () => {
      logout();
      navigate('/');
    },
    onError: (err: any) => {
      setDeleteError(err.response?.data?.message || 'Error al eliminar la cuenta');
    },
  });

  // ─── DELETE HEALTH DATA ───
  const deleteHealthMutation = useMutation({
    mutationFn: () => usuariosApi.deleteHealthData(),
    onSuccess: (updated) => {
      setActiveUser(updated);
      queryClient.invalidateQueries({ queryKey: ['perfil-me'] });
      setToast({ message: 'Datos de salud eliminados', type: 'success' });
      setDeleteHealthModalOpen(false);
    },
    onError: (err: any) => {
      setToast({ message: err.response?.data?.message || 'Error al eliminar datos de salud', type: 'error' });
    },
  });

  // ─── PESO MODAL ───
  const { register: regPeso, handleSubmit: submitPeso, formState: { errors: errPeso }, reset: resetPeso }
    = useForm<PesoModalForm>({ resolver: zodResolver(pesoModalSchema), defaultValues: { fecha: getTodayStr() } });

  const pesoCorporalMutation = useMutation({
    mutationFn: (data: PesoModalForm) => {
      const payload: PesoCorporalRequest = {
        peso: data.peso,
        fecha: data.fecha,
        usuarioId: user!.id,
        notas: data.notas || undefined,
      };
      return pesosCorporalesApi.create(payload);
    },
    onSuccess: () => {
      refreshUsers();
      queryClient.invalidateQueries({ queryKey: ['perfil-me'] });
      setPesoModalOpen(false);
      resetPeso({ fecha: getTodayStr() });
      setToast({ message: 'Peso registrado correctamente', type: 'success' });
    },
    onError: (err: any) => {
      setToast({ message: err.response?.data?.message || 'Error al registrar peso', type: 'error' });
    },
  });

  // ─── Helpers ───
  const formatDate = (d?: string | null) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return d; }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!activeUser) return null;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  /* ─────────────── Input Component ─────────────── */

  const inputClass = "w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] font-inter placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--accent-primary)]/60 focus:ring-1 focus:ring-[var(--accent-primary)]/30 transition-all duration-200";
  const labelClass = "block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 font-inter";
  const errorClass = "text-[11px] text-[var(--accent-error)] mt-1 font-inter";
  const selectClass = inputClass;

  const SaveButton: React.FC<{ isPending: boolean; disabled: boolean; onClick?: () => void }> = ({ isPending, disabled, onClick }) => (
    <button
      type="submit"
      disabled={disabled || isPending}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-inter transition-all duration-200 active:scale-95 ${
        disabled || isPending
          ? 'bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed opacity-60'
          : 'bg-[var(--accent-primary)] text-[var(--bg-primary)] hover:brightness-110 shadow-lg shadow-[var(--accent-primary)]/20'
      }`}
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {isPending ? 'Guardando...' : 'Guardar cambios'}
    </button>
  );

  /* ─────────────── Section: Personal ─────────────── */

  const renderPersonal = () => (
    <form
      onSubmit={submitPersonal((data) => personalMutation.mutate(data))}
      onChange={() => setDirtyMap(m => ({ ...m, personal: true }))}
      className="space-y-6"
    >
      <div>
        <label className={labelClass}>Nombre</label>
        <input {...regPersonal('nombre')} className={inputClass} placeholder="Tu nombre completo" />
        {errPersonal.nombre && <p className={errorClass}>{errPersonal.nombre.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Correo electrónico</label>
        <input {...regPersonal('email')} type="email" className={inputClass} placeholder="tu@email.com" />
        {errPersonal.email && <p className={errorClass}>{errPersonal.email.message}</p>}
      </div>

      {emailChanged && (
        <div className="p-4 rounded-xl bg-[var(--accent-secondary)]/5 border border-[var(--accent-secondary)]/30">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[var(--accent-secondary)]" />
            <span className="text-xs font-semibold text-[var(--accent-secondary)] font-inter">Confirmación requerida</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-3 font-inter">Estás cambiando tu correo. Introduce tu contraseña actual para confirmar.</p>
          <input
            {...regPersonal('passwordConfirmacion')}
            type="password"
            className={inputClass}
            placeholder="Contraseña actual"
          />
          {errPersonal.passwordConfirmacion && <p className={errorClass}>{errPersonal.passwordConfirmacion.message}</p>}
        </div>
      )}

      <div className="pt-2">
        <SaveButton isPending={personalMutation.isPending} disabled={!dirtyMap.personal} />
      </div>
    </form>
  );

  /* ─────────────── Section: Fisico ─────────────── */

  const renderFisico = () => (
    <form
      onSubmit={submitFisico((data) => fisicoMutation.mutate(data))}
      onChange={() => setDirtyMap(m => ({ ...m, fisico: true }))}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Edad</label>
          <input {...regFisico('edad')} type="number" className={inputClass} placeholder="Ej: 25" />
          {errFisico.edad && <p className={errorClass}>{errFisico.edad.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Estatura (cm)</label>
          <input {...regFisico('estatura')} type="number" step="0.1" className={inputClass} placeholder="Ej: 175" />
          {errFisico.estatura && <p className={errorClass}>{errFisico.estatura.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Objetivo físico</label>
        <select {...regFisico('objetivo')} className={selectClass}>
          {Object.entries(OBJETIVO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {errFisico.objetivo && <p className={errorClass}>{errFisico.objetivo.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Nivel de experiencia</label>
        <select {...regFisico('nivelExperiencia')} className={selectClass}>
          <option value="">Sin especificar</option>
          {Object.entries(NIVEL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Peso actual read-only */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-inter">Peso actual</p>
              <p className="text-lg font-bold text-[var(--text-primary)] font-space tabular-nums">
                {user?.pesoActual ? `${user.pesoActual} kg` : 'Sin registrar'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetPeso({ peso: undefined as any, fecha: getTodayStr(), notas: '' });
              setPesoModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-semibold border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/20 transition-all active:scale-95 font-inter"
          >
            <Scale className="w-3.5 h-3.5" />
            Registrar nuevo peso
          </button>
        </div>
      </div>

      <div className="pt-2">
        <SaveButton isPending={fisicoMutation.isPending} disabled={!dirtyMap.fisico} />
      </div>
    </form>
  );

  /* ─────────────── Section: Entrenamiento ─────────────── */

  const renderEntrenamiento = () => (
    <form
      onSubmit={submitEntreno((data) => entrenoMutation.mutate(data))}
      onChange={() => setDirtyMap(m => ({ ...m, entrenamiento: true }))}
      className="space-y-6"
    >
      <p className="text-xs text-[var(--text-secondary)] font-inter bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 rounded-xl px-4 py-3 flex items-center gap-2">
        <Info className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
        Estos datos se usan para generar tus rutinas personalizadas.
      </p>

      <div>
        <label className={labelClass}>Lugar de entrenamiento</label>
        <select {...regEntreno('lugarEntrenamiento')} className={selectClass}>
          {Object.entries(LUGAR_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Días por semana</label>
          <input {...regEntreno('diasDisponiblesSemana')} type="number" min="1" max="7" className={inputClass} />
          {errEntreno.diasDisponiblesSemana && <p className={errorClass}>{errEntreno.diasDisponiblesSemana.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Minutos por sesión</label>
          <input {...regEntreno('minutosPorSesion')} type="number" min="10" max="240" className={inputClass} />
          {errEntreno.minutosPorSesion && <p className={errorClass}>{errEntreno.minutosPorSesion.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Equipo disponible</label>
        <Controller
          name="equipamientoDisponible"
          control={controlEntreno}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2 mt-1">
              {EQUIPAMIENTO.map(eq => {
                const selected = field.value?.includes(eq);
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => {
                      const next = selected
                        ? field.value.filter((e: string) => e !== eq)
                        : [...(field.value || []), eq];
                      field.onChange(next);
                      setDirtyMap(m => ({ ...m, entrenamiento: true }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium font-inter border transition-all duration-200 active:scale-95 ${
                      selected
                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/40'
                        : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-secondary)]'
                    }`}
                  >
                    {eq}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="pt-2">
        <SaveButton isPending={entrenoMutation.isPending} disabled={!dirtyMap.entrenamiento} />
      </div>
    </form>
  );

  /* ─────────────── Section: Salud ─────────────── */

  const renderSalud = () => (
    <form
      onSubmit={submitSalud((data) => saludMutation.mutate(data))}
      onChange={() => setDirtyMap(m => ({ ...m, salud: true }))}
      className="space-y-6"
    >
      {/* Zonas de molestia (chips) */}
      <div>
        <label className={labelClass}>Lesiones o zonas a proteger</label>
        <Controller
          name="zonasMolestia"
          control={controlSalud}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2 mt-1">
              {ZONAS_LESION.map(zona => {
                const selected = field.value?.includes(zona);
                return (
                  <button
                    key={zona}
                    type="button"
                    onClick={() => {
                      const next = selected
                        ? field.value.filter((z: string) => z !== zona)
                        : [...(field.value || []), zona];
                      field.onChange(next);
                      setDirtyMap(m => ({ ...m, salud: true }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium font-inter border transition-all duration-200 active:scale-95 ${
                      selected
                        ? 'bg-[var(--accent-error)]/15 text-[var(--accent-error)] border-[var(--accent-error)]/40'
                        : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-secondary)]'
                    }`}
                  >
                    {zona}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Discapacidad toggle */}
      <div>
        <Controller
          name="tieneDiscapacidad"
          control={controlSalud}
          render={({ field }) => (
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                field.value ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border)]'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  field.value ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
              <span className="text-sm text-[var(--text-primary)] font-inter">Tengo una discapacidad o limitación física</span>
              <input
                type="checkbox"
                className="sr-only"
                checked={!!field.value}
                onChange={(e) => {
                  field.onChange(e.target.checked);
                  setDirtyMap(m => ({ ...m, salud: true }));
                }}
              />
            </label>
          )}
        />
      </div>

      {watchSalud('tieneDiscapacidad') && (
        <div>
          <label className={labelClass}>Detalle de la discapacidad o limitación</label>
          <textarea
            {...regSalud('detalleDiscapacidad')}
            rows={3}
            className={inputClass}
            placeholder="Describe brevemente tu condición..."
          />
        </div>
      )}

      {/* Enfermedades */}
      <div>
        <label className={labelClass}>Condiciones de salud relevantes</label>
        <textarea
          {...regSalud('enfermedadesPreexistentes')}
          rows={3}
          className={inputClass}
          placeholder="Ej: hipertensión, diabetes tipo 2, asma..."
        />
      </div>

      {/* Consent IA */}
      <div className={`p-4 rounded-xl border transition-all duration-300 ${
        watchConsent
          ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30'
          : 'bg-[var(--accent-error)]/5 border-[var(--accent-error)]/30'
      }`}>
        <Controller
          name="consentimientoIA"
          control={controlSalud}
          render={({ field }) => (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!field.value}
                onChange={(e) => {
                  field.onChange(e.target.checked);
                  setDirtyMap(m => ({ ...m, salud: true }));
                }}
                className="mt-0.5 w-4 h-4 rounded border-2 border-[var(--border)] accent-[var(--accent-primary)] cursor-pointer"
              />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] font-inter">
                  Autorizo a FitLite a usar mis datos de salud para personalizar las recomendaciones de IA
                </p>
                {!field.value && (
                  <p className="text-xs text-[var(--accent-error)] mt-1 font-inter flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    La IA dejará de usar tus datos de salud para personalizar rutinas y recomendaciones.
                  </p>
                )}
              </div>
            </label>
          )}
        />
      </div>

      {/* Medical disclaimer */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-start gap-3">
        <Info className="w-4 h-4 text-[var(--text-secondary)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-secondary)] font-inter leading-relaxed">
          FitLite no da consejo médico. Si tienes una condición, consulta a un profesional antes de entrenar.
        </p>
      </div>

      <div className="flex items-center gap-4 pt-2 flex-wrap">
        <SaveButton isPending={saludMutation.isPending} disabled={!dirtyMap.salud} />
        <button
          type="button"
          onClick={() => setDeleteHealthModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--accent-error)] border border-[var(--accent-error)]/40 hover:bg-[var(--accent-error)]/10 transition-all active:scale-95 font-inter"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Borrar mis datos de salud
        </button>
      </div>
    </form>
  );

  /* ─────────────── Section: Seguridad ─────────────── */

  const renderSeguridad = () => (
    <form
      onSubmit={submitPw((data) => passwordMutation.mutate(data))}
      onChange={() => setDirtyMap(m => ({ ...m, seguridad: true }))}
      className="space-y-6"
    >
      <div>
        <label className={labelClass}>Contraseña actual</label>
        <div className="relative">
          <input
            {...regPw('passwordActual')}
            type={showCurrentPw ? 'text' : 'password'}
            className={inputClass}
            placeholder="••••••••"
          />
          <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errPw.passwordActual && <p className={errorClass}>{errPw.passwordActual.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Nueva contraseña</label>
        <div className="relative">
          <input
            {...regPw('passwordNueva')}
            type={showNewPw ? 'text' : 'password'}
            className={inputClass}
            placeholder="Mínimo 8 caracteres"
          />
          <button type="button" onClick={() => setShowNewPw(!showNewPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errPw.passwordNueva && <p className={errorClass}>{errPw.passwordNueva.message}</p>}

        {/* Password strength indicator */}
        {newPwValue.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i <= pwStrength.score ? pwStrength.color : 'var(--border)',
                  }}
                />
              ))}
            </div>
            <p className="text-[11px] font-inter font-medium" style={{ color: pwStrength.color }}>
              {pwStrength.label}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Confirmar nueva contraseña</label>
        <div className="relative">
          <input
            {...regPw('confirmarPassword')}
            type={showConfirmPw ? 'text' : 'password'}
            className={inputClass}
            placeholder="Repite la nueva contraseña"
          />
          <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errPw.confirmarPassword && <p className={errorClass}>{errPw.confirmarPassword.message}</p>}
      </div>

      <div className="pt-2">
        <SaveButton isPending={passwordMutation.isPending} disabled={!dirtyMap.seguridad} />
      </div>
    </form>
  );

  /* ─────────────── Section: Zona de peligro ─────────────── */

  const renderPeligro = () => (
    <div className="space-y-6">
      <div className="p-5 rounded-xl border-2 border-[var(--accent-error)]/40 bg-[var(--accent-error)]/5">
        <h4 className="text-sm font-bold text-[var(--accent-error)] font-space mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Eliminar cuenta permanentemente
        </h4>
        <p className="text-xs text-[var(--text-secondary)] font-inter leading-relaxed mb-4">
          Esta acción es irreversible. Se borrarán todas tus rutinas, historial de progreso y datos de salud de forma permanente.
        </p>
        <button
          type="button"
          onClick={() => { setDeleteModalOpen(true); setDeletePassword(''); setDeleteError(null); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--accent-error)] border-2 border-[var(--accent-error)]/50 hover:bg-[var(--accent-error)]/10 transition-all active:scale-95 font-inter"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar mi cuenta
        </button>
      </div>
    </div>
  );

  const sectionRenderers: Record<SectionKey, () => React.ReactNode> = {
    personal: renderPersonal,
    fisico: renderFisico,
    entrenamiento: renderEntrenamiento,
    salud: renderSalud,
    seguridad: renderSeguridad,
    peligro: renderPeligro,
  };

  /* ─────────────── RENDER ─────────────── */

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <ScrollReveal>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold font-space tracking-tight text-[var(--text-primary)]">
              Mi perfil
            </h1>
            <p className="text-sm text-[var(--text-secondary)] font-inter mt-1">
              Gestiona tu información personal, preferencias y seguridad
            </p>
          </div>
        </ScrollReveal>

        {/* ─── Desktop: Two columns ─── */}
        <div className="hidden lg:grid lg:grid-cols-[320px_1fr] gap-8">

          {/* Left Column: Identity Card + Nav */}
          <div className="space-y-5">
            <ScrollReveal delay={100}>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sticky top-24">
                {/* Avatar */}
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 border-2 border-[var(--accent-primary)]/30 flex items-center justify-center mb-3 shadow-lg shadow-[var(--accent-primary)]/10">
                    <span className="text-2xl font-bold text-[var(--accent-primary)] font-space">
                      {getInitials(user?.nombre || 'U')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] font-space tracking-tight">{user?.nombre}</h2>
                  <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">{user?.email}</p>

                  {/* Role badge (no editable) */}
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-space">
                    {user?.rol === 'ADMIN' ? 'Administrador' : user?.rol === 'ENTRENADOR' ? 'Entrenador' : 'Atleta'}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] font-inter">
                    <Calendar className="w-3.5 h-3.5" />
                    Miembro desde {formatDate(user?.fechaRegistro)}
                  </div>
                </div>

                {/* Section nav */}
                <nav className="space-y-1 border-t border-[var(--border)] pt-4">
                  {SECTIONS.map(s => {
                    const Icon = s.icon;
                    const isActive = activeSection === s.key;
                    const isDirty = dirtyMap[s.key];
                    return (
                      <button
                        key={s.key}
                        onClick={() => confirmLeaveSection(s.key)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                          isActive
                            ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'
                            : 'hover:bg-[var(--bg-primary)] border border-transparent'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate font-inter ${
                            isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                          }`}>
                            {s.label}
                            {isDirty && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-secondary)]" />}
                          </p>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-all ${
                          isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]/50 group-hover:text-[var(--text-secondary)]'
                        }`} />
                      </button>
                    );
                  })}
                </nav>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Active section */}
          <ScrollReveal delay={200}>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
                {(() => {
                  const s = SECTIONS.find(s => s.key === activeSection)!;
                  const Icon = s.icon;
                  return (
                    <>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        activeSection === 'peligro'
                          ? 'bg-[var(--accent-error)]/10'
                          : 'bg-[var(--accent-primary)]/10'
                      }`}>
                        <Icon className={`w-4.5 h-4.5 ${
                          activeSection === 'peligro' ? 'text-[var(--accent-error)]' : 'text-[var(--accent-primary)]'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[var(--text-primary)] font-space tracking-tight">{s.label}</h3>
                        <p className="text-xs text-[var(--text-secondary)] font-inter">{s.description}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              {sectionRenderers[activeSection]()}
            </div>
          </ScrollReveal>
        </div>

        {/* ─── Mobile: Accordion ─── */}
        <div className="lg:hidden space-y-3">
          {/* Mobile Identity Card */}
          <ScrollReveal>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 border-2 border-[var(--accent-primary)]/30 flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/10">
                  <span className="text-lg font-bold text-[var(--accent-primary)] font-space">
                    {getInitials(user?.nombre || 'U')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-[var(--text-primary)] font-space tracking-tight truncate">{user?.nombre}</h2>
                  <p className="text-xs text-[var(--text-secondary)] font-inter truncate">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-space">
                      {user?.rol === 'ADMIN' ? 'Admin' : user?.rol === 'ENTRENADOR' ? 'Entrenador' : 'Atleta'}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-inter flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(user?.fechaRegistro)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Accordion sections */}
          {SECTIONS.map((s, idx) => {
            const Icon = s.icon;
            const isOpen = mobileOpenSection === s.key;
            const isDirty = dirtyMap[s.key];
            return (
              <ScrollReveal key={s.key} delay={idx * 50}>
                <div className={`bg-[var(--surface)] border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen ? 'border-[var(--accent-primary)]/30' : 'border-[var(--border)]'
                }`}>
                  <button
                    onClick={() => {
                      if (isOpen) {
                        setMobileOpenSection(null);
                      } else {
                        if (mobileOpenSection && dirtyMap[mobileOpenSection]) {
                          if (!window.confirm('Tienes cambios sin guardar. ¿Deseas cambiar de sección?')) return;
                          setDirtyMap(m => ({ ...m, [mobileOpenSection]: false }));
                        }
                        setMobileOpenSection(s.key);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      s.key === 'peligro' ? 'bg-[var(--accent-error)]/10' : 'bg-[var(--accent-primary)]/10'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        s.key === 'peligro' ? 'text-[var(--accent-error)]' : 'text-[var(--accent-primary)]'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] font-inter truncate">
                        {s.label}
                        {isDirty && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-secondary)]" />}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] font-inter">{s.description}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 border-t border-[var(--border)]">
                      <div className="pt-5">
                        {sectionRenderers[s.key]()}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>

      {/* ─── Peso Modal ─── */}
      <Modal
        isOpen={pesoModalOpen}
        onClose={() => setPesoModalOpen(false)}
        title="Registrar pesaje corporal"
      >
        <form onSubmit={submitPeso((data) => pesoCorporalMutation.mutate(data))} className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)] font-inter">
            Registra una nueva medición de peso. Se actualizará en tu perfil y quedará en el historial.
          </p>
          <div>
            <label className={labelClass}>Peso corporal (kg) *</label>
            <input {...regPeso('peso')} type="number" step="0.1" className={inputClass} placeholder="Ej: 75.5" />
            {errPeso.peso && <p className={errorClass}>{errPeso.peso.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Fecha *</label>
            <input {...regPeso('fecha')} type="date" className={inputClass} />
            {errPeso.fecha && <p className={errorClass}>{errPeso.fecha.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Notas (opcional)</label>
            <input {...regPeso('notas')} className={inputClass} placeholder="Ej: En ayunas, después de entrenar..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPesoModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors font-inter"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pesoCorporalMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-[var(--bg-primary)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 font-inter"
            >
              {pesoCorporalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
              {pesoCorporalMutation.isPending ? 'Registrando...' : 'Registrar pesaje'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Delete Account Modal ─── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar cuenta"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--accent-error)]/5 border border-[var(--accent-error)]/30">
            <p className="text-xs font-semibold text-[var(--accent-error)] mb-2 font-inter flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Esta acción es irreversible
            </p>
            <ul className="text-xs text-[var(--text-secondary)] font-inter space-y-1.5 ml-5">
              <li className="list-disc">Todas tus <strong className="text-[var(--text-primary)]">rutinas</strong> serán eliminadas</li>
              <li className="list-disc">Tu <strong className="text-[var(--text-primary)]">historial de progreso</strong> se perderá</li>
              <li className="list-disc">Tus <strong className="text-[var(--text-primary)]">datos de salud</strong> serán borrados</li>
            </ul>
          </div>

          {deleteError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--accent-error)]/10 border border-[var(--accent-error)]/30">
              <AlertCircle className="w-4 h-4 text-[var(--accent-error)] shrink-0" />
              <span className="text-xs text-[var(--accent-error)] font-inter">{deleteError}</span>
            </div>
          )}

          <div>
            <label className={labelClass}>Escribe tu contraseña para confirmar</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={inputClass}
              placeholder="Tu contraseña actual"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors font-inter"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!deletePassword || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletePassword)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--accent-error)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 font-inter"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar mi cuenta'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Delete Health Data Modal ─── */}
      <Modal
        isOpen={deleteHealthModalOpen}
        onClose={() => setDeleteHealthModalOpen(false)}
        title="Borrar datos de salud"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)] font-inter leading-relaxed">
            Se eliminarán tus lesiones registradas, datos de discapacidad y condiciones de salud.
            También se desactivará el uso de estos datos por parte de la IA.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteHealthModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors font-inter"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleteHealthMutation.isPending}
              onClick={() => deleteHealthMutation.mutate()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--accent-error)] border border-[var(--accent-error)]/40 hover:bg-[var(--accent-error)]/10 active:scale-95 transition-all disabled:opacity-60 font-inter"
            >
              {deleteHealthMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleteHealthMutation.isPending ? 'Borrando...' : 'Confirmar borrado'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Toast ─── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
