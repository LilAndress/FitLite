package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.dto.ProgresoRequestDTO;
import com.fitlite.fitlite_backend.dto.ProgresoResponseDTO;
import com.fitlite.fitlite_backend.entity.EjercicioCatalogo;
import com.fitlite.fitlite_backend.entity.Progreso;
import com.fitlite.fitlite_backend.entity.RutinaEjercicio;
import com.fitlite.fitlite_backend.entity.Usuario;
import com.fitlite.fitlite_backend.exception.ResourceNotFoundException;
import com.fitlite.fitlite_backend.repository.EjercicioCatalogoRepository;
import com.fitlite.fitlite_backend.repository.ProgresoRepository;
import com.fitlite.fitlite_backend.repository.RutinaEjercicioRepository;
import com.fitlite.fitlite_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgresoService {

    private final ProgresoRepository progresoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EjercicioCatalogoRepository ejercicioCatalogoRepository;
    private final RutinaEjercicioRepository rutinaEjercicioRepository;

    @Transactional
    public ProgresoResponseDTO registrarProgreso(ProgresoRequestDTO request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        EjercicioCatalogo catalogo = null;
        if (request.getEjercicioCatalogoId() != null) {
            catalogo = ejercicioCatalogoRepository.findById(request.getEjercicioCatalogoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ejercicio del catálogo no encontrado con ID: " + request.getEjercicioCatalogoId()));
        } else if (request.getEjercicioId() != null) {
            catalogo = ejercicioCatalogoRepository.findById(request.getEjercicioId()).orElse(null);
            if (catalogo == null) {
                catalogo = rutinaEjercicioRepository.findById(request.getEjercicioId())
                        .map(RutinaEjercicio::getEjercicioCatalogo)
                        .orElseThrow(() -> new ResourceNotFoundException("Ejercicio no encontrado con ID: " + request.getEjercicioId()));
            }
        } else {
            throw new IllegalArgumentException("Debe proporcionar un ID de ejercicio válido");
        }

        if (progresoRepository.existsByUsuarioIdAndEjercicioCatalogoIdAndFecha(usuario.getId(), catalogo.getId(), request.getFecha())) {
            throw new IllegalArgumentException("Ya existe un registro para " + catalogo.getNombre() + " en la fecha " + request.getFecha() + ". Puedes editar el registro existente.");
        }

        Progreso progreso = Progreso.builder()
                .fecha(request.getFecha())
                .seriesRealizadas(request.getSeriesRealizadas())
                .repeticionesRealizadas(request.getRepeticionesRealizadas())
                .pesoRealizado(request.getPesoRealizado())
                .usuario(usuario)
                .ejercicioCatalogo(catalogo)
                .origen(request.getOrigen() != null ? request.getOrigen() : com.fitlite.fitlite_backend.enums.OrigenProgreso.REGISTRADO)
                .build();

        Progreso guardado = progresoRepository.save(progreso);
        return mapToResponse(guardado);
    }

    @Transactional
    public ProgresoResponseDTO upsertProgreso(ProgresoRequestDTO request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        EjercicioCatalogo catalogo = null;
        if (request.getEjercicioCatalogoId() != null) {
            catalogo = ejercicioCatalogoRepository.findById(request.getEjercicioCatalogoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ejercicio del catálogo no encontrado con ID: " + request.getEjercicioCatalogoId()));
        } else if (request.getEjercicioId() != null) {
            catalogo = ejercicioCatalogoRepository.findById(request.getEjercicioId()).orElse(null);
            if (catalogo == null) {
                catalogo = rutinaEjercicioRepository.findById(request.getEjercicioId())
                        .map(RutinaEjercicio::getEjercicioCatalogo)
                        .orElseThrow(() -> new ResourceNotFoundException("Ejercicio no encontrado con ID: " + request.getEjercicioId()));
            }
        } else {
            throw new IllegalArgumentException("Debe proporcionar un ID de ejercicio válido");
        }

        java.time.LocalDate fecha = request.getFecha() != null ? request.getFecha() : java.time.LocalDate.now();

        java.util.Optional<Progreso> existenteOpt = progresoRepository.findByUsuarioIdAndEjercicioCatalogoIdAndFecha(
                usuario.getId(), catalogo.getId(), fecha);

        if (existenteOpt.isPresent()) {
            Progreso existente = existenteOpt.get();
            existente.setSeriesRealizadas(request.getSeriesRealizadas());
            existente.setRepeticionesRealizadas(request.getRepeticionesRealizadas());
            existente.setPesoRealizado(request.getPesoRealizado());
            if (request.getOrigen() != null) {
                existente.setOrigen(request.getOrigen());
            }
            Progreso actualizado = progresoRepository.save(existente);
            return mapToResponse(actualizado);
        } else {
            Progreso nuevo = Progreso.builder()
                    .fecha(fecha)
                    .seriesRealizadas(request.getSeriesRealizadas())
                    .repeticionesRealizadas(request.getRepeticionesRealizadas())
                    .pesoRealizado(request.getPesoRealizado())
                    .usuario(usuario)
                    .ejercicioCatalogo(catalogo)
                    .origen(request.getOrigen() != null ? request.getOrigen() : com.fitlite.fitlite_backend.enums.OrigenProgreso.REGISTRADO)
                    .build();
            Progreso guardado = progresoRepository.save(nuevo);
            return mapToResponse(guardado);
        }
    }

    @Transactional
    public ProgresoResponseDTO actualizarProgreso(Long id, ProgresoRequestDTO request) {
        Progreso progreso = buscarEntidadPorId(id);

        if (request.getUsuarioId() != null && !progreso.getUsuario().getId().equals(request.getUsuarioId())) {
            Usuario nuevoUsuario = usuarioRepository.findById(request.getUsuarioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));
            progreso.setUsuario(nuevoUsuario);
        }

        EjercicioCatalogo catalogo = progreso.getEjercicioCatalogo();
        if (request.getEjercicioCatalogoId() != null) {
            catalogo = ejercicioCatalogoRepository.findById(request.getEjercicioCatalogoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ejercicio del catálogo no encontrado con ID: " + request.getEjercicioCatalogoId()));
            progreso.setEjercicioCatalogo(catalogo);
        } else if (request.getEjercicioId() != null) {
            catalogo = ejercicioCatalogoRepository.findById(request.getEjercicioId()).orElse(null);
            if (catalogo == null) {
                catalogo = rutinaEjercicioRepository.findById(request.getEjercicioId())
                        .map(RutinaEjercicio::getEjercicioCatalogo)
                        .orElseThrow(() -> new ResourceNotFoundException("Ejercicio no encontrado con ID: " + request.getEjercicioId()));
            }
            progreso.setEjercicioCatalogo(catalogo);
        }

        java.time.LocalDate fechaFinal = request.getFecha() != null ? request.getFecha() : progreso.getFecha();

        if (catalogo != null && progresoRepository.existsByUsuarioIdAndEjercicioCatalogoIdAndFechaAndIdNot(
                progreso.getUsuario().getId(), catalogo.getId(), fechaFinal, progreso.getId())) {
            throw new IllegalArgumentException("Ya existe otro registro para " + catalogo.getNombre() + " en la fecha " + fechaFinal + ".");
        }

        if (request.getFecha() != null) {
            progreso.setFecha(request.getFecha());
        }
        if (request.getSeriesRealizadas() > 0) {
            progreso.setSeriesRealizadas(request.getSeriesRealizadas());
        }
        if (request.getRepeticionesRealizadas() > 0) {
            progreso.setRepeticionesRealizadas(request.getRepeticionesRealizadas());
        }
        if (request.getPesoRealizado() != null) {
            progreso.setPesoRealizado(request.getPesoRealizado());
        }
        if (request.getOrigen() != null) {
            progreso.setOrigen(request.getOrigen());
        }

        Progreso actualizado = progresoRepository.save(progreso);
        return mapToResponse(actualizado);
    }

    @Transactional(readOnly = true)
    public ProgresoResponseDTO obtenerPorId(Long id) {
        Progreso progreso = buscarEntidadPorId(id);
        return mapToResponse(progreso);
    }

    @Transactional(readOnly = true)
    public List<ProgresoResponseDTO> obtenerPorUsuario(Long usuarioId) {
        if (!usuarioRepository.existsById(usuarioId)) {
            throw new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId);
        }
        return progresoRepository.findByUsuarioIdOrderByFechaDesc(usuarioId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProgresoResponseDTO> obtenerPorUsuarioYEjercicio(Long usuarioId, Long ejercicioId) {
        if (!usuarioRepository.existsById(usuarioId)) {
            throw new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId);
        }

        Long catalogoId = ejercicioId;
        if (!ejercicioCatalogoRepository.existsById(ejercicioId)) {
            catalogoId = rutinaEjercicioRepository.findById(ejercicioId)
                    .map(re -> re.getEjercicioCatalogo().getId())
                    .orElse(ejercicioId);
        }

        return progresoRepository.findByUsuarioIdAndEjercicioCatalogoIdOrderByFechaDesc(usuarioId, catalogoId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void eliminarProgreso(Long id) {
        Progreso progreso = buscarEntidadPorId(id);
        progresoRepository.delete(progreso);
    }

    public Progreso buscarEntidadPorId(Long id) {
        return progresoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Progreso no encontrado con ID: " + id));
    }

    public ProgresoResponseDTO mapToResponse(Progreso progreso) {
        return ProgresoResponseDTO.builder()
                .id(progreso.getId())
                .fecha(progreso.getFecha())
                .seriesRealizadas(progreso.getSeriesRealizadas())
                .repeticionesRealizadas(progreso.getRepeticionesRealizadas())
                .pesoRealizado(progreso.getPesoRealizado())
                .usuarioId(progreso.getUsuario().getId())
                .usuarioNombre(progreso.getUsuario().getNombre())
                .ejercicioCatalogoId(progreso.getEjercicioCatalogo() != null ? progreso.getEjercicioCatalogo().getId() : null)
                .ejercicioId(progreso.getEjercicioCatalogo() != null ? progreso.getEjercicioCatalogo().getId() : null)
                .ejercicioNombre(progreso.getEjercicioCatalogo() != null ? progreso.getEjercicioCatalogo().getNombre() : "Ejercicio eliminado")
                .grupoMuscular(progreso.getEjercicioCatalogo() != null ? progreso.getEjercicioCatalogo().getGrupoMuscular() : null)
                .origen(progreso.getOrigen() != null ? progreso.getOrigen() : com.fitlite.fitlite_backend.enums.OrigenProgreso.REGISTRADO)
                .build();
    }
}
