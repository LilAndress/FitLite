package com.fitlite.fitlite_backend.dto;

import com.fitlite.fitlite_backend.enums.GrupoMuscular;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EjercicioResponseDTO {

    private Long id;
    private Long ejercicioCatalogoId;
    private String nombre;
    private GrupoMuscular grupoMuscular;
    private String descripcionTecnica;
    private int seriesObjetivo;
    private int repeticionesObjetivo;
    private Double pesoObjetivo;
    private Long rutinaId;
    private String rutinaNombre;
    private java.util.List<String> articulacionesComprometidas;
}
