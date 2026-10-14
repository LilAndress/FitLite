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
                new EjercicioSemilla("Press banca con mancuernas", GrupoMuscular.PECHO, "Mayor rango de movimiento y trabajo estabilizador pectoral."),
                new EjercicioSemilla("Press inclinado con barra", GrupoMuscular.PECHO, "Empuje pesado con barra enfocado en pectoral superior."),
                new EjercicioSemilla("Press declinado con barra", GrupoMuscular.PECHO, "Énfasis en el haz esternal e inferior del pectoral."),
                new EjercicioSemilla("Aperturas con mancuernas", GrupoMuscular.PECHO, "Aislamiento y estiramiento del pectoral en banco plano."),
                new EjercicioSemilla("Aperturas inclinadas con mancuernas", GrupoMuscular.PECHO, "Estiramiento y aislamiento del haz clavicular."),
                new EjercicioSemilla("Fondos en paralelas para pecho", GrupoMuscular.PECHO, "Empuje corporal con inclinación hacia adelante."),
                new EjercicioSemilla("Cruces en polea alta", GrupoMuscular.PECHO, "Contracción continua para el pectoral inferior e interno."),
                new EjercicioSemilla("Cruces en polea baja", GrupoMuscular.PECHO, "Aducción ascendente para pectoral superior."),
                new EjercicioSemilla("Pec Deck (Aperturas en máquina)", GrupoMuscular.PECHO, "Aislamiento guiado con tensión constante en todo el recorrido."),
                new EjercicioSemilla("Flexiones de pecho (Push-ups)", GrupoMuscular.PECHO, "Calistenia fundamental de empuje horizontal."),
                new EjercicioSemilla("Pullover con mancuerna", GrupoMuscular.PECHO, "Expansión torácica y activación de pectoral y serratos."),

                // ESPALDA
                new EjercicioSemilla("Dominadas pronas", GrupoMuscular.ESPALDA, "Tracción vertical fundamental para amplitud dorsal."),
                new EjercicioSemilla("Dominadas supinas (Chin-ups)", GrupoMuscular.ESPALDA, "Tracción vertical con fuerte implicación de dorsales y bíceps."),
                new EjercicioSemilla("Jalón al pecho en polea", GrupoMuscular.ESPALDA, "Tracción vertical controlada para dorsal ancho."),
                new EjercicioSemilla("Jalón trasnuca en polea", GrupoMuscular.ESPALDA, "Tracción vertical guiada para espalda superior."),
                new EjercicioSemilla("Remo con barra", GrupoMuscular.ESPALDA, "Tracción horizontal pesada para densidad y grosor de espalda."),
                new EjercicioSemilla("Remo Pendlay", GrupoMuscular.ESPALDA, "Remo estricto con barra desde el suelo para fuerza explosiva dorsal."),
                new EjercicioSemilla("Remo con mancuerna a una mano", GrupoMuscular.ESPALDA, "Trabajo unilateral para corregir asimetrías dorsales."),
                new EjercicioSemilla("Remo en polea baja (Gironde)", GrupoMuscular.ESPALDA, "Remo sentado con agarre estrecho para espalda media."),
                new EjercicioSemilla("Remo en barra T (T-Bar row)", GrupoMuscular.ESPALDA, "Tracción con apoyo o libre para espalda media y romboides."),
                new EjercicioSemilla("Peso muerto convencional", GrupoMuscular.ESPALDA, "Movimiento compuesto para toda la cadena posterior."),
                new EjercicioSemilla("Pull-over en polea alta con cuerda", GrupoMuscular.ESPALDA, "Aislamiento puro del dorsal ancho sin intervención de brazos."),
                new EjercicioSemilla("Hiperextensiones lumbares", GrupoMuscular.ESPALDA, "Fortalecimiento de erectores espinales y zona lumbar."),

                // HOMBROS
                new EjercicioSemilla("Press militar con barra", GrupoMuscular.HOMBROS, "Empuje vertical estricto para deltoides anterior y fuerza general."),
                new EjercicioSemilla("Press militar con mancuernas sentado", GrupoMuscular.HOMBROS, "Empuje vertical con soporte lumbar y rango libre."),
                new EjercicioSemilla("Press Arnold", GrupoMuscular.HOMBROS, "Press rotativo completo para estimulación global del hombro."),
                new EjercicioSemilla("Elevaciones laterales con mancuernas", GrupoMuscular.HOMBROS, "Aislamiento clave del deltoides lateral para amplitud."),
                new EjercicioSemilla("Elevaciones laterales en polea", GrupoMuscular.HOMBROS, "Tensión constante en la cabeza lateral del deltoides."),
                new EjercicioSemilla("Elevaciones frontales con mancuernas", GrupoMuscular.HOMBROS, "Aislamiento directo para el deltoides anterior."),
                new EjercicioSemilla("Elevaciones frontales con disco", GrupoMuscular.HOMBROS, "Trabajo de hombro anterior y trapecio con agarre neutro."),
                new EjercicioSemilla("Pájaros con mancuernas", GrupoMuscular.HOMBROS, "Enfocado en deltoides posterior y salud escapular."),
                new EjercicioSemilla("Face pulls con cuerda en polea", GrupoMuscular.HOMBROS, "Deltoides posterior, manguito rotador y salud postural."),
                new EjercicioSemilla("Remo al mentón con barra Z", GrupoMuscular.HOMBROS, "Trabajo compuesto de deltoides lateral y trapecio."),
                new EjercicioSemilla("Encogimientos de hombros con barra", GrupoMuscular.HOMBROS, "Sobrecarga pesada para hipertrofia del trapecio superior."),
                new EjercicioSemilla("Encogimientos de hombros con mancuernas", GrupoMuscular.HOMBROS, "Aislamiento de trapecios con posición neutra de brazos."),

                // BICEPS
                new EjercicioSemilla("Curl de bíceps con barra recta", GrupoMuscular.BICEPS, "Flexión de codo pesada para volumen total de bíceps."),
                new EjercicioSemilla("Curl de bíceps con barra Z", GrupoMuscular.BICEPS, "Flexión de codo biomecánicamente cómoda para muñecas."),
                new EjercicioSemilla("Curl con mancuernas alterno", GrupoMuscular.BICEPS, "Flexión unilateral con supinación activa de muñeca."),
                new EjercicioSemilla("Curl martillo con mancuernas", GrupoMuscular.BICEPS, "Trabajo de braquiorradial y braquial anterior."),
                new EjercicioSemilla("Curl en banco Scott (Predicador)", GrupoMuscular.BICEPS, "Aislamiento estricto impidiendo ayuda del hombro anterior."),
                new EjercicioSemilla("Curl concentrado en banco", GrupoMuscular.BICEPS, "Aislamiento estricto sin balanceo corporal."),
                new EjercicioSemilla("Curl en polea baja", GrupoMuscular.BICEPS, "Tensión continua durante todo el rango de flexión."),
                new EjercicioSemilla("Curl inclinado con mancuernas", GrupoMuscular.BICEPS, "Máximo estiramiento de la cabeza larga del bíceps."),
                new EjercicioSemilla("Curl araña (Spider curl)", GrupoMuscular.BICEPS, "Máxima contracción y congestión en banco inclinado."),

                // TRICEPS
                new EjercicioSemilla("Extensiones de tríceps en polea", GrupoMuscular.TRICEPS, "Aislamiento de la cabeza lateral y medial del tríceps."),
                new EjercicioSemilla("Extensiones de tríceps con cuerda", GrupoMuscular.TRICEPS, "Permite separación final para mayor contracción lateral."),
                new EjercicioSemilla("Press francés con barra Z", GrupoMuscular.TRICEPS, "Énfasis en la cabeza larga del tríceps."),
                new EjercicioSemilla("Press de banca agarre cerrado", GrupoMuscular.TRICEPS, "Empuje compuesto pesado con gran activación de tríceps."),
                new EjercicioSemilla("Fondos en banco para tríceps", GrupoMuscular.TRICEPS, "Empuje con autocarga para tríceps."),
                new EjercicioSemilla("Patada de tríceps con mancuerna", GrupoMuscular.TRICEPS, "Extensión terminal con contracción isométrica máxima."),
                new EjercicioSemilla("Extensión de tríceps sobre la cabeza", GrupoMuscular.TRICEPS, "Estiramiento profundo de la cabeza larga con mancuerna."),
                new EjercicioSemilla("Extensiones Katana en polea", GrupoMuscular.TRICEPS, "Extensión unilateral cruzada sobre la cabeza en polea."),

                // PIERNAS
                new EjercicioSemilla("Sentadilla trasera con barra", GrupoMuscular.PIERNAS, "Rey de los ejercicios de pierna: cuádriceps, glúteo y core."),
                new EjercicioSemilla("Sentadilla frontal con barra", GrupoMuscular.PIERNAS, "Mayor énfasis en cuádriceps y demanda de core vertical."),
                new EjercicioSemilla("Sentadilla Hack en máquina", GrupoMuscular.PIERNAS, "Sobrecarga segura y profunda para cuádriceps."),
                new EjercicioSemilla("Prensa de piernas 45°", GrupoMuscular.PIERNAS, "Carga guiada con volumen para cuádriceps y glúteos."),
                new EjercicioSemilla("Sentadilla goblet con mancuerna", GrupoMuscular.PIERNAS, "Sentadilla frontal ideal para movilidad y cuádriceps."),
                new EjercicioSemilla("Zancadas caminando con mancuernas", GrupoMuscular.PIERNAS, "Trabajo unilateral funcional para piernas y glúteos."),
                new EjercicioSemilla("Extensiones de cuádriceps", GrupoMuscular.PIERNAS, "Aislamiento articular en máquina."),
                new EjercicioSemilla("Curl femoral tumbado", GrupoMuscular.PIERNAS, "Flexión de rodilla para isquiosurales."),
                new EjercicioSemilla("Curl femoral sentado", GrupoMuscular.PIERNAS, "Isquiosurales con cadera en flexión para mayor hipertrofia."),
                new EjercicioSemilla("Peso muerto rumano con barra", GrupoMuscular.PIERNAS, "Bisagra de cadera pesada para isquiotibiales y glúteos."),
                new EjercicioSemilla("Peso muerto rumano con mancuernas", GrupoMuscular.PIERNAS, "Estiramiento y control excéntrico de cadena posterior."),
                new EjercicioSemilla("Elevación de talones de pie", GrupoMuscular.PIERNAS, "Trabajo de gastrocnemio y sóleo con sobrecarga."),
                new EjercicioSemilla("Elevación de talones sentado", GrupoMuscular.PIERNAS, "Aislamiento específico del músculo sóleo."),
                new EjercicioSemilla("Aductores en máquina", GrupoMuscular.PIERNAS, "Fortalecimiento de la cara interna del muslo."),

                // GLUTEOS
                new EjercicioSemilla("Hip thrust con barra", GrupoMuscular.GLUTEOS, "Máxima activación del glúteo mayor en extensión de cadera."),
                new EjercicioSemilla("Puente de glúteo en suelo", GrupoMuscular.GLUTEOS, "Extensión de cadera con peso libre o banda elástica."),
                new EjercicioSemilla("Sentadilla búlgara", GrupoMuscular.GLUTEOS, "Ejercicio unilateral excelente para glúteos y cuádriceps."),
                new EjercicioSemilla("Patada de glúteo en polea", GrupoMuscular.GLUTEOS, "Aislamiento y congestión en extensión de cadera."),
                new EjercicioSemilla("Abducción de cadera en máquina", GrupoMuscular.GLUTEOS, "Aislamiento del glúteo medio para estabilidad de cadera."),
                new EjercicioSemilla("Peso muerto sumo con barra", GrupoMuscular.GLUTEOS, "Mayor activación de glúteos y aductores en tracción."),
                new EjercicioSemilla("Step-ups en cajón con mancuernas", GrupoMuscular.GLUTEOS, "Subidas unilaterales para glúteo mayor."),
                new EjercicioSemilla("Frog pumps con mancuerna", GrupoMuscular.GLUTEOS, "Pumpeo de altas repeticiones para glúteos en suelo."),

                // CORE
                new EjercicioSemilla("Plancha abdominal estática", GrupoMuscular.CORE, "Estabilidad isométrica de la pared abdominal."),
                new EjercicioSemilla("Plancha lateral", GrupoMuscular.CORE, "Estabilidad lateral y activación de oblicuos y cuadrado lumbar."),
                new EjercicioSemilla("Elevación de piernas colgado", GrupoMuscular.CORE, "Flexión de cadera y activación del recto abdominal."),
                new EjercicioSemilla("Elevación de piernas en banco", GrupoMuscular.CORE, "Control excéntrico del abdomen inferior."),
                new EjercicioSemilla("Rueda abdominal (Ab wheel)", GrupoMuscular.CORE, "Anti-extensión lumbar de alta demanda."),
                new EjercicioSemilla("Crunch abdominal en polea alta", GrupoMuscular.CORE, "Flexión espinal con sobrecarga progresiva."),
                new EjercicioSemilla("Crunch en máquina", GrupoMuscular.CORE, "Aislamiento guiado del recto abdominal con peso añadido."),
                new EjercicioSemilla("Giros rusos con disco (Russian twists)", GrupoMuscular.CORE, "Rotación de tronco para oblicuos."),
                new EjercicioSemilla("Escaladores (Mountain climbers)", GrupoMuscular.CORE, "Resistencia dinámica de core y coordinación."),
                new EjercicioSemilla("Vacío abdominal (Stomach vacuum)", GrupoMuscular.CORE, "Activación profunda del músculo transverso abdominal."),

                // CARDIO
                new EjercicioSemilla("Cinta de correr (Running)", GrupoMuscular.CARDIO, "Entrenamiento cardiovascular continuo o interválico."),
                new EjercicioSemilla("Cinta con inclinación (Incline walk)", GrupoMuscular.CARDIO, "Cardio de bajo impacto con alta quema calórica."),
                new EjercicioSemilla("Bicicleta estática (Cycling)", GrupoMuscular.CARDIO, "Cardio de bajo impacto articular."),
                new EjercicioSemilla("Air Bike (Bicicleta de asalto)", GrupoMuscular.CARDIO, "Resistencia por aire para intervalos HIIT intensos."),
                new EjercicioSemilla("Remoergómetro (Rowing)", GrupoMuscular.CARDIO, "Cardio funcional de cuerpo completo."),
                new EjercicioSemilla("Elíptica", GrupoMuscular.CARDIO, "Movimiento fluido cardiovascular sin impacto articular."),
                new EjercicioSemilla("Salto a la comba (Jump rope)", GrupoMuscular.CARDIO, "Coordinación, agilidad y cardio de alta intensidad."),
                new EjercicioSemilla("Burpees con salto", GrupoMuscular.CARDIO, "Acondicionamiento metabólico de cuerpo entero."),
                new EjercicioSemilla("Escaladora (Stairmaster)", GrupoMuscular.CARDIO, "Trabajo cardiovascular intenso con demanda en piernas y glúteos.")
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
