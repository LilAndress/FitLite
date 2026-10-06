package com.fitlite.fitlite_backend.controller;

import com.fitlite.fitlite_backend.dto.PesoCorporalRequestDTO;
import com.fitlite.fitlite_backend.dto.PesoCorporalResponseDTO;
import com.fitlite.fitlite_backend.service.PesoCorporalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pesos-corporales")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PesoCorporalController {

    private final PesoCorporalService pesoCorporalService;

    @PostMapping
    public ResponseEntity<PesoCorporalResponseDTO> registrarPeso(@Valid @RequestBody PesoCorporalRequestDTO request) {
        PesoCorporalResponseDTO response = pesoCorporalService.registrarPeso(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PesoCorporalResponseDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(pesoCorporalService.obtenerPorId(id));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<PesoCorporalResponseDTO>> obtenerPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(pesoCorporalService.obtenerPorUsuario(usuarioId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPeso(@PathVariable Long id) {
        pesoCorporalService.eliminarPeso(id);
        return ResponseEntity.noContent().build();
    }
}
