package com.fitlite.fitlite_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fitlite.fitlite_backend.dto.RutinaIaBorradorRequestDTO;
import com.fitlite.fitlite_backend.dto.RutinaIaBorradorResponseDTO;
import com.fitlite.fitlite_backend.dto.RutinaIaGuardarRequestDTO;
import com.fitlite.fitlite_backend.dto.RutinaResponseDTO;
import com.fitlite.fitlite_backend.entity.EjercicioCatalogo;
import com.fitlite.fitlite_backend.entity.Rutina;
import com.fitlite.fitlite_backend.entity.RutinaEjercicio;
import com.fitlite.fitlite_backend.entity.Usuario;
import com.fitlite.fitlite_backend.enums.GrupoMuscular;
import com.fitlite.fitlite_backend.exception.ResourceNotFoundException;
import com.fitlite.fitlite_backend.repository.EjercicioCatalogoRepository;
import com.fitlite.fitlite_backend.repository.RutinaEjercicioRepository;
import com.fitlite.fitlite_backend.repository.RutinaRepository;
import com.fitlite.fitlite_backend.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class RutinaIaService {

    private final UsuarioRepository usuarioRepository;
    private final RutinaRepository rutinaRepository;
    private final RutinaEjercicioRepository rutinaEjercicioRepository;
    private final EjercicioCatalogoRepository ejercicioCatalogoRepository;
    private final AiContextBuilderService contextBuilderService;
    private final RutinaService rutinaService;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String modelName;

    public RutinaIaService(
            UsuarioRepository usuarioRepository,
            RutinaRepository rutinaRepository,
            RutinaEjercicioRepository rutinaEjercicioRepository,
            EjercicioCatalogoRepository ejercicioCatalogoRepository,
            AiContextBuilderService contextBuilderService,
            RutinaService rutinaService,
            ObjectMapper objectMapper
    ) {
        this.usuarioRepository = usuarioRepository;
        this.rutinaRepository = rutinaRepository;
        this.rutinaEjercicioRepository = rutinaEjercicioRepository;
        this.ejercicioCatalogoRepository = ejercicioCatalogoRepository;
        this.contextBuilderService = contextBuilderService;
        this.rutinaService = rutinaService;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    public RutinaIaBorradorResponseDTO generarBorrador(RutinaIaBorradorRequestDTO request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equalsIgnoreCase("tu_api_key_aqui")) {
            throw new IllegalStateException("La clave GEMINI_API_KEY no está configurada. Obtén tu clave gratuita en https://aistudio.google.com/");
        }

        String systemInstruction = contextBuilderService.buildSystemInstruction(usuario);
        String userPrompt = construirPromptGeneracion(request, usuario);

        try {
            String rawJson = llamarGeminiApi(systemInstruction, userPrompt);
            return parsearBorrador(rawJson);
        } catch (Exception e) {
            log.error("Error al generar borrador IA para usuario {}: {}", request.getUsuarioId(), e.getMessage(), e);
            throw new RuntimeException("No pudimos generar la rutina en este momento. Intenta nuevamente.", e);
        }
    }

    @Transactional
    public RutinaResponseDTO guardarBorrador(RutinaIaGuardarRequestDTO request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        Rutina rutina = new Rutina();
        rutina.setNombre(request.getNombre());
        rutina.setDescripcion(request.getDescripcion());
        rutina.setFechaAsignacion(LocalDateTime.now());
        rutina.setActiva(true);
        rutina.setGeneradaPorIa(true);
        rutina.setUsuario(usuario);

        Rutina guardada = rutinaRepository.save(rutina);

        if (request.getEjercicios() != null) {
            for (RutinaIaGuardarRequestDTO.EjercicioGuardarDTO ejDto : request.getEjercicios()) {
                EjercicioCatalogo catalogo = obtenerOCrearCatalogo(ejDto, usuario.getId());

                RutinaEjercicio ejercicio = RutinaEjercicio.builder()
                        .rutina(guardada)
                        .ejercicioCatalogo(catalogo)
                        .seriesObjetivo(ejDto.getSeriesObjetivo())
                        .repeticionesObjetivo(ejDto.getRepeticionesObjetivo())
                        .pesoObjetivo(ejDto.getPesoObjetivo())
                        .build();

                rutinaEjercicioRepository.save(ejercicio);
            }
        }

        return rutinaService.mapToResponse(guardada);
    }

    private EjercicioCatalogo obtenerOCrearCatalogo(RutinaIaGuardarRequestDTO.EjercicioGuardarDTO ejDto, Long usuarioId) {
        String nombreNormalizado = ejDto.getNombre().trim().replaceAll("\\s+", " ");

        return ejercicioCatalogoRepository.findByNombreIgnoreCase(nombreNormalizado)
                .orElseGet(() -> {
                    GrupoMuscular grupo = null;
                    if (ejDto.getGrupoMuscular() != null && !ejDto.getGrupoMuscular().isBlank()) {
                        try {
                            grupo = GrupoMuscular.valueOf(ejDto.getGrupoMuscular().toUpperCase());
                        } catch (IllegalArgumentException ignored) {
                            // Si el grupo no es válido, se deja null
                        }
                    }

                    EjercicioCatalogo nuevo = EjercicioCatalogo.builder()
                            .nombre(nombreNormalizado)
                            .grupoMuscular(grupo)
                            .creadoPorUsuario(usuarioId)
                            .fechaCreacion(LocalDateTime.now())
                            .build();
                    return ejercicioCatalogoRepository.save(nuevo);
                });
    }

    private String construirPromptGeneracion(RutinaIaBorradorRequestDTO request, Usuario usuario) {
        StringBuilder sb = new StringBuilder();
        sb.append("Genera una rutina de entrenamiento personalizada para ").append(usuario.getNombre()).append(".\n\n");
        sb.append("PARÁMETROS SOLICITADOS:\n");
        int dias = request.getDiasPorSemana() != null ? request.getDiasPorSemana() :
                (usuario.getPerfilSalud() != null && usuario.getPerfilSalud().getDiasDisponiblesSemana() != null ? usuario.getPerfilSalud().getDiasDisponiblesSemana() : 4);
        int minutos = request.getMinutosPorSesion() != null ? request.getMinutosPorSesion() :
                (usuario.getPerfilSalud() != null && usuario.getPerfilSalud().getMinutosPorSesion() != null ? usuario.getPerfilSalud().getMinutosPorSesion() : 60);

        sb.append("- Días de entrenamiento por semana: ").append(dias).append("\n");
        sb.append("- Minutos por sesión: ").append(minutos).append("\n");
        if (request.getEnfoque() != null && !request.getEnfoque().isBlank()) {
            sb.append("- Enfoque específico: ").append(request.getEnfoque()).append("\n");
        }

        if (request.getSituacionInicial() != null && !request.getSituacionInicial().isBlank()) {
            sb.append("- Situación inicial: ").append(request.getSituacionInicial()).append("\n");
        }
        if (request.getTiempoTotalEntrenando() != null && !request.getTiempoTotalEntrenando().isBlank()) {
            sb.append("- Tiempo total entrenando previamente: ").append(request.getTiempoTotalEntrenando()).append("\n");
        }
        if (request.getTiempoSinEntrenar() != null && !request.getTiempoSinEntrenar().isBlank()) {
            sb.append("- Tiempo de inactividad / sin entrenar: ").append(request.getTiempoSinEntrenar()).append("\n");
        }
        if (request.getPesosDeclarados() != null && !request.getPesosDeclarados().isEmpty()) {
            sb.append("- Cargas y marcas de referencia declaradas por el atleta:\n");
            for (var p : request.getPesosDeclarados()) {
                if (p.getPeso() != null && p.getPeso() > 0) {
                    sb.append("  • ").append(p.getEjercicioNombre() != null ? p.getEjercicioNombre() : "Ejercicio").append(": ").append(p.getPeso()).append(" kg\n");
                }
            }
        }

        sb.append("\nRESPONDE EXCLUSIVAMENTE con un JSON válido (sin markdown, sin ```json, solo el JSON puro) con esta estructura exacta:\n");
        sb.append("{\n");
        sb.append("  \"nombre\": \"Nombre descriptivo de la rutina\",\n");
        sb.append("  \"descripcion\": \"Descripción breve de la rutina y su enfoque\",\n");
        sb.append("  \"razonamiento\": \"Explicación de por qué esta rutina es adecuada para el usuario, sus objetivos y condiciones\",\n");
        sb.append("  \"ejercicios\": [\n");
        sb.append("    {\n");
        sb.append("      \"nombre\": \"Nombre del ejercicio\",\n");
        sb.append("      \"grupoMuscular\": \"PECHO|ESPALDA|HOMBROS|BICEPS|TRICEPS|PIERNAS|GLUTEOS|CORE|CARDIO\",\n");
        sb.append("      \"seriesObjetivo\": 4,\n");
        sb.append("      \"repeticionesObjetivo\": 12,\n");
        sb.append("      \"pesoObjetivo\": null,\n");
        sb.append("      \"nota\": \"Nota técnica breve o consejo sobre el ejercicio\"\n");
        sb.append("    }\n");
        sb.append("  ]\n");
        sb.append("}\n\n");
        sb.append("REGLAS:\n");
        sb.append("- Incluye entre 5 y 10 ejercicios apropiados para la sesión.\n");
        sb.append("- pesoObjetivo puede ser null si no se puede estimar con certeza.\n");
        sb.append("- grupoMuscular debe ser exactamente uno de: PECHO, ESPALDA, HOMBROS, BICEPS, TRICEPS, PIERNAS, GLUTEOS, CORE, CARDIO.\n");
        sb.append("- Respeta las condiciones de salud, equipamiento y lugar de entrenamiento del perfil del atleta.\n");
        sb.append("- La nota debe ser breve y útil (técnica, tempo, o advertencia biomecánica).\n");
        sb.append("- El razonamiento debe explicar la lógica detrás de la selección de ejercicios.\n");

        return sb.toString();
    }

    private String llamarGeminiApi(String systemInstruction, String userMessage) throws Exception {
        String endpointUrl = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                modelName, apiKey.trim()
        );

        ObjectNode rootNode = objectMapper.createObjectNode();

        // System Instruction
        ObjectNode systemInstructionNode = rootNode.putObject("system_instruction");
        ArrayNode systemParts = systemInstructionNode.putArray("parts");
        systemParts.addObject().put("text", systemInstruction);

        // Contents
        ArrayNode contentsArray = rootNode.putArray("contents");
        ObjectNode contentNode = contentsArray.addObject();
        contentNode.put("role", "user");
        ArrayNode parts = contentNode.putArray("parts");
        parts.addObject().put("text", userMessage);

        // Generation config
        ObjectNode generationConfig = rootNode.putObject("generationConfig");
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 2048);
        generationConfig.put("responseMimeType", "application/json");

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
            JsonNode partsNode = firstCandidate.path("content").path("parts");
            if (partsNode.isArray() && !partsNode.isEmpty()) {
                StringBuilder respuestaFinal = new StringBuilder();
                for (JsonNode part : partsNode) {
                    if (part.has("text")) {
                        respuestaFinal.append(part.get("text").asText());
                    }
                }
                return respuestaFinal.toString();
            }
        }

        throw new RuntimeException("No se obtuvo una respuesta válida del modelo de IA.");
    }

    private RutinaIaBorradorResponseDTO parsearBorrador(String rawJson) {
        try {
            // Limpiar posibles wrappers de markdown
            String cleaned = rawJson.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            }
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            JsonNode root = objectMapper.readTree(cleaned);

            List<RutinaIaBorradorResponseDTO.EjercicioBorradorDTO> ejercicios = new ArrayList<>();
            JsonNode ejerciciosNode = root.path("ejercicios");
            if (ejerciciosNode.isArray()) {
                for (JsonNode ej : ejerciciosNode) {
                    Double peso = null;
                    if (ej.has("pesoObjetivo") && !ej.get("pesoObjetivo").isNull()) {
                        peso = ej.get("pesoObjetivo").asDouble();
                    }

                    ejercicios.add(RutinaIaBorradorResponseDTO.EjercicioBorradorDTO.builder()
                            .nombre(ej.path("nombre").asText("Ejercicio"))
                            .grupoMuscular(ej.path("grupoMuscular").asText(""))
                            .seriesObjetivo(ej.path("seriesObjetivo").asInt(4))
                            .repeticionesObjetivo(ej.path("repeticionesObjetivo").asInt(10))
                            .pesoObjetivo(peso)
                            .nota(ej.path("nota").asText(""))
                            .build());
                }
            }

            return RutinaIaBorradorResponseDTO.builder()
                    .nombre(root.path("nombre").asText("Rutina generada por IA"))
                    .descripcion(root.path("descripcion").asText(""))
                    .razonamiento(root.path("razonamiento").asText(""))
                    .ejercicios(ejercicios)
                    .build();

        } catch (Exception e) {
            log.error("Error al parsear respuesta IA: {}", rawJson, e);
            throw new RuntimeException("La respuesta del modelo de IA no tiene el formato esperado.", e);
        }
    }
}
