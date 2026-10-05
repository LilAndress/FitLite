package com.fitlite.fitlite_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "progresos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Progreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "series_realizadas")
    private int seriesRealizadas;

    @Column(name = "repeticiones_realizadas")
    private int repeticionesRealizadas;

    @Column(name = "peso_realizado")
    private Double pesoRealizado;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "ejercicio_id", nullable = false)
    private Ejercicio ejercicio;
}
