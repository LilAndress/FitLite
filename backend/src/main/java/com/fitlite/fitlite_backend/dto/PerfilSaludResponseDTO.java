package com.fitlite.fitlite_backend.dto;

import com.fitlite.fitlite_backend.enums.LugarEntrenamiento;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfilSaludResponseDTO {

    private Long id;
    private Long usuarioId;
    private Boolean tieneDiscapacidad;
    private String detalleDiscapacidad;

    @Builder.Default
    private List<String> zonasMolestia = new ArrayList<>();

    private String enfermedadesPreexistentes;
    private LugarEntrenamiento lugarEntrenamiento;

    @Builder.Default
    private List<String> equipamientoDisponible = new ArrayList<>();

    private Integer diasDisponiblesSemana;
    private Integer minutosPorSesion;
    private LocalDateTime fechaActualizacion;
}
