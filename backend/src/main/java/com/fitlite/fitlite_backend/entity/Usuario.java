package com.fitlite.fitlite_backend.entity;

import com.fitlite.fitlite_backend.enums.ObjetivoFisico;
import com.fitlite.fitlite_backend.enums.RolUsuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private ObjetivoFisico objetivo;

    @Enumerated(EnumType.STRING)
    private RolUsuario rol;

    @Column(name = "peso_actual")
    private Double pesoActual;

    @Column(name = "edad")
    private Integer edad;

    @Column(name = "estatura")
    private Double estatura;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_experiencia")
    private com.fitlite.fitlite_backend.enums.NivelExperiencia nivelExperiencia;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<Rutina> rutinas = new ArrayList<>();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PesoCorporal> pesosCorporales = new ArrayList<>();
}
