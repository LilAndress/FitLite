package com.fitlite.fitlite_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EliminarCuentaDTO {

    @NotBlank(message = "Debe proporcionar la contraseña para confirmar la eliminación")
    private String password;
}
