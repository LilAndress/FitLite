package com.fitlite.fitlite_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RutinaRequestDTO {

    @NotBlank(message = "El nombre de la rutina es obligatorio")
    private String nombre;

    private String descripcion;

    @Builder.Default
    private Boolean activa = true;

    @NotNull(message = "El ID del usuario es obligatorio")
    private Long usuarioId;
}
