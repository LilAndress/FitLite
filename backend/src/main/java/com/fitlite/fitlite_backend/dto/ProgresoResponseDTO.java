package com.fitlite.fitlite_backend.dto;

import com.fitlite.fitlite_backend.enums.GrupoMuscular;
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
    private Long ejercicioCatalogoId;
    private Long ejercicioId; // Alias para compatibilidad hacia atrás
    private String ejercicioNombre;
    private GrupoMuscular grupoMuscular;
}
