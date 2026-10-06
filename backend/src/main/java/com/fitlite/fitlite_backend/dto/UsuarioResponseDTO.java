package com.fitlite.fitlite_backend.dto;

import com.fitlite.fitlite_backend.enums.ObjetivoFisico;
import com.fitlite.fitlite_backend.enums.RolUsuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioResponseDTO {

    private Long id;
    private String nombre;
    private String email;
    private ObjetivoFisico objetivo;
    private RolUsuario rol;
    private Double pesoActual;
    private LocalDateTime fechaRegistro;
}
