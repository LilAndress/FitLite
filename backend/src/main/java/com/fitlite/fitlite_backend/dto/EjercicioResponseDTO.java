package com.fitlite.fitlite_backend.dto;

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
    private String nombre;
    private int seriesObjetivo;
    private int repeticionesObjetivo;
    private Double pesoObjetivo;
    private Long rutinaId;
    private String rutinaNombre;
}
