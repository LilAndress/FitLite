package com.fitlite.fitlite_backend.dto;

import com.fitlite.fitlite_backend.enums.LugarEntrenamiento;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfilSaludRequestDTO {

    private Boolean tieneDiscapacidad;
    private String detalleDiscapacidad;

    @Builder.Default
    private List<String> zonasMolestia = new ArrayList<>();

    private String enfermedadesPreexistentes;

    private LugarEntrenamiento lugarEntrenamiento;

    @Builder.Default
    private List<String> equipamientoDisponible = new ArrayList<>();

    @Min(value = 1, message = "Los días por semana deben ser al menos 1")
    @Max(value = 7, message = "Los días por semana no pueden exceder 7")
    private Integer diasDisponiblesSemana;

    @Min(value = 10, message = "Los minutos por sesión deben ser al menos 10")
    @Max(value = 240, message = "Los minutos por sesión no pueden exceder 240")
    private Integer minutosPorSesion;
}
