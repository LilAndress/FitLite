package com.fitlite.fitlite_backend.controller;

import com.fitlite.fitlite_backend.dto.PerfilSaludRequestDTO;
import com.fitlite.fitlite_backend.dto.PerfilSaludResponseDTO;
import com.fitlite.fitlite_backend.service.PerfilSaludService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios/{usuarioId}/perfil-salud")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PerfilSaludController {

    private final PerfilSaludService perfilSaludService;

    @GetMapping
    public ResponseEntity<PerfilSaludResponseDTO> obtenerPerfil(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(perfilSaludService.obtenerPorUsuarioId(usuarioId));
    }

    @PutMapping
    public ResponseEntity<PerfilSaludResponseDTO> guardarOActualizarPerfil(
            @PathVariable Long usuarioId,
            @Valid @RequestBody PerfilSaludRequestDTO request) {
        return ResponseEntity.ok(perfilSaludService.guardarOActualizarPerfil(usuarioId, request));
    }
}
