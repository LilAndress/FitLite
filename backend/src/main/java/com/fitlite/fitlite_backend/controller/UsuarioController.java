package com.fitlite.fitlite_backend.controller;

import com.fitlite.fitlite_backend.dto.ActualizarPesoRequestDTO;
import com.fitlite.fitlite_backend.dto.UsuarioRequestDTO;
import com.fitlite.fitlite_backend.dto.UsuarioResponseDTO;
import com.fitlite.fitlite_backend.exception.AccesoDenegadoException;
import com.fitlite.fitlite_backend.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioService usuarioService;

    private void validarRolAdmin(String userRole) {
        if (userRole == null || !userRole.trim().equalsIgnoreCase("ADMIN")) {
            throw new AccesoDenegadoException("Acceso denegado: Se requiere rol de Administrador para gestionar o consultar el directorio de usuarios.");
        }
    }

    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> crearUsuario(
            @Valid @RequestBody UsuarioRequestDTO request,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Si se intenta asignar un rol con privilegios (ADMIN o ENTRENADOR), exigir rol de Administrador
        if (request.getRol() != null && request.getRol() != com.fitlite.fitlite_backend.enums.RolUsuario.USUARIO) {
            validarRolAdmin(userRole);
        }
        UsuarioResponseDTO response = usuarioService.crearUsuario(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> obtenerTodos(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        validarRolAdmin(userRole);
        return ResponseEntity.ok(usuarioService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    @GetMapping("/email")
    public ResponseEntity<UsuarioResponseDTO> obtenerPorEmail(@RequestParam String email) {
        return ResponseEntity.ok(usuarioService.obtenerPorEmail(email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> actualizarUsuario(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequestDTO request,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        validarRolAdmin(userRole);
        return ResponseEntity.ok(usuarioService.actualizarUsuario(id, request));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<UsuarioResponseDTO> cambiarEstadoActivo(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        validarRolAdmin(userRole);
        return ResponseEntity.ok(usuarioService.toggleEstadoActivo(id));
    }

    @PatchMapping("/{id}/peso")
    public ResponseEntity<UsuarioResponseDTO> actualizarPeso(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarPesoRequestDTO request) {
        return ResponseEntity.ok(usuarioService.actualizarPesoActual(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        validarRolAdmin(userRole);
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.noContent().build();
    }
}
