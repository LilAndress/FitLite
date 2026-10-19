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
public class MensajeChatDTO {

    private Long id;
    private String rol;
    private String contenido;
    private LocalDateTime fechaCreacion;
}
