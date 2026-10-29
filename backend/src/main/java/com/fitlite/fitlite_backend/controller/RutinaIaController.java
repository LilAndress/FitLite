package com.fitlite.fitlite_backend.controller;

import com.fitlite.fitlite_backend.dto.RutinaIaBorradorRequestDTO;
import com.fitlite.fitlite_backend.dto.RutinaIaBorradorResponseDTO;
import com.fitlite.fitlite_backend.dto.RutinaIaGuardarRequestDTO;
import com.fitlite.fitlite_backend.dto.RutinaResponseDTO;
import com.fitlite.fitlite_backend.service.RutinaIaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rutinas/ia")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RutinaIaController {

    private final RutinaIaService rutinaIaService;

    @PostMapping("/borrador")
    public ResponseEntity<RutinaIaBorradorResponseDTO> generarBorrador(
            @Valid @RequestBody RutinaIaBorradorRequestDTO request) {
        RutinaIaBorradorResponseDTO borrador = rutinaIaService.generarBorrador(request);
        return ResponseEntity.ok(borrador);
    }

    @PostMapping("/guardar")
    public ResponseEntity<RutinaResponseDTO> guardarBorrador(
            @Valid @RequestBody RutinaIaGuardarRequestDTO request) {
        RutinaResponseDTO saved = rutinaIaService.guardarBorrador(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
