package com.fitlite.fitlite_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PesoCorporalResponseDTO {

    private Long id;
    private Double peso;
    private LocalDate fecha;
    private Long usuarioId;
    private String usuarioNombre;
    private String notas;
}
