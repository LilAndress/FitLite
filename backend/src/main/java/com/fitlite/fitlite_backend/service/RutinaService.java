package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.dto.RutinaRequestDTO;
import com.fitlite.fitlite_backend.dto.RutinaResponseDTO;
import com.fitlite.fitlite_backend.entity.Rutina;
import com.fitlite.fitlite_backend.entity.Usuario;
import com.fitlite.fitlite_backend.exception.ResourceNotFoundException;
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

    public RutinaResponseDTO mapToResponse(Rutina rutina) {
        return RutinaResponseDTO.builder()
                .id(rutina.getId())
                .nombre(rutina.getNombre())
                .descripcion(rutina.getDescripcion())
                .fechaAsignacion(rutina.getFechaAsignacion())
                .activa(rutina.isActiva())
                .usuarioId(rutina.getUsuario().getId())
                .usuarioNombre(rutina.getUsuario().getNombre())
                .build();
    }
}
