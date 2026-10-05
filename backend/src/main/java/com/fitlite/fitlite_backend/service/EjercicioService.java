package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.dto.EjercicioRequestDTO;
import com.fitlite.fitlite_backend.dto.EjercicioResponseDTO;
import com.fitlite.fitlite_backend.entity.Ejercicio;
import com.fitlite.fitlite_backend.entity.Rutina;
import com.fitlite.fitlite_backend.exception.ResourceNotFoundException;
import com.fitlite.fitlite_backend.repository.EjercicioRepository;
import com.fitlite.fitlite_backend.repository.RutinaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EjercicioService {

    private final EjercicioRepository ejercicioRepository;
    private final RutinaRepository rutinaRepository;

    @Transactional
    public EjercicioResponseDTO crearEjercicio(EjercicioRequestDTO request) {
        Rutina rutina = rutinaRepository.findById(request.getRutinaId())
                .orElseThrow(() -> new ResourceNotFoundException("Rutina no encontrada con ID: " + request.getRutinaId()));

        Ejercicio ejercicio = new Ejercicio();
        ejercicio.setNombre(request.getNombre());
        ejercicio.setSeriesObjetivo(request.getSeriesObjetivo());
        ejercicio.setRepeticionesObjetivo(request.getRepeticionesObjetivo());
        ejercicio.setPesoObjetivo(request.getPesoObjetivo());
        ejercicio.setRutina(rutina);

        Ejercicio guardado = ejercicioRepository.save(ejercicio);
        return mapToResponse(guardado);
    }

    @Transactional(readOnly = true)
    public EjercicioResponseDTO obtenerPorId(Long id) {
        Ejercicio ejercicio = buscarEntidadPorId(id);
        return mapToResponse(ejercicio);
    }

    @Transactional(readOnly = true)
    public List<EjercicioResponseDTO> obtenerPorRutina(Long rutinaId) {
        if (!rutinaRepository.existsById(rutinaId)) {
            throw new ResourceNotFoundException("Rutina no encontrada con ID: " + rutinaId);
        }
        return ejercicioRepository.findByRutinaId(rutinaId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public EjercicioResponseDTO actualizarEjercicio(Long id, EjercicioRequestDTO request) {
        Ejercicio ejercicio = buscarEntidadPorId(id);

        if (!ejercicio.getRutina().getId().equals(request.getRutinaId())) {
            Rutina nuevaRutina = rutinaRepository.findById(request.getRutinaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Rutina no encontrada con ID: " + request.getRutinaId()));
            ejercicio.setRutina(nuevaRutina);
        }

        ejercicio.setNombre(request.getNombre());
        ejercicio.setSeriesObjetivo(request.getSeriesObjetivo());
        ejercicio.setRepeticionesObjetivo(request.getRepeticionesObjetivo());
        ejercicio.setPesoObjetivo(request.getPesoObjetivo());

        Ejercicio actualizado = ejercicioRepository.save(ejercicio);
        return mapToResponse(actualizado);
    }

    @Transactional
    public void eliminarEjercicio(Long id) {
        Ejercicio ejercicio = buscarEntidadPorId(id);
        ejercicioRepository.delete(ejercicio);
    }

    public Ejercicio buscarEntidadPorId(Long id) {
        return ejercicioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ejercicio no encontrado con ID: " + id));
    }

    public EjercicioResponseDTO mapToResponse(Ejercicio ejercicio) {
        return EjercicioResponseDTO.builder()
                .id(ejercicio.getId())
                .nombre(ejercicio.getNombre())
                .seriesObjetivo(ejercicio.getSeriesObjetivo())
                .repeticionesObjetivo(ejercicio.getRepeticionesObjetivo())
                .pesoObjetivo(ejercicio.getPesoObjetivo())
                .rutinaId(ejercicio.getRutina().getId())
                .rutinaNombre(ejercicio.getRutina().getNombre())
                .build();
    }
}
