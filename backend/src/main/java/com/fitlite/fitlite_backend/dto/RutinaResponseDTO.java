package com.fitlite.fitlite_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RutinaResponseDTO {

    private Long id;
    private String nombre;
    private String descripcion;
    private LocalDateTime fechaAsignacion;
    private boolean activa;
    private Long usuarioId;
    private String usuarioNombre;
}
