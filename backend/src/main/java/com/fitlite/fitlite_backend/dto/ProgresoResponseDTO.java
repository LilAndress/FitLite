package com.fitlite.fitlite_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgresoResponseDTO {

    private Long id;
    private LocalDate fecha;
    private int seriesRealizadas;
    private int repeticionesRealizadas;
    private Double pesoRealizado;
    private Long usuarioId;
    private String usuarioNombre;
    private Long ejercicioId;
    private String ejercicioNombre;
}
