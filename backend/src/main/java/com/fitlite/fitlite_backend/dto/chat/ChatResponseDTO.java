package com.fitlite.fitlite_backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponseDTO {

    private String respuesta;
    private String rol;
    private LocalDateTime fecha;
    private Boolean apiConfigurada;
    private String advertencia;
}
