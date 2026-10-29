package com.fitlite.fitlite_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RutinaIaGuardarRequestDTO {

    @NotNull(message = "El ID del usuario es obligatorio")
    private Long usuarioId;

    @NotBlank(message = "El nombre de la rutina es obligatorio")
    private String nombre;

    private String descripcion;

    @NotNull(message = "La lista de ejercicios es obligatoria")
    private List<EjercicioGuardarDTO> ejercicios;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EjercicioGuardarDTO {
        private String nombre;
        private String grupoMuscular;
        private int seriesObjetivo;
        private int repeticionesObjetivo;
        private Double pesoObjetivo;
    }
}
