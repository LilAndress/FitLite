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
public class OnboardingRequestDTO {

    private Long usuarioId;
    private String situacionInicial;
    private String tiempoTotalEntrenando;
    private String tiempoSinEntrenar;
    private List<PesoDeclaradoDTO> pesosDeclarados;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PesoDeclaradoDTO {
        private Long ejercicioCatalogoId;
        private String ejercicioNombre;
        private Double peso;
        private Integer repeticiones;
    }
}
