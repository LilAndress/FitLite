package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.dto.ActualizarPesoRequestDTO;
import com.fitlite.fitlite_backend.dto.LoginRequestDTO;
import com.fitlite.fitlite_backend.dto.UsuarioRequestDTO;
import com.fitlite.fitlite_backend.dto.UsuarioResponseDTO;
import com.fitlite.fitlite_backend.dto.PerfilSaludResponseDTO;
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
    private final PerfilSaludService perfilSaludService;
    private final com.fitlite.fitlite_backend.repository.ProgresoRepository progresoRepository;
    private final com.fitlite.fitlite_backend.repository.EjercicioCatalogoRepository ejercicioCatalogoRepository;

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

        UsuarioResponseDTO response = mapToResponse(guardado);
        if (request.getPerfilSalud() != null) {
            PerfilSaludResponseDTO perfilRes = perfilSaludService.guardarOActualizarPerfil(guardado.getId(), request.getPerfilSalud());
            response.setPerfilSalud(perfilRes);
        }

        return response;
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

    @Transactional
    public UsuarioResponseDTO completarOnboarding(Long userId, com.fitlite.fitlite_backend.dto.OnboardingRequestDTO request) {
        Usuario usuario = buscarEntidadPorId(userId);
        usuario.setOnboardingCompletado(true);

        if (request != null) {
            if (request.getSituacionInicial() != null && !request.getSituacionInicial().isBlank()) {
                usuario.setSituacionInicial(request.getSituacionInicial());
            }
            if (request.getTiempoSinEntrenar() != null && !request.getTiempoSinEntrenar().isBlank()) {
                usuario.setTiempoSinEntrenar(request.getTiempoSinEntrenar());
            }
            if (request.getTiempoTotalEntrenando() != null && !request.getTiempoTotalEntrenando().isBlank()) {
                usuario.setTiempoTotalEntrenando(request.getTiempoTotalEntrenando());
            }

            if (request.getPesosDeclarados() != null) {
                for (com.fitlite.fitlite_backend.dto.OnboardingRequestDTO.PesoDeclaradoDTO pesoDto : request.getPesosDeclarados()) {
                    if (pesoDto.getPeso() != null && pesoDto.getPeso() > 0) {
                        com.fitlite.fitlite_backend.entity.EjercicioCatalogo catalogo = null;
                        if (pesoDto.getEjercicioCatalogoId() != null) {
                            catalogo = ejercicioCatalogoRepository.findById(pesoDto.getEjercicioCatalogoId()).orElse(null);
                        } else if (pesoDto.getEjercicioNombre() != null && !pesoDto.getEjercicioNombre().isBlank()) {
                            catalogo = ejercicioCatalogoRepository.findByNombreIgnoreCase(pesoDto.getEjercicioNombre().trim()).orElse(null);
                        }

                        if (catalogo != null) {
                            com.fitlite.fitlite_backend.entity.Progreso p = com.fitlite.fitlite_backend.entity.Progreso.builder()
                                    .fecha(LocalDate.now())
                                    .seriesRealizadas(3)
                                    .repeticionesRealizadas(pesoDto.getRepeticiones() != null ? pesoDto.getRepeticiones() : 10)
                                    .pesoRealizado(pesoDto.getPeso())
                                    .usuario(usuario)
                                    .ejercicioCatalogo(catalogo)
                                    .origen(com.fitlite.fitlite_backend.enums.OrigenProgreso.DECLARADO)
                                    .build();
                            progresoRepository.save(p);
                        }
                    }
                }
            }
        }

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
                .perfilSalud(usuario.getPerfilSalud() != null ? perfilSaludService.mapToResponse(usuario.getPerfilSalud()) : null)
                .situacionInicial(usuario.getSituacionInicial())
                .tiempoSinEntrenar(usuario.getTiempoSinEntrenar())
                .tiempoTotalEntrenando(usuario.getTiempoTotalEntrenando())
                .onboardingCompletado(usuario.isOnboardingCompletado())
                .build();
    }
}
