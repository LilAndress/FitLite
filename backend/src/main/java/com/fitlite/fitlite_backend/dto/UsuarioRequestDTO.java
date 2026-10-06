package com.fitlite.fitlite_backend.dto;

import com.fitlite.fitlite_backend.enums.NivelExperiencia;
import com.fitlite.fitlite_backend.enums.ObjetivoFisico;
import com.fitlite.fitlite_backend.enums.RolUsuario;
import jakarta.validation.constraints.Email;
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

    private RolUsuario rol;

    @Positive(message = "El peso actual debe ser mayor a 0")
    private Double pesoActual;

    @Positive(message = "La edad debe ser mayor a 0")
    private Integer edad;

    @Positive(message = "La estatura debe ser mayor a 0")
    private Double estatura;

    private NivelExperiencia nivelExperiencia;
}
