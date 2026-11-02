package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.dto.PesoCorporalRequestDTO;
import com.fitlite.fitlite_backend.dto.PesoCorporalResponseDTO;
import com.fitlite.fitlite_backend.entity.PesoCorporal;
import com.fitlite.fitlite_backend.entity.Usuario;
import com.fitlite.fitlite_backend.exception.ResourceNotFoundException;
import com.fitlite.fitlite_backend.repository.PesoCorporalRepository;
import com.fitlite.fitlite_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PesoCorporalService {

    private final PesoCorporalRepository pesoCorporalRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public PesoCorporalResponseDTO registrarPeso(PesoCorporalRequestDTO request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        if (pesoCorporalRepository.existsByUsuarioIdAndFecha(usuario.getId(), request.getFecha())) {
            throw new IllegalArgumentException("Ya existe un pesaje registrado para la fecha " + request.getFecha() + ". Puedes editar el pesaje existente.");
        }

        PesoCorporal pesoCorporal = PesoCorporal.builder()
                .peso(request.getPeso())
                .fecha(request.getFecha())
                .notas(request.getNotas())
                .usuario(usuario)
                .build();

        PesoCorporal guardado = pesoCorporalRepository.save(pesoCorporal);

        // Actualizar el peso actual del perfil del usuario
        List<PesoCorporal> ordenados = pesoCorporalRepository.findByUsuarioIdOrderByFechaDesc(usuario.getId());
        if (!ordenados.isEmpty()) {
            usuario.setPesoActual(ordenados.get(0).getPeso());
            usuarioRepository.save(usuario);
        }

        return mapToResponse(guardado);
    }

    @Transactional
    public PesoCorporalResponseDTO actualizarPeso(Long id, PesoCorporalRequestDTO request) {
        PesoCorporal pesoCorporal = pesoCorporalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de peso no encontrado con ID: " + id));

        Usuario usuario = pesoCorporal.getUsuario();

        if (pesoCorporalRepository.existsByUsuarioIdAndFechaAndIdNot(usuario.getId(), request.getFecha(), id)) {
            throw new IllegalArgumentException("Ya existe otro pesaje registrado para la fecha " + request.getFecha() + ".");
        }

        pesoCorporal.setPeso(request.getPeso());
        pesoCorporal.setFecha(request.getFecha());
        pesoCorporal.setNotas(request.getNotas());

        PesoCorporal guardado = pesoCorporalRepository.save(pesoCorporal);

        // Actualizar el peso del usuario con el más reciente
        List<PesoCorporal> ordenados = pesoCorporalRepository.findByUsuarioIdOrderByFechaDesc(usuario.getId());
        if (!ordenados.isEmpty()) {
            usuario.setPesoActual(ordenados.get(0).getPeso());
            usuarioRepository.save(usuario);
        }

        return mapToResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<PesoCorporalResponseDTO> obtenerPorUsuario(Long usuarioId) {
        if (!usuarioRepository.existsById(usuarioId)) {
            throw new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId);
        }
        return pesoCorporalRepository.findByUsuarioIdOrderByFechaDesc(usuarioId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PesoCorporalResponseDTO obtenerPorId(Long id) {
        PesoCorporal peso = pesoCorporalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de peso no encontrado con ID: " + id));
        return mapToResponse(peso);
    }

    @Transactional
    public void eliminarPeso(Long id) {
        PesoCorporal peso = pesoCorporalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de peso no encontrado con ID: " + id));
        Usuario usuario = peso.getUsuario();
        pesoCorporalRepository.delete(peso);

        // Actualizar peso actual con el más reciente remanente
        List<PesoCorporal> restantes = pesoCorporalRepository.findByUsuarioIdOrderByFechaDesc(usuario.getId());
        if (!restantes.isEmpty()) {
            usuario.setPesoActual(restantes.get(0).getPeso());
        } else {
            usuario.setPesoActual(null);
        }
        usuarioRepository.save(usuario);
    }

    public PesoCorporalResponseDTO mapToResponse(PesoCorporal peso) {
        return PesoCorporalResponseDTO.builder()
                .id(peso.getId())
                .peso(peso.getPeso())
                .fecha(peso.getFecha())
                .notas(peso.getNotas())
                .usuarioId(peso.getUsuario().getId())
                .usuarioNombre(peso.getUsuario().getNombre())
                .build();
    }
}
