package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.dto.RutinaRequestDTO;
import com.fitlite.fitlite_backend.dto.RutinaResponseDTO;
import com.fitlite.fitlite_backend.dto.SugerenciaSesionRequestDTO;
import com.fitlite.fitlite_backend.dto.SugerenciaSobrecargaDTO;
import com.fitlite.fitlite_backend.entity.Progreso;
import com.fitlite.fitlite_backend.entity.Rutina;
import com.fitlite.fitlite_backend.entity.RutinaEjercicio;
import com.fitlite.fitlite_backend.entity.Usuario;
import com.fitlite.fitlite_backend.exception.ResourceNotFoundException;
import com.fitlite.fitlite_backend.repository.ProgresoRepository;
import com.fitlite.fitlite_backend.repository.RutinaRepository;
import com.fitlite.fitlite_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RutinaService {

    private final RutinaRepository rutinaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProgresoRepository progresoRepository;

    @Transactional
    public RutinaResponseDTO crearRutina(RutinaRequestDTO request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        Rutina rutina = new Rutina();
        rutina.setNombre(request.getNombre());
        rutina.setDescripcion(request.getDescripcion());
        rutina.setFechaAsignacion(LocalDateTime.now());
        rutina.setActiva(request.getActiva() != null ? request.getActiva() : true);
        rutina.setUsuario(usuario);

        Rutina guardada = rutinaRepository.save(rutina);
        return mapToResponse(guardada);
    }

    @Transactional(readOnly = true)
    public RutinaResponseDTO obtenerPorId(Long id) {
        Rutina rutina = buscarEntidadPorId(id);
        return mapToResponse(rutina);
    }

    @Transactional(readOnly = true)
    public List<RutinaResponseDTO> obtenerPorUsuario(Long usuarioId) {
        if (!usuarioRepository.existsById(usuarioId)) {
            throw new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId);
        }
        return rutinaRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RutinaResponseDTO> obtenerActivasPorUsuario(Long usuarioId) {
        if (!usuarioRepository.existsById(usuarioId)) {
            throw new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId);
        }
        return rutinaRepository.findByUsuarioIdAndActivaTrue(usuarioId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public RutinaResponseDTO actualizarRutina(Long id, RutinaRequestDTO request) {
        Rutina rutina = buscarEntidadPorId(id);

        if (!rutina.getUsuario().getId().equals(request.getUsuarioId())) {
            Usuario nuevoUsuario = usuarioRepository.findById(request.getUsuarioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));
            rutina.setUsuario(nuevoUsuario);
        }

        rutina.setNombre(request.getNombre());
        rutina.setDescripcion(request.getDescripcion());
        if (request.getActiva() != null) {
            rutina.setActiva(request.getActiva());
        }

        Rutina actualizada = rutinaRepository.save(rutina);
        return mapToResponse(actualizada);
    }

    @Transactional
    public RutinaResponseDTO cambiarEstado(Long id, boolean activa) {
        Rutina rutina = buscarEntidadPorId(id);
        rutina.setActiva(activa);
        Rutina actualizada = rutinaRepository.save(rutina);
        return mapToResponse(actualizada);
    }

    @Transactional
    public void eliminarRutina(Long id) {
        Rutina rutina = buscarEntidadPorId(id);
        rutinaRepository.delete(rutina);
    }

    public Rutina buscarEntidadPorId(Long id) {
        return rutinaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rutina no encontrada con ID: " + id));
    }

    @Transactional(readOnly = true)
    public SugerenciaSobrecargaDTO generarSugerenciaSesion(Long rutinaId, SugerenciaSesionRequestDTO feedback) {
        if (feedback == null || feedback.isSintioDolor()) {
            return null;
        }

        Rutina rutina = buscarEntidadPorId(rutinaId);
        if (rutina.getEjercicios() == null || rutina.getEjercicios().isEmpty()) {
            return null;
        }

        if (feedback.getEjercicios() != null) {
            for (RutinaEjercicio re : rutina.getEjercicios()) {
                var match = feedback.getEjercicios().stream()
                        .filter(e -> !e.isSaltado() && (
                                (e.getEjercicioId() != null && (e.getEjercicioId().equals(re.getId()) || (re.getEjercicioCatalogo() != null && e.getEjercicioId().equals(re.getEjercicioCatalogo().getId())))) ||
                                (e.getEjercicioNombre() != null && re.getEjercicioCatalogo() != null && e.getEjercicioNombre().equalsIgnoreCase(re.getEjercicioCatalogo().getNombre()))
                        ))
                        .findFirst();

                if (match.isPresent()) {
                    var ejFeedback = match.get();
                    String esfuerzo = ejFeedback.getEsfuerzo() != null ? ejFeedback.getEsfuerzo() : feedback.getEsfuerzoGeneral();
                    if ("FACIL".equalsIgnoreCase(esfuerzo) || "JUSTO".equalsIgnoreCase(esfuerzo)) {
                        double pesoBase = ejFeedback.getPesoRealizado() > 0 ? ejFeedback.getPesoRealizado() : (re.getPesoObjetivo() != null ? re.getPesoObjetivo() : 0.0);
                        double nuevoPeso = pesoBase + 2.5;
                        String nombreEj = re.getEjercicioCatalogo() != null ? re.getEjercicioCatalogo().getNombre() : "Ejercicio";

                        // Contar sesiones registradas para este ejercicio
                        Long catalogoId = re.getEjercicioCatalogo() != null ? re.getEjercicioCatalogo().getId() : null;
                        List<Progreso> historial = (feedback.getUsuarioId() != null && catalogoId != null)
                                ? progresoRepository.findByUsuarioIdAndEjercicioCatalogoIdOrderByFechaDesc(feedback.getUsuarioId(), catalogoId)
                                : List.of();

                        long sesionesPrevias = historial.stream().map(Progreso::getFecha).distinct().count();

                        if (sesionesPrevias < 2) {
                            int restantes = (int) Math.max(1, 2 - sesionesPrevias);
                            return SugerenciaSobrecargaDTO.builder()
                                    .rutinaId(rutinaId)
                                    .ejercicioId(re.getId())
                                    .ejercicioNombre(nombreEj)
                                    .pesoActual(pesoBase)
                                    .pesoPropuesto(pesoBase)
                                    .repeticionesActuales(re.getRepeticionesObjetivo())
                                    .repeticionesPropuestas(re.getRepeticionesObjetivo())
                                    .tipo("CONSOLIDACION")
                                    .tieneDatosSuficientes(false)
                                    .sesionesRestantes(restantes)
                                    .mensaje("Aún necesito " + restantes + " sesiones más de este ejercicio para recomendarte")
                                    .justificacion("Se requieren al menos 2 sesiones registradas de este ejercicio para prescribir progresiones seguras.")
                                    .datosJustificacion(sesionesPrevias + " de 2 sesiones completadas")
                                    .build();
                        }

                        int seriesObj = re.getSeriesObjetivo() > 0 ? re.getSeriesObjetivo() : 4;
                        int repsObj = re.getRepeticionesObjetivo() > 0 ? re.getRepeticionesObjetivo() : 10;
                        String justifData = seriesObj + "x" + repsObj + " con " + pesoBase + " kg en tus últimas 2 sesiones";

                        return SugerenciaSobrecargaDTO.builder()
                                .rutinaId(rutinaId)
                                .ejercicioId(re.getId())
                                .ejercicioNombre(nombreEj)
                                .pesoActual(pesoBase)
                                .pesoPropuesto(nuevoPeso)
                                .repeticionesActuales(re.getRepeticionesObjetivo())
                                .repeticionesPropuestas(re.getRepeticionesObjetivo())
                                .tipo("INCREMENTO_CARGA")
                                .tieneDatosSuficientes(true)
                                .sesionesRestantes(0)
                                .mensaje("El motor de IA detectó solvencia técnica y esfuerzo " + ("FACIL".equalsIgnoreCase(esfuerzo) ? "Fácil" : "Justo") + " en " + nombreEj + ".")
                                .justificacion("Incrementar +2.5 kg en la próxima sesión para estimular la adaptación y sobrecarga progresiva.")
                                .datosJustificacion(justifData)
                                .build();
                    }
                }
            }
        }

        if ("FACIL".equalsIgnoreCase(feedback.getEsfuerzoGeneral()) || "JUSTO".equalsIgnoreCase(feedback.getEsfuerzoGeneral())) {
            RutinaEjercicio re = rutina.getEjercicios().get(0);
            double pesoBase = re.getPesoObjetivo() != null ? re.getPesoObjetivo() : 20.0;
            String nombreEj = re.getEjercicioCatalogo() != null ? re.getEjercicioCatalogo().getNombre() : "Ejercicio principal";

            Long catalogoId = re.getEjercicioCatalogo() != null ? re.getEjercicioCatalogo().getId() : null;
            List<Progreso> historial = (feedback.getUsuarioId() != null && catalogoId != null)
                    ? progresoRepository.findByUsuarioIdAndEjercicioCatalogoIdOrderByFechaDesc(feedback.getUsuarioId(), catalogoId)
                    : List.of();

            long sesionesPrevias = historial.stream().map(Progreso::getFecha).distinct().count();

            if (sesionesPrevias < 2) {
                int restantes = (int) Math.max(1, 2 - sesionesPrevias);
                return SugerenciaSobrecargaDTO.builder()
                        .rutinaId(rutinaId)
                        .ejercicioId(re.getId())
                        .ejercicioNombre(nombreEj)
                        .pesoActual(pesoBase)
                        .pesoPropuesto(pesoBase)
                        .repeticionesActuales(re.getRepeticionesObjetivo())
                        .repeticionesPropuestas(re.getRepeticionesObjetivo())
                        .tipo("CONSOLIDACION")
                        .tieneDatosSuficientes(false)
                        .sesionesRestantes(restantes)
                        .mensaje("Aún necesito " + restantes + " sesiones más de este ejercicio para recomendarte")
                        .justificacion("Se requieren al menos 2 sesiones registradas de este ejercicio para prescribir progresiones seguras.")
                        .datosJustificacion(sesionesPrevias + " de 2 sesiones completadas")
                        .build();
            }

            int seriesObj = re.getSeriesObjetivo() > 0 ? re.getSeriesObjetivo() : 4;
            int repsObj = re.getRepeticionesObjetivo() > 0 ? re.getRepeticionesObjetivo() : 10;
            String justifData = seriesObj + "x" + repsObj + " con " + pesoBase + " kg en tus últimas 2 sesiones";

            return SugerenciaSobrecargaDTO.builder()
                    .rutinaId(rutinaId)
                    .ejercicioId(re.getId())
                    .ejercicioNombre(nombreEj)
                    .pesoActual(pesoBase)
                    .pesoPropuesto(pesoBase + 2.5)
                    .repeticionesActuales(re.getRepeticionesObjetivo())
                    .repeticionesPropuestas(re.getRepeticionesObjetivo())
                    .tipo("INCREMENTO_CARGA")
                    .tieneDatosSuficientes(true)
                    .sesionesRestantes(0)
                    .mensaje("Completaste la sesión con excelente rendimiento y tolerancia al esfuerzo.")
                    .justificacion("Incremento prescrito de +2.5 kg en " + nombreEj + " para continuar tu progresión.")
                    .datosJustificacion(justifData)
                    .build();
        }

        return null;
    }

    public RutinaResponseDTO mapToResponse(Rutina rutina) {
        return RutinaResponseDTO.builder()
                .id(rutina.getId())
                .nombre(rutina.getNombre())
                .descripcion(rutina.getDescripcion())
                .fechaAsignacion(rutina.getFechaAsignacion())
                .activa(rutina.isActiva())
                .generadaPorIa(rutina.isGeneradaPorIa())
                .usuarioId(rutina.getUsuario().getId())
                .usuarioNombre(rutina.getUsuario().getNombre())
                .build();
    }
}
