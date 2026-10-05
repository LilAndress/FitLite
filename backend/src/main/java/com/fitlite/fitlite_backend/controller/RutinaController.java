package com.fitlite.fitlite_backend.controller;

import com.fitlite.fitlite_backend.dto.RutinaRequestDTO;
import com.fitlite.fitlite_backend.dto.RutinaResponseDTO;
import com.fitlite.fitlite_backend.service.RutinaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rutinas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RutinaController {

    private final RutinaService rutinaService;

    @PostMapping
    public ResponseEntity<RutinaResponseDTO> crearRutina(@Valid @RequestBody RutinaRequestDTO request) {
        RutinaResponseDTO response = rutinaService.crearRutina(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RutinaResponseDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(rutinaService.obtenerPorId(id));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<RutinaResponseDTO>> obtenerPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(rutinaService.obtenerPorUsuario(usuarioId));
    }

    @GetMapping("/usuario/{usuarioId}/activas")
    public ResponseEntity<List<RutinaResponseDTO>> obtenerActivasPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(rutinaService.obtenerActivasPorUsuario(usuarioId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RutinaResponseDTO> actualizarRutina(@PathVariable Long id,
                                                             @Valid @RequestBody RutinaRequestDTO request) {
        return ResponseEntity.ok(rutinaService.actualizarRutina(id, request));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<RutinaResponseDTO> cambiarEstado(@PathVariable Long id,
                                                          @RequestParam boolean activa) {
        return ResponseEntity.ok(rutinaService.cambiarEstado(id, activa));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarRutina(@PathVariable Long id) {
        rutinaService.eliminarRutina(id);
        return ResponseEntity.noContent().build();
    }
}
