import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  Dumbbell, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Scale,
  Ruler,
  Calendar,
  Zap,
  Sparkles,
  ShieldCheck,
  Building2,
  Home,
  Trees,
  HeartPulse,
  Activity,
  Check,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { authApi } from '../api/auth.api';
import type { ObjetivoFisico, NivelExperiencia, LugarEntrenamiento } from '../types';

const EQUIPAMIENTOS_LIST = [
  { id: 'PESO_CORPORAL', label: 'Peso Corporal' },
  { id: 'MANCUERNAS', label: 'Mancuernas' },
  { id: 'BANDAS_RESISTENCIA', label: 'Bandas Elásticas' },
  { id: 'BARRA_Y_DISCOS', label: 'Barra y Discos' },
  { id: 'MAQUINAS_GYM', label: 'Máquinas de Gimnasio' },
];

const ZONAS_MOLESTIA_LIST = [
  { id: 'NINGUNA', label: 'Sin molestias articulares' },
  { id: 'RODILLAS', label: 'Rodillas' },
  { id: 'LUMBARES', label: 'Espalda Baja / Lumbares' },
  { id: 'HOMBROS', label: 'Hombros / Manguito' },
  { id: 'CUELLO', label: 'Cuello / Cervicales' },
  { id: 'MUNECAS', label: 'Muñecas' },
  { id: 'TOBILLOS', label: 'Tobillos' },
];

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setActiveUser, refreshUsers } = useUser();

  // Mode: if on /registro, mode is 'registro'; if on /login, mode is 'login'
  const isRegisterRoute = location.pathname === '/registro' || searchParams.get('mode') === 'registro';
  const mode = isRegisterRoute ? 'registro' : 'login';
  const setMode = (newMode: 'login' | 'registro') => {
    if (newMode === 'registro') {
      navigate('/registro');
    } else {
      navigate('/login');
    }
    setError(null);
    setForgotSent(false);
  };

  // Step for multi-step registration (1, 2 or 3)
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Step 1: Account inputs
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Register Step 2: Physical baseline inputs
  const [regEdad, setRegEdad] = useState<string>('26');
  const [regEstatura, setRegEstatura] = useState<string>('175');
  const [regPeso, setRegPeso] = useState<string>('74.5');
  const [regNivel, setRegNivel] = useState<NivelExperiencia>('INTERMEDIO');
  const [regObjetivo, setRegObjetivo] = useState<ObjetivoFisico>('GANAR_MASA');

  // Register Step 3: Health, Equipment & AI Context inputs
  const [regLugar, setRegLugar] = useState<LugarEntrenamiento>('GIMNASIO');
  const [regDiasSemana, setRegDiasSemana] = useState<number>(4);
  const [regMinutosSesion, setRegMinutosSesion] = useState<number>(60);
  const [regEquipamiento, setRegEquipamiento] = useState<string[]>(['MANCUERNAS', 'MAQUINAS_GYM']);
  const [regMolestias, setRegMolestias] = useState<string[]>(['NINGUNA']);
  const [regTieneDiscapacidad, setRegTieneDiscapacidad] = useState<boolean>(false);
  const [regDetalleDiscapacidad, setRegDetalleDiscapacidad] = useState<string>('');
  const [regEnfermedades, setRegEnfermedades] = useState<string>('');

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Toggle helpers for Step 3
  const toggleMolestia = (id: string) => {
    setError(null);
    if (id === 'NINGUNA') {
      setRegMolestias(['NINGUNA']);
      return;
    }
    setRegMolestias((prev) => {
      const sinNinguna = prev.filter((m) => m !== 'NINGUNA');
      if (sinNinguna.includes(id)) {
        const next = sinNinguna.filter((m) => m !== id);
        return next.length === 0 ? ['NINGUNA'] : next;
      } else {
        return [...sinNinguna, id];
      }
    });
  };

  const toggleEquipamiento = (id: string) => {
    setError(null);
    setRegEquipamiento((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((e) => e !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ email: loginEmail.trim(), password: loginPassword }),
    onSuccess: async (usuario) => {
      setActiveUser(usuario);
      await refreshUsers();
      navigate('/dashboard');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      setError(msg);
    },
  });

  // Registro Mutation (Includes Step 2 + Step 3 Health Profile for AI)
  const registroMutation = useMutation({
    mutationFn: () => {
      const edadNum = parseInt(regEdad, 10);
      const estaturaNum = parseFloat(regEstatura);
      const pesoNum = parseFloat(regPeso);

      return authApi.registro({
        nombre: regNombre.trim(),
        email: regEmail.trim(),
        password: regPassword,
        edad: isNaN(edadNum) ? 25 : edadNum,
        estatura: isNaN(estaturaNum) ? 175 : estaturaNum,
        pesoActual: isNaN(pesoNum) ? 70 : pesoNum,
        nivelExperiencia: regNivel,
        objetivo: regObjetivo,
        perfilSalud: {
          tieneDiscapacidad: regTieneDiscapacidad,
          detalleDiscapacidad: regTieneDiscapacidad ? regDetalleDiscapacidad.trim() : undefined,
          zonasMolestia: regMolestias.includes('NINGUNA') ? [] : regMolestias,
          enfermedadesPreexistentes: regEnfermedades.trim() || undefined,
          lugarEntrenamiento: regLugar,
          equipamientoDisponible: regEquipamiento,
          diasDisponiblesSemana: regDiasSemana,
          minutosPorSesion: regMinutosSesion,
        },
      });
    },
    onSuccess: async (newUser) => {
      setActiveUser(newUser);
      await refreshUsers();
      navigate('/dashboard');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Error al crear la cuenta. Verifica que el correo no esté duplicado.';
      setError(msg);
    },
  });

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail.trim() || !loginPassword) {
      setError('Por favor completa todos los campos.');
      return;
    }
    loginMutation.mutate();
  };

  // Validate Step 1 before moving to Step 2
  const handleNextStep = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError(null);

    const cleanNombre = regNombre.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanNombre) {
      setError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (cleanNombre.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (!cleanEmail) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Por favor ingresa un correo electrónico válido (ej. atleta@fitlite.com).');
      return;
    }
    if (!regPassword) {
      setError('Por favor ingresa una contraseña.');
      return;
    }
    if (regPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (!regConfirmPassword) {
      setError('Por favor confirma tu contraseña.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Las contraseñas no coinciden. Asegúrate de que sean idénticas.');
      return;
    }

    setRegStep(2);
  };

  // Validate Step 2 before moving to Step 3
  const handleNextStep2 = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError(null);

    const edadNum = parseInt(regEdad, 10);
    const estaturaNum = parseFloat(regEstatura);
    const pesoNum = parseFloat(regPeso);

    if (isNaN(edadNum) || edadNum <= 0) {
      setError('Por favor ingresa una edad válida.');
      return;
    }
    if (isNaN(estaturaNum) || estaturaNum <= 0) {
      setError('Por favor ingresa una estatura válida en centímetros.');
      return;
    }
    if (isNaN(pesoNum) || pesoNum <= 0) {
      setError('Por favor ingresa un peso corporal válido en kilogramos.');
      return;
    }

    setRegStep(3);
  };

  // Handle Register Final Submit (from Step 3)
  const handleRegistroSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError(null);

    if (regTieneDiscapacidad && !regDetalleDiscapacidad.trim()) {
      setError('Por favor describe brevemente tu condición para que el modelo de IA adapte los ejercicios.');
      return;
    }

    if (regEquipamiento.length === 0) {
      setError('Por favor selecciona al menos un tipo de equipamiento disponible.');
      return;
    }

    registroMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0D1117] text-[var(--text-primary)]">
      {/* ============================================================== */}
      {/* COLUMNA IZQUIERDA: FORMULARIO (~55% DEL ANCHO)                 */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[55%] bg-[#0D1117] flex flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-screen overflow-y-auto">
        {/* Top Header Logo */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Dumbbell className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight font-space text-[var(--text-primary)]">
                Fit<span className="text-[var(--accent-primary)]">Lite</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-space">
                Pro
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors font-inter"
          >
            ← Volver al portal
          </Link>
        </div>

        {/* Form Container */}
        <div className="my-auto py-8 max-w-md w-full mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[var(--accent-error)]/10 border border-[var(--accent-error)]/30 text-[var(--accent-error)] text-xs flex items-start gap-3 font-inter animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================== */}
          {/* VISTA 1: LOGIN                                             */}
          {/* ========================================================== */}
          {mode === 'login' ? (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-space tracking-tight">
                  Iniciar sesión
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-inter mt-1.5">
                  Accede a tu centro de mando deportivo y sobrecarga progresiva.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="atleta@fitlite.com"
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)] font-inter">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[11px] text-[var(--accent-primary)] hover:underline font-inter"
                    >
                      Olvidé mi contraseña
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full py-3 px-6 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-semibold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter shadow-md"
                  >
                    {loginMutation.isPending ? 'Validando credenciales...' : 'Iniciar sesión'}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-[var(--border)] text-center text-xs text-[var(--text-secondary)] font-inter">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('registro');
                    setRegStep(1);
                  }}
                  className="font-semibold text-[var(--accent-primary)] hover:underline"
                >
                  Regístrate
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* VISTA 2: REGISTRO MULTI-PASO EN 2 PASOS                   */
            /* ========================================================== */
            <div>
              {/* Indicador de Progreso en 3 pasos */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-space mb-2">
                  <span className="font-semibold text-[var(--accent-primary)]">
                    Paso {regStep} de 3
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    {regStep === 1 
                      ? 'Credenciales de cuenta' 
                      : regStep === 2 
                        ? 'Baseline físico' 
                        : 'Salud, equipo y motor IA'}
                  </span>
                </div>
                {/* Barra de progreso */}
                <div className="w-full h-1.5 bg-[var(--surface)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div
                    className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                    style={{ width: regStep === 1 ? '33.3%' : regStep === 2 ? '66.6%' : '100%' }}
                  />
                </div>
              </div>

              {regStep === 1 ? (
                /* PASO 1 — CUENTA */
                <form 
                  noValidate 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleNextStep();
                  }} 
                  className="space-y-4"
                >
                  <div className="mb-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-space tracking-tight">
                      Crea tu cuenta
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
                      Paso 1: Define tus datos de acceso a FitLite.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                      Nombre completo *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regNombre}
                        onChange={(e) => {
                          setRegNombre(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Ej. Roberto Sánchez"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                      Correo electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="roberto@fitlite.com"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Mínimo 4 caracteres"
                        required
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {regPassword.length > 0 && regPassword.length < 4 && (
                      <p className="text-[11px] text-amber-400 mt-1 font-inter flex items-center gap-1 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Mínimo 4 caracteres (llevas {regPassword.length})</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                      Confirmar contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => {
                          setRegConfirmPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Repite tu contraseña"
                        required
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] font-inter transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {regConfirmPassword.length > 0 && (
                      <p className={`text-[11px] mt-1 font-inter flex items-center gap-1 animate-fadeIn ${
                        regPassword === regConfirmPassword ? 'text-[var(--accent-primary)] font-medium' : 'text-red-400'
                      }`}>
                        {regPassword === regConfirmPassword ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Las contraseñas coinciden</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Las contraseñas no coinciden</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Banner de error visible directamente sobre el botón */}
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 font-inter animate-fadeIn shadow-sm">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleNextStep()}
                      className="w-full py-3.5 px-6 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-bold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter flex items-center justify-center gap-2 shadow-md hover:shadow-[0_0_20px_rgba(183,255,59,0.35)] cursor-pointer"
                    >
                      <span>Continuar al perfil físico</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : regStep === 2 ? (
                /* PASO 2 — PERFIL FÍSICO (BASELINE PARA EL MOTOR DE IA) */
                <form 
                  noValidate 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleNextStep2();
                  }} 
                  className="space-y-4 animate-fadeIn"
                >
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/40 font-inter">
                        Calibración IA
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-space tracking-tight">
                      Perfil físico inicial
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
                      Paso 2: Parámetros antropométricos para calibrar tus cargas con IA.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[var(--accent-primary)]" />
                        Edad *
                      </label>
                      <input
                        type="number"
                        min="14"
                        max="100"
                        value={regEdad}
                        onChange={(e) => {
                          setRegEdad(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="26"
                        required
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1.5 flex items-center gap-1">
                        <Ruler className="w-3 h-3 text-[var(--accent-primary)]" />
                        Estatura (cm) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="100"
                        max="250"
                        value={regEstatura}
                        onChange={(e) => {
                          setRegEstatura(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="175"
                        required
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1.5 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-[var(--accent-primary)]" />
                        Peso (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="30"
                        max="300"
                        value={regPeso}
                        onChange={(e) => {
                          setRegPeso(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="74.5"
                        required
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-space font-medium text-center focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                      Nivel de experiencia deportiva *
                    </label>
                    <select
                      value={regNivel}
                      onChange={(e) => setRegNivel(e.target.value as NivelExperiencia)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
                    >
                      <option value="PRINCIPIANTE">Principiante (0 - 6 meses de entrenamiento)</option>
                      <option value="INTERMEDIO">Intermedio (6 meses - 2 años)</option>
                      <option value="AVANZADO">Avanzado (+2 años con técnica consolidada)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                      Objetivo físico primordial *
                    </label>
                    <select
                      value={regObjetivo}
                      onChange={(e) => setRegObjetivo(e.target.value as ObjetivoFisico)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
                    >
                      <option value="GANAR_MASA">Ganar masa muscular (Hipertrofia)</option>
                      <option value="PERDER_PESO">Perder peso (Déficit y definición)</option>
                      <option value="MANTENER">Mantener composición corporal</option>
                      <option value="RESISTENCIA">Rendimiento deportivo y resistencia</option>
                    </select>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-inter flex items-start gap-2.5 text-[var(--text-secondary)]">
                    <Zap className="w-4 h-4 text-[var(--accent-secondary)] shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      Tu peso corporal se guardará en tu perfil y quedará registrado automáticamente en tu tabla histórica de seguimiento antropométrico.
                    </p>
                  </div>

                  {/* Banner de error visible sobre los botones de finalización */}
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 font-inter animate-fadeIn shadow-sm">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setRegStep(1);
                      }}
                      className="py-3 px-5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs transition-all active:scale-95 font-inter flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Atrás</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNextStep2()}
                      className="flex-1 py-3.5 px-6 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-bold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter shadow-md text-center cursor-pointer hover:shadow-[0_0_20px_rgba(183,255,59,0.35)] flex items-center justify-center gap-2"
                    >
                      <span>Siguiente: Salud y Calibración IA</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                /* PASO 3 — SALUD, LESIONES Y EQUIPAMIENTO (MOTOR IA) */
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRegistroSubmit();
                  }}
                  className="space-y-4 animate-fadeIn"
                >
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-inter flex items-center gap-1">
                        <HeartPulse className="w-3 h-3" />
                        Seguridad Médica & Motor IA
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-space tracking-tight">
                      Salud, Lesiones y Entorno
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
                      Paso 3: Personaliza restricciones para que la IA nunca prescriba ejercicios lesivos o sin material.
                    </p>
                  </div>

                  {/* 1. Lugar de entrenamiento */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                      ¿Dónde entrenarás principalmente? *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'GIMNASIO' as const, label: 'Gimnasio', icon: Building2, desc: 'Equipo completo' },
                        { id: 'CASA' as const, label: 'En Casa', icon: Home, desc: 'Mancuernas / Bandas' },
                        { id: 'CALISTENIA_PARQUE' as const, label: 'Parque', icon: Trees, desc: 'Calistenia' },
                      ].map((loc) => {
                        const Icon = loc.icon;
                        const isSelected = regLugar === loc.id;
                        return (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => setRegLugar(loc.id)}
                            className={`p-3 rounded-xl border text-left transition-all font-inter flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--text-primary)] shadow-sm'
                                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/50'
                            }`}
                          >
                            <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} />
                            <div>
                              <div className="text-xs font-semibold">{loc.label}</div>
                              <div className="text-[10px] text-[var(--text-secondary)] opacity-80">{loc.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Días y Minutos por sesión */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[var(--accent-primary)]" />
                        Días por semana *
                      </label>
                      <div className="flex gap-1.5">
                        {[2, 3, 4, 5, 6].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setRegDiasSemana(days)}
                            className={`flex-1 py-2 rounded-lg text-xs font-space font-medium transition-all cursor-pointer ${
                              regDiasSemana === days
                                ? 'bg-[var(--accent-primary)] text-[#0D1117] font-bold shadow-sm'
                                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                            }`}
                          >
                            {days}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] font-inter mb-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--accent-primary)]" />
                        Minutos por sesión *
                      </label>
                      <div className="flex gap-1.5">
                        {[30, 45, 60, 90].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setRegMinutosSesion(mins)}
                            className={`flex-1 py-2 rounded-lg text-xs font-space font-medium transition-all cursor-pointer ${
                              regMinutosSesion === mins
                                ? 'bg-[var(--accent-primary)] text-[#0D1117] font-bold shadow-sm'
                                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                            }`}
                          >
                            {mins}'
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Equipamiento Disponible */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                      Equipamiento al que tienes acceso *
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {EQUIPAMIENTOS_LIST.map((item) => {
                        const isChecked = regEquipamiento.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleEquipamiento(item.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-inter transition-all flex items-center gap-1.5 border cursor-pointer ${
                              isChecked
                                ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
                                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/40'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Dolores o Lesiones Articulares */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-[var(--text-secondary)] font-inter flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        Dolores articulares o lesiones a proteger:
                      </label>
                      <span className="text-[10px] text-[var(--text-secondary)] opacity-70">
                        {regMolestias.includes('NINGUNA') ? 'Sin dolor' : `${regMolestias.length} zona(s)`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ZONAS_MOLESTIA_LIST.map((zona) => {
                        const isChecked = regMolestias.includes(zona.id);
                        const isNone = zona.id === 'NINGUNA';
                        return (
                          <button
                            key={zona.id}
                            type="button"
                            onClick={() => toggleMolestia(zona.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-inter transition-all flex items-center gap-1.5 border cursor-pointer ${
                              isChecked
                                ? isNone
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                                  : 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/40'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                            <span>{zona.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Discapacidad o limitación motriz */}
                  <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[var(--accent-secondary)]" />
                        <div>
                          <div className="text-xs font-medium text-[var(--text-primary)] font-inter">
                            ¿Presentas alguna discapacidad o limitación física?
                          </div>
                          <div className="text-[10px] text-[var(--text-secondary)]">
                            Permite a la IA adaptar o sustituir patrones cinéticos.
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRegTieneDiscapacidad(!regTieneDiscapacidad);
                          if (error) setError(null);
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          regTieneDiscapacidad ? 'bg-[var(--accent-primary)]' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-black transition-transform absolute top-1 ${
                            regTieneDiscapacidad ? 'translate-x-6' : 'translate-x-1 bg-white/70'
                          }`}
                        />
                      </button>
                    </div>

                    {regTieneDiscapacidad && (
                      <div className="pt-2 animate-fadeIn border-t border-[var(--border)]">
                        <label className="block text-[11px] font-medium text-amber-400 font-inter mb-1">
                          Detalle de la discapacidad o limitación física *
                        </label>
                        <input
                          type="text"
                          value={regDetalleDiscapacidad}
                          onChange={(e) => {
                            setRegDetalleDiscapacidad(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="Ej: Movilidad reducida en pierna izquierda, uso de prótesis..."
                          className="w-full px-3 py-2 rounded-lg bg-[#0D1117] border border-amber-500/40 text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/40 focus:outline-none focus:border-amber-400 font-inter"
                        />
                      </div>
                    )}
                  </div>

                  {/* 6. Enfermedades preexistentes */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5 flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                      Enfermedades o condiciones de salud (Opcional):
                    </label>
                    <input
                      type="text"
                      value={regEnfermedades}
                      onChange={(e) => setRegEnfermedades(e.target.value)}
                      placeholder="Ej: Asma por esfuerzo, hipertensión controlada, diabetes..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-secondary)]/40 focus:outline-none focus:border-[var(--accent-primary)] font-inter transition-all"
                    />
                  </div>

                  {/* Banner de seguridad IA */}
                  <div className="p-3 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 text-xs font-inter flex items-start gap-2.5 text-[var(--text-secondary)]">
                    <Sparkles className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      El modelo de IA usará estos filtros de forma estricta para excluir ejercicios lesivos y modular la intensidad según tu capacidad real.
                    </p>
                  </div>

                  {/* Banner de error */}
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 font-inter animate-fadeIn shadow-sm">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Botones de acción Paso 3 */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setRegStep(2);
                      }}
                      className="py-3 px-5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs transition-all active:scale-95 font-inter flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Atrás</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegistroSubmit()}
                      disabled={registroMutation.isPending}
                      className="flex-1 py-3.5 px-6 rounded-full bg-[var(--accent-primary)] text-[#0D1117] font-bold text-xs tracking-wide hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 font-inter shadow-md text-center cursor-pointer hover:shadow-[0_0_20px_rgba(183,255,59,0.35)] flex items-center justify-center gap-2"
                    >
                      {registroMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Configurando perfil IA...</span>
                        </>
                      ) : (
                        <>
                          <span>Completar Registro y Calibrar IA</span>
                          <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-8 pt-6 border-t border-[var(--border)] text-center text-xs text-[var(--text-secondary)] font-inter">
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-semibold text-[var(--accent-primary)] hover:underline"
                >
                  Inicia sesión
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-[var(--text-secondary)]/70 font-inter pt-4">
          FitLite Pro · Sobrecarga progresiva y optimización inteligente con IA
        </div>
      </div>

      {/* ============================================================== */}
      {/* COLUMNA DERECHA: IMAGEN DE ALTO IMPACTO (~45% DEL ANCHO)       */}
      {/* (Oculta en mobile según requerimiento)                          */}
      {/* ============================================================== */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-black select-none">
        {/* Imagen de fondo de alto impacto */}
        <img
          src="/auth-hero.jpg"
          alt="Atleta levantando peso en blanco y negro con tiza"
          className="absolute inset-0 w-full h-full object-cover object-center filter grayscale contrast-125 brightness-90 transform scale-105"
        />

        {/* Overlay oscuro y gradiente atmosférico */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/50 to-[#0D1117]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1117] via-transparent to-transparent" />

        {/* Logo de FitLite superpuesto en la esquina superior */}
        <div className="absolute top-8 right-8 z-20 flex items-center gap-2 bg-[#0D1117]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[var(--border)] shadow-xl">
          <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5" strokeWidth={2.2} />
          </div>
          <span className="text-xs font-bold font-space text-[var(--text-primary)]">
            Fit<span className="text-[var(--accent-primary)]">Lite</span>
          </span>
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-space font-semibold">
            AI Engine
          </span>
        </div>

        {/* Contenido inferior: Headline en Orbitron */}
        <div className="relative z-10 mt-auto p-12 xl:p-16 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-[11px] font-space font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SOBRECARGA PROGRESIVA</span>
          </div>

          <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-white font-orbitron tracking-wider leading-tight drop-shadow-2xl">
            MÁS FUERTE <br />
            <span className="text-[var(--accent-primary)]">QUE AYER</span>
          </h2>

          <p className="text-xs xl:text-sm text-[var(--text-secondary)] font-space tracking-widest uppercase mt-4">
            ENTRENA · AVANZA · MEJORA CON IA
          </p>

          <p className="text-xs text-[var(--text-secondary)]/90 font-inter mt-3 leading-relaxed">
            Calibra microciclos, monitoriza tus kilajes y transforma tu composición corporal con precisión matemática.
          </p>
        </div>
      </div>

      {/* Modal Olvidé mi contraseña */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-space">
                  Recuperar contraseña
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-inter">
                  Ingresa tu correo para recibir un enlace de restablecimiento.
                </p>
              </div>
            </div>

            {forgotSent ? (
              <div className="p-3.5 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-xs text-[var(--accent-primary)] font-inter flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Instrucciones enviadas a tu correo electrónico.</span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] font-inter"
                />
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotSent(false);
                }}
                className="px-4 py-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-inter"
              >
                Cerrar
              </button>
              {!forgotSent && (
                <button
                  type="button"
                  onClick={() => {
                    if (forgotEmail.trim()) {
                      setForgotSent(true);
                    }
                  }}
                  className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter hover:brightness-105 active:scale-95 transition-all"
                >
                  Enviar enlace
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
