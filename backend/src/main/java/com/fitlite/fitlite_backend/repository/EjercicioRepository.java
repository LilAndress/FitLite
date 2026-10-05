package com.fitlite.fitlite_backend.repository;

import com.fitlite.fitlite_backend.entity.Ejercicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EjercicioRepository extends JpaRepository<Ejercicio, Long> {
    List<Ejercicio> findByRutinaId(Long rutinaId);
}
