package com.fitlite.fitlite_backend.controller;

import com.fitlite.fitlite_backend.dto.chat.ChatRequestDTO;
import com.fitlite.fitlite_backend.dto.chat.ChatResponseDTO;
import com.fitlite.fitlite_backend.dto.chat.MensajeChatDTO;
import com.fitlite.fitlite_backend.service.GeminiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final GeminiChatService geminiChatService;

    @PostMapping("/enviar")
    public ResponseEntity<ChatResponseDTO> enviarMensaje(@Valid @RequestBody ChatRequestDTO request) {
        ChatResponseDTO response = geminiChatService.procesarMensaje(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/historial/{usuarioId}")
    public ResponseEntity<List<MensajeChatDTO>> obtenerHistorial(@PathVariable Long usuarioId) {
        List<MensajeChatDTO> historial = geminiChatService.obtenerHistorial(usuarioId);
        return ResponseEntity.ok(historial);
    }

    @DeleteMapping("/historial/{usuarioId}")
    public ResponseEntity<Map<String, String>> borrarHistorial(@PathVariable Long usuarioId) {
        geminiChatService.borrarHistorial(usuarioId);
        return ResponseEntity.ok(Map.of("mensaje", "Historial de chat borrado exitosamente"));
    }
}
