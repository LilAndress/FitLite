package com.fitlite.fitlite_backend.controller;

import com.fitlite.fitlite_backend.dto.EjercicioRequestDTO;
import com.fitlite.fitlite_backend.dto.EjercicioResponseDTO;
import com.fitlite.fitlite_backend.entity.EjercicioCatalogo;
import com.fitlite.fitlite_backend.service.EjercicioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ejercicios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EjercicioController {

    private final EjercicioService ejercicioService;

    @GetMapping("/buscar")
    public List<EjercicioCatalogo> buscar(@RequestParam(name = "query", defaultValue = "") String query) {
        return ejercicioService.buscarCatalogo(query);
    }

    @GetMapping("/catalogo")
    public List<EjercicioCatalogo> obtenerCatalogoCompleto() {
        return ejercicioService.buscarCatalogo("");
    }

    @PostMapping
    public ResponseEntity<EjercicioResponseDTO> crearEjercicio(@Valid @RequestBody EjercicioRequestDTO request) {
        EjercicioResponseDTO response = ejercicioService.crearEjercicio(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EjercicioResponseDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ejercicioService.obtenerPorId(id));
    }

    @GetMapping("/rutina/{rutinaId}")
    public ResponseEntity<List<EjercicioResponseDTO>> obtenerPorRutina(@PathVariable Long rutinaId) {
        return ResponseEntity.ok(ejercicioService.obtenerPorRutina(rutinaId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EjercicioResponseDTO> actualizarEjercicio(@PathVariable Long id,
                                                                   @Valid @RequestBody EjercicioRequestDTO request) {
        return ResponseEntity.ok(ejercicioService.actualizarEjercicio(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarEjercicio(@PathVariable Long id) {
        ejercicioService.eliminarEjercicio(id);
        return ResponseEntity.noContent().build();
    }
}
