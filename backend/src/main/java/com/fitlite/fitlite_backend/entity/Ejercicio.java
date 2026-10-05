package com.fitlite.fitlite_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ejercicios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ejercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "series_objetivo")
    private int seriesObjetivo;

    @Column(name = "repeticiones_objetivo")
    private int repeticionesObjetivo;

    @Column(name = "peso_objetivo")
    private Double pesoObjetivo;

    @ManyToOne
    @JoinColumn(name = "rutina_id", nullable = false)
    private Rutina rutina;
}
