package com.fitlite.fitlite_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RutinaIaBorradorResponseDTO {

    private String nombre;
    private String descripcion;
    private String razonamiento;
    private List<EjercicioBorradorDTO> ejercicios;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EjercicioBorradorDTO {
        private String nombre;
        private String grupoMuscular;
        private int seriesObjetivo;
        private int repeticionesObjetivo;
        private Double pesoObjetivo;
        private String nota;
    }
}
