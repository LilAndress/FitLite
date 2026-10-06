package com.fitlite.fitlite_backend.dto;

import com.fitlite.fitlite_backend.enums.GrupoMuscular;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EjercicioCatalogoResponseDTO {

    private Long id;
    private String nombre;
    private GrupoMuscular grupoMuscular;
    private String descripcionTecnica;
    private Long creadoPorUsuario;
    private LocalDateTime fechaCreacion;
}
