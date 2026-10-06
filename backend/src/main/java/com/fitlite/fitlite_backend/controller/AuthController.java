package com.fitlite.fitlite_backend.controller;

import com.fitlite.fitlite_backend.dto.LoginRequestDTO;
import com.fitlite.fitlite_backend.dto.UsuarioRequestDTO;
import com.fitlite.fitlite_backend.dto.UsuarioResponseDTO;
import com.fitlite.fitlite_backend.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public ResponseEntity<UsuarioResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        UsuarioResponseDTO response = usuarioService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponseDTO> registro(@Valid @RequestBody UsuarioRequestDTO request) {
        UsuarioResponseDTO response = usuarioService.crearUsuario(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
