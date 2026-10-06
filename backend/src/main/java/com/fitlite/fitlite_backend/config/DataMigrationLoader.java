package com.fitlite.fitlite_backend.config;

import com.fitlite.fitlite_backend.entity.EjercicioCatalogo;
import com.fitlite.fitlite_backend.enums.GrupoMuscular;
import com.fitlite.fitlite_backend.repository.EjercicioCatalogoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataMigrationLoader implements CommandLineRunner {

    private final EjercicioCatalogoRepository ejercicioCatalogoRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Iniciando verificación y migración de catálogo de ejercicios...");
        sembrarEjerciciosBase();
        migrarDatosHistoricosSiExisten();
        log.info("Catálogo y migración listos.");
    }

    private void sembrarEjerciciosBase() {
        record EjercicioSemilla(String nombre, GrupoMuscular grupo, String descripcion) {}

        List<EjercicioSemilla> semillas = List.of(
                // PECHO
                new EjercicioSemilla("Press banca plano con barra", GrupoMuscular.PECHO, "Empuje básico horizontal para masa y fuerza en pectorales."),
                new EjercicioSemilla("Press inclinado con mancuernas", GrupoMuscular.PECHO, "Enfocado en la porción clavicular del pectoral mayor."),
                new EjercicioSemilla("Aperturas con mancuernas", GrupoMuscular.PECHO, "Aislamiento y estiramiento del pectoral en banco plano."),
                new EjercicioSemilla("Fondos en paralelas para pecho", GrupoMuscular.PECHO, "Empuje corporal con inclinación hacia adelante."),
                new EjercicioSemilla("Cruces en polea alta", GrupoMuscular.PECHO, "Contracción continua para el pectoral inferior e interno."),

                // ESPALDA
                new EjercicioSemilla("Dominadas pronas", GrupoMuscular.ESPALDA, "Tracción vertical fundamental para amplitud dorsal."),
                new EjercicioSemilla("Jalón al pecho en polea", GrupoMuscular.ESPALDA, "Tracción vertical controlada para dorsal ancho."),
                new EjercicioSemilla("Remo con barra", GrupoMuscular.ESPALDA, "Tracción horizontal pesada para densidad y grosor de espalda."),
                new EjercicioSemilla("Remo en polea baja (Gironde)", GrupoMuscular.ESPALDA, "Remo sentado con agarre estrecho para espalda media."),
                new EjercicioSemilla("Peso muerto convencional", GrupoMuscular.ESPALDA, "Movimiento compuesto para toda la cadena posterior."),

                // HOMBROS
                new EjercicioSemilla("Press militar con barra", GrupoMuscular.HOMBROS, "Empuje vertical estricto para deltoides anterior y fuerza general."),
                new EjercicioSemilla("Elevaciones laterales con mancuernas", GrupoMuscular.HOMBROS, "Aislamiento clave del deltoides lateral para amplitud."),
                new EjercicioSemilla("Pájaros con mancuernas", GrupoMuscular.HOMBROS, "Enfocado en deltoides posterior y salud escapular."),
                new EjercicioSemilla("Press Arnold", GrupoMuscular.HOMBROS, "Press rotativo completo para estimulación global del hombro."),

                // BICEPS
                new EjercicioSemilla("Curl de bíceps con barra Z", GrupoMuscular.BICEPS, "Flexión de codo clásica para pico y masa de bíceps."),
                new EjercicioSemilla("Curl martillo con mancuernas", GrupoMuscular.BICEPS, "Trabajo de braquiorradial y braquial anterior."),
                new EjercicioSemilla("Curl concentrado en banco", GrupoMuscular.BICEPS, "Aislamiento estricto sin balanceo corporal."),

                // TRICEPS
                new EjercicioSemilla("Extensiones de tríceps en polea", GrupoMuscular.TRICEPS, "Aislamiento de la cabeza lateral y medial del tríceps."),
                new EjercicioSemilla("Press francés con barra Z", GrupoMuscular.TRICEPS, "Énfasis en la cabeza larga del tríceps."),
                new EjercicioSemilla("Fondos en banco para tríceps", GrupoMuscular.TRICEPS, "Empuje con autocarga para tríceps."),

                // PIERNAS
                new EjercicioSemilla("Sentadilla trasera con barra", GrupoMuscular.PIERNAS, "Rey de los ejercicios de pierna: cuádriceps, glúteo y core."),
                new EjercicioSemilla("Prensa de piernas 45°", GrupoMuscular.PIERNAS, "Carga guiada con volumen para cuádriceps y glúteos."),
                new EjercicioSemilla("Extensiones de cuádriceps", GrupoMuscular.PIERNAS, "Aislamiento articular en máquina."),
                new EjercicioSemilla("Curl femoral tumbado", GrupoMuscular.PIERNAS, "Flexión de rodilla para isquiosurales."),
                new EjercicioSemilla("Elevación de talones de pie", GrupoMuscular.PIERNAS, "Trabajo de gastrocnemio y sóleo."),

                // GLUTEOS
                new EjercicioSemilla("Hip thrust con barra", GrupoMuscular.GLUTEOS, "Máxima activación del glúteo mayor en extensión de cadera."),
                new EjercicioSemilla("Sentadilla búlgara", GrupoMuscular.GLUTEOS, "Ejercicio unilateral excelente para glúteos y cuádriceps."),
                new EjercicioSemilla("Patada de glúteo en polea", GrupoMuscular.GLUTEOS, "Aislamiento y congestión en extensión de cadera."),

                // CORE
                new EjercicioSemilla("Plancha abdominal estática", GrupoMuscular.CORE, "Estabilidad isométrica de la pared abdominal."),
                new EjercicioSemilla("Elevación de piernas colgado", GrupoMuscular.CORE, "Flexión de cadera y activación del recto abdominal."),
                new EjercicioSemilla("Rueda abdominal (Ab wheel)", GrupoMuscular.CORE, "Anti-extensión lumbar de alta demanda."),

                // CARDIO
                new EjercicioSemilla("Cinta de correr (Running)", GrupoMuscular.CARDIO, "Entrenamiento cardiovascular continuo o interválico."),
                new EjercicioSemilla("Bicicleta estática (Cycling)", GrupoMuscular.CARDIO, "Cardio de bajo impacto articular."),
                new EjercicioSemilla("Remoergómetro (Rowing)", GrupoMuscular.CARDIO, "Cardio funcional de cuerpo completo.")
        );

        for (EjercicioSemilla s : semillas) {
            if (ejercicioCatalogoRepository.findByNombreIgnoreCase(s.nombre()).isEmpty()) {
                EjercicioCatalogo nuevo = EjercicioCatalogo.builder()
                        .nombre(s.nombre())
                        .grupoMuscular(s.grupo())
                        .descripcionTecnica(s.descripcion())
                        .creadoPorUsuario(null) // Catálogo base
                        .fechaCreacion(LocalDateTime.now())
                        .build();
                ejercicioCatalogoRepository.save(nuevo);
            }
        }
    }

    private String normalizarNombre(String nombre) {
        if (nombre == null) return "";
        return nombre.trim().replaceAll("\\s+", " ");
    }

    private void migrarDatosHistoricosSiExisten() {
        try {
            // 1. Si la tabla anterior 'ejercicios' existe, migrar deduplicando nombres al catálogo
            List<Map<String, Object>> tablas = jdbcTemplate.queryForList(
                    "SELECT table_name FROM information_schema.tables WHERE table_name IN ('ejercicios', 'rutina_ejercicios')"
            );

            boolean tieneEjerciciosViejos = tablas.stream().anyMatch(t -> "ejercicios".equalsIgnoreCase(String.valueOf(t.get("table_name"))));
            boolean tieneRutinaEjercicios = tablas.stream().anyMatch(t -> "rutina_ejercicios".equalsIgnoreCase(String.valueOf(t.get("table_name"))));

            if (tieneEjerciciosViejos) {
                List<Map<String, Object>> filasViejas = jdbcTemplate.queryForList("SELECT * FROM ejercicios");
                log.info("Encontrados {} registros antiguos en tabla 'ejercicios'. Iniciando agrupación y deduplicación...", filasViejas.size());

                // Agrupar filas antiguas por nombre normalizado (trim + espacios simples + minúsculas)
                java.util.Map<String, List<Map<String, Object>>> agrupadosPorNombre = filasViejas.stream()
                        .filter(f -> f.get("nombre") != null && !String.valueOf(f.get("nombre")).trim().isEmpty())
                        .collect(java.util.stream.Collectors.groupingBy(f -> normalizarNombre(String.valueOf(f.get("nombre"))).toLowerCase()));

                log.info("Agrupados en {} nombres únicos para el catálogo global.", agrupadosPorNombre.size());

                for (java.util.Map.Entry<String, List<Map<String, Object>>> entry : agrupadosPorNombre.entrySet()) {
                    List<Map<String, Object>> filasDelGrupo = entry.getValue();
                    String nombreCanonica = normalizarNombre(String.valueOf(filasDelGrupo.get(0).get("nombre")));

                    // Asegurar EXACTAMENTE UNA entrada en el catálogo para todas las instancias de este nombre
                    EjercicioCatalogo catalogo = ejercicioCatalogoRepository.findByNombreIgnoreCase(nombreCanonica)
                            .orElseGet(() -> {
                                EjercicioCatalogo c = EjercicioCatalogo.builder()
                                        .nombre(nombreCanonica)
                                        .grupoMuscular(GrupoMuscular.PECHO)
                                        .descripcionTecnica("Migrado desde versión anterior")
                                        .creadoPorUsuario(null)
                                        .fechaCreacion(LocalDateTime.now())
                                        .build();
                                EjercicioCatalogo guardado = ejercicioCatalogoRepository.save(c);
                                log.info("Creado nuevo ejercicio en catálogo desde migración: '{}' (ID: {})", guardado.getNombre(), guardado.getId());
                                return guardado;
                            });

                    // Para cada registro viejo (incluso si 'Press banca' existía en varias rutinas con IDs viejos distintos):
                    for (Map<String, Object> fila : filasDelGrupo) {
                        Long viejoId = ((Number) fila.get("id")).longValue();
                        Long rutinaId = ((Number) fila.get("rutina_id")).longValue();
                        int series = ((Number) fila.get("series_objetivo")).intValue();
                        int reps = ((Number) fila.get("repeticiones_objetivo")).intValue();
                        Double peso = fila.get("peso_objetivo") != null ? ((Number) fila.get("peso_objetivo")).doubleValue() : null;

                        // Si existe rutina_ejercicios, vincular a la fila única del catálogo
                        if (tieneRutinaEjercicios) {
                            Integer count = jdbcTemplate.queryForObject(
                                    "SELECT count(*) FROM rutina_ejercicios WHERE rutina_id = ? AND ejercicio_catalogo_id = ?",
                                    Integer.class,
                                    rutinaId,
                                    catalogo.getId()
                            );
                            if (count == null || count == 0) {
                                jdbcTemplate.update(
                                        "INSERT INTO rutina_ejercicios (rutina_id, ejercicio_catalogo_id, series_objetivo, repeticiones_objetivo, peso_objetivo) VALUES (?, ?, ?, ?, ?)",
                                        rutinaId, catalogo.getId(), series, reps, peso
                                );
                            }
                        }

                        // REMAPEO EXPLÍCITO DE FOREIGN KEYS EN PROGRESO:
                        // Cada progreso que apuntaba al viejo ejercicio_id ahora apunta al ID unificado del catálogo
                        try {
                            int updated = jdbcTemplate.update(
                                    "UPDATE progresos SET ejercicio_catalogo_id = ? WHERE ejercicio_id = ? AND (ejercicio_catalogo_id IS NULL OR ejercicio_catalogo_id = 0)",
                                    catalogo.getId(), viejoId
                            );
                            if (updated > 0) {
                                log.info("Remapeados {} progresos con viejo ejercicio_id={} hacia catalogo_id={} ('{}')",
                                        updated, viejoId, catalogo.getId(), catalogo.getNombre());
                            }
                        } catch (Exception e) {
                            log.debug("No se pudo remapear progresos por ejercicio_id: {}", e.getMessage());
                        }
                    }
                }
            }

            // Asignar ejercicio_catalogo_id por defecto a cualquier progreso residual con null
            List<EjercicioCatalogo> catalogo = ejercicioCatalogoRepository.findAll();
            if (!catalogo.isEmpty()) {
                Long defaultCatalogoId = catalogo.get(0).getId();
                jdbcTemplate.update(
                        "UPDATE progresos SET ejercicio_catalogo_id = ? WHERE ejercicio_catalogo_id IS NULL",
                        defaultCatalogoId
                );
            }
        } catch (Exception e) {
            log.warn("Nota sobre migración automática: {}", e.getMessage());
        }
    }
}
