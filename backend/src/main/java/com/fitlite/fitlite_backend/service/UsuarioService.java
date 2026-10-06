package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.dto.ActualizarPesoRequestDTO;
import com.fitlite.fitlite_backend.dto.LoginRequestDTO;
import com.fitlite.fitlite_backend.dto.UsuarioRequestDTO;
import com.fitlite.fitlite_backend.dto.UsuarioResponseDTO;
import com.fitlite.fitlite_backend.entity.PesoCorporal;
import com.fitlite.fitlite_backend.entity.Usuario;
import com.fitlite.fitlite_backend.enums.RolUsuario;
import com.fitlite.fitlite_backend.exception.ResourceNotFoundException;
import com.fitlite.fitlite_backend.repository.PesoCorporalRepository;
import com.fitlite.fitlite_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PesoCorporalRepository pesoCorporalRepository;

    @Transactional
    public UsuarioResponseDTO crearUsuario(UsuarioRequestDTO request) {
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un usuario registrado con el email: " + request.getEmail());
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(request.getPassword());
        usuario.setObjetivo(request.getObjetivo());
        // Rol por defecto USUARIO para registros
        usuario.setRol(request.getRol() != null ? request.getRol() : RolUsuario.USUARIO);
        usuario.setPesoActual(request.getPesoActual());
        usuario.setEdad(request.getEdad());
        usuario.setEstatura(request.getEstatura());
        usuario.setNivelExperiencia(request.getNivelExperiencia());
        usuario.setFechaRegistro(LocalDateTime.now());
        usuario.setActivo(true);

        Usuario guardado = usuarioRepository.save(usuario);

        if (request.getPesoActual() != null) {
            PesoCorporal pesoInicial = PesoCorporal.builder()
                    .peso(request.getPesoActual())
                    .fecha(LocalDate.now())
                    .notas("Peso inicial de registro")
                    .usuario(guardado)
                    .build();
            pesoCorporalRepository.save(pesoInicial);
        }

        return mapToResponse(guardado);
    }

    @Transactional
    public UsuarioResponseDTO login(LoginRequestDTO request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("No existe ninguna cuenta asociada a este correo electrónico"));

        if (!usuario.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("Contraseña incorrecta");
        }

        if (Boolean.FALSE.equals(usuario.getActivo())) {
            throw new com.fitlite.fitlite_backend.exception.AccesoDenegadoException(
                    "Esta cuenta se encuentra desactivada. Contacta al administrador para reactivar tu acceso.");
        }

        usuario.setUltimoAcceso(LocalDateTime.now());
        Usuario guardado = usuarioRepository.save(usuario);

        return mapToResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> obtenerTodos() {
        return usuarioRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO obtenerPorId(Long id) {
        Usuario usuario = buscarEntidadPorId(id);
        return mapToResponse(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO obtenerPorEmail(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con email: " + email));
        return mapToResponse(usuario);
    }

    @Transactional
    public UsuarioResponseDTO actualizarUsuario(Long id, UsuarioRequestDTO request) {
        Usuario usuario = buscarEntidadPorId(id);

        if (!usuario.getEmail().equalsIgnoreCase(request.getEmail()) &&
                usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Ya existe otro usuario registrado con el email: " + request.getEmail());
        }

        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(request.getPassword());
        }
        usuario.setObjetivo(request.getObjetivo());
        if (request.getRol() != null) {
            usuario.setRol(request.getRol());
        }
        if (request.getEdad() != null) {
            usuario.setEdad(request.getEdad());
        }
        if (request.getEstatura() != null) {
            usuario.setEstatura(request.getEstatura());
        }
        if (request.getNivelExperiencia() != null) {
            usuario.setNivelExperiencia(request.getNivelExperiencia());
        }

        if (request.getPesoActual() != null && !request.getPesoActual().equals(usuario.getPesoActual())) {
            usuario.setPesoActual(request.getPesoActual());
            PesoCorporal nuevoPeso = PesoCorporal.builder()
                    .peso(request.getPesoActual())
                    .fecha(LocalDate.now())
                    .notas("Actualización de perfil")
                    .usuario(usuario)
                    .build();
            pesoCorporalRepository.save(nuevoPeso);
        }

        Usuario actualizado = usuarioRepository.save(usuario);
        return mapToResponse(actualizado);
    }

    @Transactional
    public UsuarioResponseDTO actualizarPesoActual(Long id, ActualizarPesoRequestDTO request) {
        Usuario usuario = buscarEntidadPorId(id);
        usuario.setPesoActual(request.getPeso());
        Usuario guardado = usuarioRepository.save(usuario);

        PesoCorporal nuevoPeso = PesoCorporal.builder()
                .peso(request.getPeso())
                .fecha(request.getFecha() != null ? request.getFecha() : LocalDate.now())
                .notas(request.getNotas())
                .usuario(guardado)
                .build();
        pesoCorporalRepository.save(nuevoPeso);

        return mapToResponse(guardado);
    }

    @Transactional
    public void eliminarUsuario(Long id) {
        Usuario usuario = buscarEntidadPorId(id);
        usuarioRepository.delete(usuario);
    }

    public Usuario buscarEntidadPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));
    }

    @Transactional
    public UsuarioResponseDTO toggleEstadoActivo(Long id) {
        Usuario usuario = buscarEntidadPorId(id);
        boolean nuevoEstado = usuario.getActivo() != null && !usuario.getActivo();
        usuario.setActivo(nuevoEstado);
        Usuario guardado = usuarioRepository.save(usuario);
        return mapToResponse(guardado);
    }

    public UsuarioResponseDTO mapToResponse(Usuario usuario) {
        return UsuarioResponseDTO.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .objetivo(usuario.getObjetivo())
                .rol(usuario.getRol())
                .activo(usuario.getActivo() != null ? usuario.getActivo() : true)
                .ultimoAcceso(usuario.getUltimoAcceso())
                .pesoActual(usuario.getPesoActual())
                .edad(usuario.getEdad())
                .estatura(usuario.getEstatura())
                .nivelExperiencia(usuario.getNivelExperiencia())
                .fechaRegistro(usuario.getFechaRegistro())
                .build();
    }
}
