package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.dto.EjercicioRequestDTO;
import com.fitlite.fitlite_backend.dto.EjercicioResponseDTO;
import com.fitlite.fitlite_backend.entity.EjercicioCatalogo;
import com.fitlite.fitlite_backend.entity.Rutina;
import com.fitlite.fitlite_backend.entity.RutinaEjercicio;
import com.fitlite.fitlite_backend.exception.ResourceNotFoundException;
import com.fitlite.fitlite_backend.repository.EjercicioCatalogoRepository;
import com.fitlite.fitlite_backend.repository.RutinaEjercicioRepository;
import com.fitlite.fitlite_backend.repository.RutinaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EjercicioService {

    private final RutinaEjercicioRepository rutinaEjercicioRepository;
    private final EjercicioCatalogoRepository ejercicioCatalogoRepository;
    private final RutinaRepository rutinaRepository;

    @Transactional
    public EjercicioResponseDTO crearEjercicio(EjercicioRequestDTO request) {
        Rutina rutina = rutinaRepository.findById(request.getRutinaId())
                .orElseThrow(() -> new ResourceNotFoundException("Rutina no encontrada con ID: " + request.getRutinaId()));

        EjercicioCatalogo catalogo = obtenerOCrearCatalogo(request, rutina.getUsuario().getId());

        RutinaEjercicio ejercicio = RutinaEjercicio.builder()
                .rutina(rutina)
                .ejercicioCatalogo(catalogo)
                .seriesObjetivo(request.getSeriesObjetivo())
                .repeticionesObjetivo(request.getRepeticionesObjetivo())
                .pesoObjetivo(request.getPesoObjetivo())
                .build();

        RutinaEjercicio guardado = rutinaEjercicioRepository.save(ejercicio);
        return mapToResponse(guardado);
    }

    @Transactional(readOnly = true)
    public EjercicioResponseDTO obtenerPorId(Long id) {
        RutinaEjercicio ejercicio = buscarEntidadPorId(id);
        return mapToResponse(ejercicio);
    }

    @Transactional(readOnly = true)
    public List<EjercicioResponseDTO> obtenerPorRutina(Long rutinaId) {
        if (!rutinaRepository.existsById(rutinaId)) {
            throw new ResourceNotFoundException("Rutina no encontrada con ID: " + rutinaId);
        }
        return rutinaEjercicioRepository.findByRutinaId(rutinaId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public EjercicioResponseDTO actualizarEjercicio(Long id, EjercicioRequestDTO request) {
        RutinaEjercicio ejercicio = buscarEntidadPorId(id);

        if (!ejercicio.getRutina().getId().equals(request.getRutinaId())) {
            Rutina nuevaRutina = rutinaRepository.findById(request.getRutinaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Rutina no encontrada con ID: " + request.getRutinaId()));
            ejercicio.setRutina(nuevaRutina);
        }

        if (request.getEjercicioCatalogoId() != null || (request.getNombre() != null && !request.getNombre().isBlank())) {
            EjercicioCatalogo catalogo = obtenerOCrearCatalogo(request, ejercicio.getRutina().getUsuario().getId());
            ejercicio.setEjercicioCatalogo(catalogo);
        }

        ejercicio.setSeriesObjetivo(request.getSeriesObjetivo());
        ejercicio.setRepeticionesObjetivo(request.getRepeticionesObjetivo());
        ejercicio.setPesoObjetivo(request.getPesoObjetivo());

        RutinaEjercicio actualizado = rutinaEjercicioRepository.save(ejercicio);
        return mapToResponse(actualizado);
    }

    @Transactional
    public void eliminarEjercicio(Long id) {
        RutinaEjercicio ejercicio = buscarEntidadPorId(id);
        rutinaEjercicioRepository.delete(ejercicio);
    }

    @Transactional(readOnly = true)
    public List<EjercicioCatalogo> buscarCatalogo(String query) {
        if (query == null || query.trim().isEmpty()) {
            return ejercicioCatalogoRepository.findAll();
        }
        return ejercicioCatalogoRepository.findByNombreContainingIgnoreCase(query.trim());
    }

    @Transactional
    public EjercicioCatalogo obtenerOCrearCatalogo(EjercicioRequestDTO request, Long usuarioId) {
        if (request.getEjercicioCatalogoId() != null) {
            return ejercicioCatalogoRepository.findById(request.getEjercicioCatalogoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ejercicio del catálogo no encontrado con ID: " + request.getEjercicioCatalogoId()));
        }

        if (request.getNombre() == null || request.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("Debe proporcionar un ID de catálogo o un nombre de ejercicio");
        }

        String nombreNormalizado = request.getNombre().trim();
        return ejercicioCatalogoRepository.findByNombreIgnoreCase(nombreNormalizado)
                .orElseGet(() -> {
                    EjercicioCatalogo nuevo = EjercicioCatalogo.builder()
                            .nombre(nombreNormalizado)
                            .grupoMuscular(request.getGrupoMuscular())
                            .descripcionTecnica(request.getDescripcionTecnica())
                            .creadoPorUsuario(usuarioId)
                            .fechaCreacion(LocalDateTime.now())
                            .build();
                    return ejercicioCatalogoRepository.save(nuevo);
                });
    }

    public RutinaEjercicio buscarEntidadPorId(Long id) {
        return rutinaEjercicioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ejercicio de rutina no encontrado con ID: " + id));
    }

    public EjercicioResponseDTO mapToResponse(RutinaEjercicio ejercicio) {
        return EjercicioResponseDTO.builder()
                .id(ejercicio.getId())
                .ejercicioCatalogoId(ejercicio.getEjercicioCatalogo().getId())
                .nombre(ejercicio.getEjercicioCatalogo().getNombre())
                .grupoMuscular(ejercicio.getEjercicioCatalogo().getGrupoMuscular())
                .descripcionTecnica(ejercicio.getEjercicioCatalogo().getDescripcionTecnica())
                .seriesObjetivo(ejercicio.getSeriesObjetivo())
                .repeticionesObjetivo(ejercicio.getRepeticionesObjetivo())
                .pesoObjetivo(ejercicio.getPesoObjetivo())
                .rutinaId(ejercicio.getRutina().getId())
                .rutinaNombre(ejercicio.getRutina().getNombre())
                .build();
    }
}
