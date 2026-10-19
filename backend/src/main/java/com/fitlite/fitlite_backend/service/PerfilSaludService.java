package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.dto.PerfilSaludRequestDTO;
import com.fitlite.fitlite_backend.dto.PerfilSaludResponseDTO;
import com.fitlite.fitlite_backend.entity.PerfilSalud;
import com.fitlite.fitlite_backend.entity.Usuario;
import com.fitlite.fitlite_backend.exception.ResourceNotFoundException;
import com.fitlite.fitlite_backend.repository.PerfilSaludRepository;
import com.fitlite.fitlite_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class PerfilSaludService {

    private final PerfilSaludRepository perfilSaludRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public PerfilSaludResponseDTO obtenerPorUsuarioId(Long usuarioId) {
        PerfilSalud perfil = perfilSaludRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de salud no encontrado para el usuario ID: " + usuarioId));
        return mapToResponse(perfil);
    }

    @Transactional
    public PerfilSaludResponseDTO guardarOActualizarPerfil(Long usuarioId, PerfilSaludRequestDTO dto) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));

        PerfilSalud perfil = perfilSaludRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> PerfilSalud.builder()
                        .usuario(usuario)
                        .build());

        perfil.setTieneDiscapacidad(Boolean.TRUE.equals(dto.getTieneDiscapacidad()));
        perfil.setDetalleDiscapacidad(dto.getDetalleDiscapacidad());
        perfil.setZonasMolestia(dto.getZonasMolestia() != null ? new ArrayList<>(dto.getZonasMolestia()) : new ArrayList<>());
        perfil.setEnfermedadesPreexistentes(dto.getEnfermedadesPreexistentes());
        perfil.setLugarEntrenamiento(dto.getLugarEntrenamiento());
        perfil.setEquipamientoDisponible(dto.getEquipamientoDisponible() != null ? new ArrayList<>(dto.getEquipamientoDisponible()) : new ArrayList<>());
        perfil.setDiasDisponiblesSemana(dto.getDiasDisponiblesSemana());
        perfil.setMinutosPorSesion(dto.getMinutosPorSesion());
        perfil.setFechaActualizacion(LocalDateTime.now());

        PerfilSalud guardado = perfilSaludRepository.save(perfil);
        return mapToResponse(guardado);
    }

    public PerfilSaludResponseDTO mapToResponse(PerfilSalud perfil) {
        if (perfil == null) return null;
        return PerfilSaludResponseDTO.builder()
                .id(perfil.getId())
                .usuarioId(perfil.getUsuario() != null ? perfil.getUsuario().getId() : null)
                .tieneDiscapacidad(perfil.getTieneDiscapacidad())
                .detalleDiscapacidad(perfil.getDetalleDiscapacidad())
                .zonasMolestia(perfil.getZonasMolestia() != null ? new ArrayList<>(perfil.getZonasMolestia()) : new ArrayList<>())
                .enfermedadesPreexistentes(perfil.getEnfermedadesPreexistentes())
                .lugarEntrenamiento(perfil.getLugarEntrenamiento())
                .equipamientoDisponible(perfil.getEquipamientoDisponible() != null ? new ArrayList<>(perfil.getEquipamientoDisponible()) : new ArrayList<>())
                .diasDisponiblesSemana(perfil.getDiasDisponiblesSemana())
                .minutosPorSesion(perfil.getMinutosPorSesion())
                .fechaActualizacion(perfil.getFechaActualizacion())
                .build();
    }
}
