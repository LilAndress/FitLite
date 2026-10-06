export type ObjetivoFisico = 'PERDER_PESO' | 'GANAR_MASA' | 'MANTENER' | 'RESISTENCIA';
export type RolUsuario = 'USUARIO' | 'ENTRENADOR' | 'ADMIN';
export type NivelExperiencia = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  objetivo: ObjetivoFisico;
  rol: RolUsuario;
  pesoActual?: number | null;
  edad?: number | null;
  estatura?: number | null;
  nivelExperiencia?: NivelExperiencia | null;
  activo: boolean;
  ultimoAcceso?: string | null;
  fechaRegistro: string;
}

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password?: string;
  objetivo: ObjetivoFisico;
  rol?: RolUsuario;
  pesoActual?: number | null;
  edad?: number | null;
  estatura?: number | null;
  nivelExperiencia?: NivelExperiencia | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  email: string;
  password: string;
  edad: number;
  estatura: number;
  pesoActual: number;
  nivelExperiencia: NivelExperiencia;
  objetivo: ObjetivoFisico;
}

export interface ActualizarPesoRequest {
  peso: number;
  fecha?: string;
  notas?: string;
}

export interface PesoCorporal {
  id: number;
  peso: number;
  fecha: string;
  usuarioId: number;
  usuarioNombre: string;
  notas?: string;
}

export interface PesoCorporalRequest {
  peso: number;
  fecha: string;
  usuarioId: number;
  notas?: string;
}

export interface Rutina {
  id: number;
  nombre: string;
  descripcion: string;
  fechaAsignacion: string;
  activa: boolean;
  usuarioId: number;
  usuarioNombre: string;
}

export interface RutinaRequest {
  nombre: string;
  descripcion?: string;
  activa?: boolean;
  usuarioId: number;
}

export interface Ejercicio {
  id: number;
  nombre: string;
  seriesObjetivo: number;
  repeticionesObjetivo: number;
  pesoObjetivo: number;
  rutinaId: number;
  rutinaNombre: string;
}

export interface EjercicioRequest {
  nombre: string;
  seriesObjetivo: number;
  repeticionesObjetivo: number;
  pesoObjetivo?: number;
  rutinaId: number;
}

export interface Progreso {
  id: number;
  fecha: string;
  seriesRealizadas: number;
  repeticionesRealizadas: number;
  pesoRealizado: number;
  usuarioId: number;
  usuarioNombre: string;
  ejercicioId: number;
  ejercicioNombre: string;
}

export interface ProgresoRequest {
  fecha: string;
  seriesRealizadas: number;
  repeticionesRealizadas: number;
  pesoRealizado: number;
  usuarioId: number;
  ejercicioId: number;
}
