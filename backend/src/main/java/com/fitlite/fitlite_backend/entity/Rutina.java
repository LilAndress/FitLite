package com.fitlite.fitlite_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rutinas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Rutina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    @Column(name = "fecha_asignacion")
    private LocalDateTime fechaAsignacion = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean activa = true;

    @Column(name = "generada_por_ia", nullable = false)
    private Boolean generadaPorIa = false;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @OneToMany(mappedBy = "rutina", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RutinaEjercicio> ejercicios = new ArrayList<>();

    public boolean isGeneradaPorIa() {
        return Boolean.TRUE.equals(generadaPorIa);
    }

    public boolean isActiva() {
        return activa == null || activa;
    }
}
