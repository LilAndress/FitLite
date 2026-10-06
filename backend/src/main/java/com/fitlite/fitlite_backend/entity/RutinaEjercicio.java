package com.fitlite.fitlite_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "rutina_ejercicios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RutinaEjercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "rutina_id", nullable = false)
    private Rutina rutina;

    @ManyToOne
    @JoinColumn(name = "ejercicio_catalogo_id", nullable = false)
    private EjercicioCatalogo ejercicioCatalogo;

    @Column(name = "series_objetivo")
    private int seriesObjetivo;

    @Column(name = "repeticiones_objetivo")
    private int repeticionesObjetivo;

    @Column(name = "peso_objetivo")
    private Double pesoObjetivo;
}
