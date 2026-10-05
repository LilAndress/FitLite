package com.fitlite.fitlite_backend.repository;

import com.fitlite.fitlite_backend.entity.Progreso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgresoRepository extends JpaRepository<Progreso, Long> {
    List<Progreso> findByUsuarioIdOrderByFechaDesc(Long usuarioId);
    List<Progreso> findByUsuarioIdAndEjercicioIdOrderByFechaDesc(Long usuarioId, Long ejercicioId);
}
