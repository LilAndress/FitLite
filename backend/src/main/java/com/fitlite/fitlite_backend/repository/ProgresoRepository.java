package com.fitlite.fitlite_backend.repository;

import com.fitlite.fitlite_backend.entity.Progreso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProgresoRepository extends JpaRepository<Progreso, Long> {
    List<Progreso> findByUsuarioIdOrderByFechaDesc(Long usuarioId);
    List<Progreso> findByUsuarioIdAndEjercicioCatalogoIdOrderByFechaDesc(Long usuarioId, Long ejercicioCatalogoId);
    Optional<Progreso> findByUsuarioIdAndEjercicioCatalogoIdAndFecha(Long usuarioId, Long ejercicioCatalogoId, LocalDate fecha);
    boolean existsByUsuarioIdAndEjercicioCatalogoIdAndFecha(Long usuarioId, Long ejercicioCatalogoId, LocalDate fecha);
    boolean existsByUsuarioIdAndEjercicioCatalogoIdAndFechaAndIdNot(Long usuarioId, Long ejercicioCatalogoId, LocalDate fecha, Long id);
}
