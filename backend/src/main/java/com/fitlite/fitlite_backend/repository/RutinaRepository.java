package com.fitlite.fitlite_backend.repository;

import com.fitlite.fitlite_backend.entity.Rutina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RutinaRepository extends JpaRepository<Rutina, Long> {
    List<Rutina> findByUsuarioId(Long usuarioId);
    List<Rutina> findByUsuarioIdAndActivaTrue(Long usuarioId);
}
