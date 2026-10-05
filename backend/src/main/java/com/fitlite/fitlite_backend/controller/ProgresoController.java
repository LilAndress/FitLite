package com.fitlite.fitlite_backend.controller;

import com.fitlite.fitlite_backend.dto.ProgresoRequestDTO;
import com.fitlite.fitlite_backend.dto.ProgresoResponseDTO;
import com.fitlite.fitlite_backend.service.ProgresoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progresos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProgresoController {

    private final ProgresoService progresoService;

    @PostMapping
    public ResponseEntity<ProgresoResponseDTO> registrarProgreso(@Valid @RequestBody ProgresoRequestDTO request) {
        ProgresoResponseDTO response = progresoService.registrarProgreso(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProgresoResponseDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(progresoService.obtenerPorId(id));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<ProgresoResponseDTO>> obtenerPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(progresoService.obtenerPorUsuario(usuarioId));
    }

    @GetMapping("/usuario/{usuarioId}/ejercicio/{ejercicioId}")
    public ResponseEntity<List<ProgresoResponseDTO>> obtenerPorUsuarioYEjercicio(@PathVariable Long usuarioId,
                                                                                 @PathVariable Long ejercicioId) {
        return ResponseEntity.ok(progresoService.obtenerPorUsuarioYEjercicio(usuarioId, ejercicioId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProgreso(@PathVariable Long id) {
        progresoService.eliminarProgreso(id);
        return ResponseEntity.noContent().build();
    }
}
