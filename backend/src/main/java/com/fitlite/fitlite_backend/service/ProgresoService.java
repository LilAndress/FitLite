package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.dto.ProgresoRequestDTO;
import com.fitlite.fitlite_backend.dto.ProgresoResponseDTO;
import com.fitlite.fitlite_backend.entity.Ejercicio;
import com.fitlite.fitlite_backend.entity.Progreso;
import com.fitlite.fitlite_backend.entity.Usuario;
import com.fitlite.fitlite_backend.exception.ResourceNotFoundException;
import com.fitlite.fitlite_backend.repository.EjercicioRepository;
import com.fitlite.fitlite_backend.repository.ProgresoRepository;
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
    private final EjercicioRepository ejercicioRepository;

    @Transactional
    public ProgresoResponseDTO registrarProgreso(ProgresoRequestDTO request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        Ejercicio ejercicio = ejercicioRepository.findById(request.getEjercicioId())
                .orElseThrow(() -> new ResourceNotFoundException("Ejercicio no encontrado con ID: " + request.getEjercicioId()));

        Progreso progreso = new Progreso();
        progreso.setFecha(request.getFecha());
        progreso.setSeriesRealizadas(request.getSeriesRealizadas());
        progreso.setRepeticionesRealizadas(request.getRepeticionesRealizadas());
        progreso.setPesoRealizado(request.getPesoRealizado());
        progreso.setUsuario(usuario);
        progreso.setEjercicio(ejercicio);

        Progreso guardado = progresoRepository.save(progreso);
        return mapToResponse(guardado);
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
        if (!ejercicioRepository.existsById(ejercicioId)) {
            throw new ResourceNotFoundException("Ejercicio no encontrado con ID: " + ejercicioId);
        }
        return progresoRepository.findByUsuarioIdAndEjercicioIdOrderByFechaDesc(usuarioId, ejercicioId)
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
                .ejercicioId(progreso.getEjercicio().getId())
                .ejercicioNombre(progreso.getEjercicio().getNombre())
                .build();
    }
}
