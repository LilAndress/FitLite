package com.fitlite.fitlite_backend.dto;

import com.fitlite.fitlite_backend.enums.NivelExperiencia;
import com.fitlite.fitlite_backend.enums.ObjetivoFisico;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActualizarPerfilDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato de email no es válido")
    private String email;

    /** Si se cambia el correo, debe proporcionar la contraseña actual para confirmación */
    private String passwordConfirmacion;

    private ObjetivoFisico objetivo;

    @Positive(message = "La edad debe ser mayor a 0")
    private Integer edad;

    @Positive(message = "La estatura debe ser mayor a 0")
    private Double estatura;

    private NivelExperiencia nivelExperiencia;

    private PerfilSaludRequestDTO perfilSalud;

    /** Consentimiento explícito para usar datos de salud en personalización con IA */
    private Boolean consentimientoIA;
}
