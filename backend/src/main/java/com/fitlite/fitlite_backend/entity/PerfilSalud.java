package com.fitlite.fitlite_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fitlite.fitlite_backend.enums.LugarEntrenamiento;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "perfiles_salud")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfilSalud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Usuario usuario;

    @Column(name = "tiene_discapacidad")
    @Builder.Default
    private Boolean tieneDiscapacidad = false;

    @Column(name = "detalle_discapacidad", length = 500)
    private String detalleDiscapacidad;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuario_molestias_zonas", joinColumns = @JoinColumn(name = "perfil_id"))
    @Column(name = "zona")
    @Builder.Default
    private List<String> zonasMolestia = new ArrayList<>();

    @Column(name = "enfermedades_preexistentes", length = 500)
    private String enfermedadesPreexistentes;

    @Enumerated(EnumType.STRING)
    @Column(name = "lugar_entrenamiento")
    private LugarEntrenamiento lugarEntrenamiento;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuario_equipamiento", joinColumns = @JoinColumn(name = "perfil_id"))
    @Column(name = "equipo")
    @Builder.Default
    private List<String> equipamientoDisponible = new ArrayList<>();

    @Column(name = "dias_disponibles_semana")
    private Integer diasDisponiblesSemana;

    @Column(name = "minutos_por_sesion")
    private Integer minutosPorSesion;

    @Column(name = "fecha_actualizacion")
    @Builder.Default
    private LocalDateTime fechaActualizacion = LocalDateTime.now();
}
