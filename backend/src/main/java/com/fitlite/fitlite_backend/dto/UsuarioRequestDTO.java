package com.fitlite.fitlite_backend.dto;

import com.fitlite.fitlite_backend.enums.ObjetivoFisico;
import com.fitlite.fitlite_backend.enums.RolUsuario;
import jakarta.validation.constraints.Email;
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
public class UsuarioRequestDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato de email no es válido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;

    @NotNull(message = "El objetivo físico es obligatorio")
    private ObjetivoFisico objetivo;

    @NotNull(message = "El rol es obligatorio")
    private RolUsuario rol;
}
