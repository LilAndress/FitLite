package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.entity.PerfilSalud;
import com.fitlite.fitlite_backend.entity.Rutina;
import com.fitlite.fitlite_backend.entity.Usuario;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class AiContextBuilderService {

    public String buildSystemInstruction(Usuario usuario) {
        StringBuilder sb = new StringBuilder();

        sb.append("Eres Coach FitLite, el asistente de inteligencia artificial y entrenador personal avanzado de la plataforma FitLite.\n");
        sb.append("Combinas conocimientos de ciencias del deporte, biomecánica clínica, prevención de lesiones y nutrición deportiva.\n\n");

        sb.append("=== PERFIL DEL ATLETA ===\n");
        sb.append("- Nombre: ").append(usuario.getNombre()).append("\n");
        if (usuario.getEdad() != null) {
            sb.append("- Edad: ").append(usuario.getEdad()).append(" años\n");
        }
        if (usuario.getPesoActual() != null) {
            sb.append("- Peso actual: ").append(usuario.getPesoActual()).append(" kg\n");
        }
        if (usuario.getEstatura() != null) {
            sb.append("- Estatura: ").append(usuario.getEstatura()).append(" cm\n");
        }
        if (usuario.getObjetivo() != null) {
            sb.append("- Objetivo físico principal: ").append(usuario.getObjetivo().name()).append("\n");
        }
        if (usuario.getNivelExperiencia() != null) {
            sb.append("- Nivel de experiencia: ").append(usuario.getNivelExperiencia().name()).append("\n");
        }

        PerfilSalud perfil = usuario.getPerfilSalud();
        if (perfil != null) {
            sb.append("\n=== CONDICIÓN FÍSICA Y SALUD (CRÍTICO) ===\n");
            if (Boolean.TRUE.equals(perfil.getTieneDiscapacidad())) {
                sb.append("- Discapacidad o limitación motriz: SÍ. Detalle: ")
                        .append(perfil.getDetalleDiscapacidad() != null ? perfil.getDetalleDiscapacidad() : "No especificado")
                        .append("\n");
            } else {
                sb.append("- Discapacidad: No reportada.\n");
            }

            if (perfil.getZonasMolestia() != null && !perfil.getZonasMolestia().isEmpty()
                    && !perfil.getZonasMolestia().contains("NINGUNA")) {
                sb.append("- Zonas de dolor / molestias / lesiones previas: ")
                        .append(String.join(", ", perfil.getZonasMolestia()))
                        .append("\n  -> REGLA OBLIGATORIA: Adapta o prohíbe ejercicios que ejerzan cizalla o estrés excesivo sobre estas articulaciones.\n");
            } else {
                sb.append("- Zonas de dolor: Ninguna reportada.\n");
            }

            if (perfil.getEnfermedadesPreexistentes() != null && !perfil.getEnfermedadesPreexistentes().isBlank()) {
                sb.append("- Enfermedades preexistentes / Condiciones médicas: ")
                        .append(perfil.getEnfermedadesPreexistentes())
                        .append("\n");
            }

            sb.append("\n=== LOGÍSTICA DE ENTRENAMIENTO ===\n");
            if (perfil.getLugarEntrenamiento() != null) {
                sb.append("- Lugar de entrenamiento: ").append(perfil.getLugarEntrenamiento().name()).append("\n");
            }
            if (perfil.getEquipamientoDisponible() != null && !perfil.getEquipamientoDisponible().isEmpty()) {
                sb.append("- Equipamiento disponible: ")
                        .append(String.join(", ", perfil.getEquipamientoDisponible()))
                        .append("\n  -> REGLA: No prescribas ejercicios con máquinas o accesorios que el atleta no posea.\n");
            }
            if (perfil.getDiasDisponiblesSemana() != null) {
                sb.append("- Frecuencia semanal: ").append(perfil.getDiasDisponiblesSemana()).append(" días por semana\n");
            }
            if (perfil.getMinutosPorSesion() != null) {
                sb.append("- Tiempo por sesión: ").append(perfil.getMinutosPorSesion()).append(" minutos\n");
            }
        }

        if (usuario.getRutinas() != null && !usuario.getRutinas().isEmpty()) {
            sb.append("\n=== RUTINAS ASIGNADAS EN FITLITE ===\n");
            for (Rutina r : usuario.getRutinas()) {
                if (r.isActiva()) {
                    sb.append("• Rutina: ").append(r.getNombre());
                    if (r.getDescripcion() != null && !r.getDescripcion().isBlank()) {
                        sb.append(" (").append(r.getDescripcion()).append(")");
                    }
                    if (r.getEjercicios() != null && !r.getEjercicios().isEmpty()) {
                        String ejerciciosStr = r.getEjercicios().stream()
                                .map(re -> re.getEjercicioCatalogo() != null ? re.getEjercicioCatalogo().getNombre() : "Ejercicio")
                                .collect(Collectors.joining(", "));
                        sb.append(" - Ejercicios: ").append(ejerciciosStr);
                    }
                    sb.append("\n");
                }
            }
        }

        sb.append("\n=== DIRECTRICES DE RESPUESTA ===\n");
        sb.append("1. Sé motivador, empático, profesional y enfocado en evidencia científica.\n");
        sb.append("2. Si el usuario te pide una rutina o ejercicio sustituto, entrégale series, repeticiones, tempo/descanso y técnica clave para proteger sus articulaciones lesionadas.\n");
        sb.append("3. Usa formato Markdown limpio con negritas, listas ordenadas o viñetas para que la lectura sea placentera en móviles y web.\n");
        sb.append("4. Responde en español y dirígete al usuario por su nombre cuando sea natural.\n");
        sb.append("5. Termina tus consejos con una breve pregunta o llamada a la acción para mantener el dinamismo de la sesión.");

        return sb.toString();
    }
}
