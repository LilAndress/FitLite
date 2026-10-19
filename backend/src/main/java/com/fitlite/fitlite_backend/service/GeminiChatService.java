package com.fitlite.fitlite_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fitlite.fitlite_backend.dto.chat.ChatRequestDTO;
import com.fitlite.fitlite_backend.dto.chat.ChatResponseDTO;
import com.fitlite.fitlite_backend.dto.chat.MensajeChatDTO;
import com.fitlite.fitlite_backend.entity.MensajeChat;
import com.fitlite.fitlite_backend.entity.Usuario;
import com.fitlite.fitlite_backend.exception.ResourceNotFoundException;
import com.fitlite.fitlite_backend.repository.MensajeChatRepository;
import com.fitlite.fitlite_backend.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class GeminiChatService {

    private final MensajeChatRepository mensajeChatRepository;
    private final UsuarioRepository usuarioRepository;
    private final AiContextBuilderService contextBuilderService;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String modelName;

    public GeminiChatService(
            MensajeChatRepository mensajeChatRepository,
            UsuarioRepository usuarioRepository,
            AiContextBuilderService contextBuilderService,
            ObjectMapper objectMapper
    ) {
        this.mensajeChatRepository = mensajeChatRepository;
        this.usuarioRepository = usuarioRepository;
        this.contextBuilderService = contextBuilderService;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    @Transactional
    public ChatResponseDTO procesarMensaje(ChatRequestDTO request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        // 1. Guardar mensaje del usuario
        MensajeChat mensajeUsuario = MensajeChat.builder()
                .usuario(usuario)
                .rol("USER")
                .contenido(request.getMensaje().trim())
                .fechaCreacion(LocalDateTime.now())
                .build();
        mensajeChatRepository.save(mensajeUsuario);

        // 2. Verificar si la clave de API está configurada
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equalsIgnoreCase("tu_api_key_aqui")) {
            String fallbackRespuesta = generarRespuestaSinApiKey(usuario, request.getMensaje());
            MensajeChat mensajeIa = MensajeChat.builder()
                    .usuario(usuario)
                    .rol("MODEL")
                    .contenido(fallbackRespuesta)
                    .fechaCreacion(LocalDateTime.now())
                    .build();
            mensajeChatRepository.save(mensajeIa);

            return ChatResponseDTO.builder()
                    .respuesta(fallbackRespuesta)
                    .rol("MODEL")
                    .fecha(mensajeIa.getFechaCreacion())
                    .apiConfigurada(false)
                    .advertencia("Clave GEMINI_API_KEY no configurada. Obtén tu clave 100% gratuita en https://aistudio.google.com/")
                    .build();
        }

        // 3. Obtener historial reciente para el contexto conversacional
        List<MensajeChat> historialDesc = mensajeChatRepository.findTop20ByUsuarioIdOrderByFechaCreacionDesc(usuario.getId());
        List<MensajeChat> historialAsc = new ArrayList<>(historialDesc);
        Collections.reverse(historialAsc);

        // 4. Construir System Instruction personalizada con el perfil de salud
        String systemInstruction = contextBuilderService.buildSystemInstruction(usuario);

        // 5. Llamar a la API de Google Gemini
        String respuestaTexto;
        boolean exitoApi = true;
        String advertencia = null;

        try {
            respuestaTexto = llamarGeminiApi(systemInstruction, historialAsc, request.getMensaje().trim());
        } catch (RestClientResponseException e) {
            log.error("Error al invocar Google Gemini API: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            exitoApi = false;
            if (e.getStatusCode().value() == 429) {
                advertencia = "Límite de peticiones por minuto alcanzado. Espera unos segundos e intenta nuevamente.";
                respuestaTexto = "⏳ **Límite de velocidad temporal:** Has superado las 15 consultas por minuto de la capa gratuita de Google Gemini. Por favor espera unos momentos y vuelve a preguntar.";
            } else if (e.getStatusCode().value() == 400 || e.getStatusCode().value() == 403) {
                advertencia = "La clave GEMINI_API_KEY es inválida o expiró.";
                respuestaTexto = "⚠️ **Error de autenticación:** Tu clave de Google Gemini no es válida. Revisa la clave en [Google AI Studio](https://aistudio.google.com/).";
            } else {
                advertencia = "Error de comunicación con Google Gemini: " + e.getStatusCode();
                respuestaTexto = "⚠️ Hubo un inconveniente temporal comunicándonos con Google Gemini. Intenta de nuevo en unos momentos.";
            }
        } catch (Exception e) {
            log.error("Excepción inesperada al procesar chat con Gemini", e);
            exitoApi = false;
            advertencia = "Error interno: " + e.getMessage();
            respuestaTexto = "⚠️ No pudimos procesar la consulta en este momento. Inténtalo nuevamente.";
        }

        // 6. Guardar respuesta del modelo
        MensajeChat mensajeIa = MensajeChat.builder()
                .usuario(usuario)
                .rol("MODEL")
                .contenido(respuestaTexto)
                .fechaCreacion(LocalDateTime.now())
                .build();
        mensajeChatRepository.save(mensajeIa);

        return ChatResponseDTO.builder()
                .respuesta(respuestaTexto)
                .rol("MODEL")
                .fecha(mensajeIa.getFechaCreacion())
                .apiConfigurada(exitoApi)
                .advertencia(advertencia)
                .build();
    }

    private String llamarGeminiApi(String systemInstruction, List<MensajeChat> historial, String nuevoMensaje) throws Exception {
        String endpointUrl = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                modelName, apiKey.trim()
        );

        ObjectNode rootNode = objectMapper.createObjectNode();

        // System Instruction
        ObjectNode systemInstructionNode = rootNode.putObject("system_instruction");
        ArrayNode systemParts = systemInstructionNode.putArray("parts");
        systemParts.addObject().put("text", systemInstruction);

        // Contents (Historial + Nuevo Mensaje)
        ArrayNode contentsArray = rootNode.putArray("contents");

        // Incluimos hasta los últimos 10 mensajes del historial (excluyendo el que acabamos de guardar para no duplicar)
        for (MensajeChat msg : historial) {
            if (msg.getId() != null) { // ya persistido
                ObjectNode contentNode = contentsArray.addObject();
                contentNode.put("role", msg.getRol().equalsIgnoreCase("USER") ? "user" : "model");
                ArrayNode parts = contentNode.putArray("parts");
                parts.addObject().put("text", msg.getContenido());
            }
        }

        // Configuración de generación
        ObjectNode generationConfig = rootNode.putObject("generationConfig");
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 1200);

        String jsonPayload = objectMapper.writeValueAsString(rootNode);

        String rawResponse = restClient.post()
                .uri(endpointUrl)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(jsonPayload)
                .retrieve()
                .body(String.class);

        JsonNode responseTree = objectMapper.readTree(rawResponse);
        JsonNode candidates = responseTree.path("candidates");
        if (candidates.isArray() && !candidates.isEmpty()) {
            JsonNode firstCandidate = candidates.get(0);
            JsonNode parts = firstCandidate.path("content").path("parts");
            if (parts.isArray() && !parts.isEmpty()) {
                StringBuilder respuestaFinal = new StringBuilder();
                for (JsonNode part : parts) {
                    if (part.has("text")) {
                        respuestaFinal.append(part.get("text").asText());
                    }
                }
                return respuestaFinal.toString();
            }
        }

        return "No obtuve una respuesta clara del modelo. Por favor reformula tu pregunta.";
    }

    private String generarRespuestaSinApiKey(Usuario usuario, String mensajeUsuario) {
        StringBuilder sb = new StringBuilder();
        sb.append("👋 ¡Hola **").append(usuario.getNombre()).append("**! Soy tu **Coach IA de FitLite**.\n\n");
        sb.append("Para responderte con la inteligencia en tiempo real de Google Gemini (100% gratuita), ");
        sb.append("configura tu clave de API en el archivo `.env` o en `docker-compose.yml` (`GEMINI_API_KEY=tu_clave`).\n\n");
        sb.append("📌 **Cómo obtener tu clave en 30 segundos gratis:**\n");
        sb.append("1. Entra a [Google AI Studio (aistudio.google.com)](https://aistudio.google.com/)\n");
        sb.append("2. Inicia sesión con tu cuenta de Google (sin tarjeta de crédito).\n");
        sb.append("3. Haz clic en **'Get API key'** y pégala en tu configuración.\n\n");
        sb.append("💡 *Mientras tanto, he leído tu perfil:*\n");
        if (usuario.getObjetivo() != null) {
            sb.append("- Objetivo: **").append(usuario.getObjetivo().name()).append("**\n");
        }
        if (usuario.getPerfilSalud() != null) {
            if (usuario.getPerfilSalud().getLugarEntrenamiento() != null) {
                sb.append("- Lugar: **").append(usuario.getPerfilSalud().getLugarEntrenamiento().name()).append("**\n");
            }
            if (usuario.getPerfilSalud().getZonasMolestia() != null && !usuario.getPerfilSalud().getZonasMolestia().isEmpty()) {
                sb.append("- Cuidados especiales en: **")
                        .append(String.join(", ", usuario.getPerfilSalud().getZonasMolestia())).append("**\n");
            }
        }
        sb.append("\n¡Activa tu clave gratuita y empecemos a planificar tus entrenamientos!");
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public List<MensajeChatDTO> obtenerHistorial(Long usuarioId) {
        return mensajeChatRepository.findByUsuarioIdOrderByFechaCreacionAsc(usuarioId)
                .stream()
                .map(m -> MensajeChatDTO.builder()
                        .id(m.getId())
                        .rol(m.getRol())
                        .contenido(m.getContenido())
                        .fechaCreacion(m.getFechaCreacion())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void borrarHistorial(Long usuarioId) {
        mensajeChatRepository.deleteByUsuarioId(usuarioId);
    }
}
