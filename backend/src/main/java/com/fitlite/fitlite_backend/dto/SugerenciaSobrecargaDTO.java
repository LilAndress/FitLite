package com.fitlite.fitlite_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SugerenciaSobrecargaDTO {
    private Long rutinaId;
    private Long ejercicioId;
    private String ejercicioNombre;
    private Double pesoActual;
    private Double pesoPropuesto;
    private Integer repeticionesActuales;
    private Integer repeticionesPropuestas;
    private String tipo; // "INCREMENTO_CARGA", "INCREMENTO_REPETICIONES", "CONSOLIDACION"
    private String mensaje;
    private String justificacion;
    private String datosJustificacion;
    private Integer sesionesRestantes;
    private Boolean tieneDatosSuficientes;
}
