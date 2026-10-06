package com.fitlite.fitlite_backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgresoRequestDTO {

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @Positive(message = "Las series realizadas deben ser mayores a 0")
    private int seriesRealizadas;

    @Positive(message = "Las repeticiones realizadas deben ser mayores a 0")
    private int repeticionesRealizadas;

    private Double pesoRealizado;

    @NotNull(message = "El ID del usuario es obligatorio")
    private Long usuarioId;

    // Puede recibirse como ejercicioCatalogoId o como ejercicioId (para compatibilidad total)
    private Long ejercicioCatalogoId;
    private Long ejercicioId;
}
