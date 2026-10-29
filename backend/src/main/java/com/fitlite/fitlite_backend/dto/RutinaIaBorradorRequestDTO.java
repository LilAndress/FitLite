package com.fitlite.fitlite_backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RutinaIaBorradorRequestDTO {

    @NotNull(message = "El ID del usuario es obligatorio")
    private Long usuarioId;

    @NotNull(message = "Los días por semana son obligatorios")
    @Min(value = 2, message = "Mínimo 2 días por semana")
    @Max(value = 6, message = "Máximo 6 días por semana")
    private Integer diasPorSemana;

    @NotNull(message = "Los minutos por sesión son obligatorios")
    private Integer minutosPorSesion;

    private String enfoque;
}
