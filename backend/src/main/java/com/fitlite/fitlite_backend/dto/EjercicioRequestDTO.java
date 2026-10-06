package com.fitlite.fitlite_backend.dto;

import com.fitlite.fitlite_backend.enums.GrupoMuscular;
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

    private Long ejercicioCatalogoId;

    private String nombre;

    private GrupoMuscular grupoMuscular;

    private String descripcionTecnica;

    @Positive(message = "Las series objetivo deben ser mayores a 0")
    private int seriesObjetivo;

    @Positive(message = "Las repeticiones objetivo deben ser mayores a 0")
    private int repeticionesObjetivo;

    private Double pesoObjetivo;

    @NotNull(message = "El ID de la rutina es obligatorio")
    private Long rutinaId;
}
