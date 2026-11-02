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
public class SugerenciaSesionRequestDTO {
    private Long usuarioId;
    private Long rutinaId;
    private String esfuerzoGeneral; // "FACIL", "JUSTO", "DURO"
    private boolean sintioDolor;
    private List<EjercicioSesionFeedbackDTO> ejercicios;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EjercicioSesionFeedbackDTO {
        private Long ejercicioId;
        private String ejercicioNombre;
        private int seriesRealizadas;
        private int repeticionesRealizadas;
        private double pesoRealizado;
        private boolean saltado;
        private String esfuerzo;
    }
}
