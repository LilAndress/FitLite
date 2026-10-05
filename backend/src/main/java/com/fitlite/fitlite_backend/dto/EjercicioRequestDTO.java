package com.fitlite.fitlite_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EjercicioRequestDTO {

    @NotBlank(message = "El nombre del ejercicio es obligatorio")
    private String nombre;

    @Positive(message = "Las series objetivo deben ser mayores a 0")
    private int seriesObjetivo;

    @Positive(message = "Las repeticiones objetivo deben ser mayores a 0")
    private int repeticionesObjetivo;

    private Double pesoObjetivo;

    @NotNull(message = "El ID de la rutina es obligatorio")
    private Long rutinaId;
}
