package com.fitlite.fitlite_backend.entity;

import com.fitlite.fitlite_backend.enums.GrupoMuscular;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ejercicios_catalogo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EjercicioCatalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(name = "grupo_muscular")
    private GrupoMuscular grupoMuscular;

    @Column(name = "descripcion_tecnica", columnDefinition = "TEXT")
    private String descripcionTecnica;

    @Column(name = "creado_por_usuario")
    private Long creadoPorUsuario; // null si es del catálogo base/semilla

    @Column(name = "fecha_creacion")
    @Builder.Default
    private LocalDateTime fechaCreacion = LocalDateTime.now();
}
