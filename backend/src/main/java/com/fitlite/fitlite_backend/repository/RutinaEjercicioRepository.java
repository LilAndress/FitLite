package com.fitlite.fitlite_backend.repository;

import com.fitlite.fitlite_backend.entity.RutinaEjercicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RutinaEjercicioRepository extends JpaRepository<RutinaEjercicio, Long> {
    List<RutinaEjercicio> findByRutinaId(Long rutinaId);
    List<RutinaEjercicio> findByEjercicioCatalogoId(Long ejercicioCatalogoId);
}
