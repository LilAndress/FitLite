package com.fitlite.fitlite_backend.repository;

import com.fitlite.fitlite_backend.entity.PesoCorporal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PesoCorporalRepository extends JpaRepository<PesoCorporal, Long> {

    List<PesoCorporal> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    List<PesoCorporal> findByUsuarioIdOrderByFechaAsc(Long usuarioId);

    boolean existsByUsuarioIdAndFecha(Long usuarioId, LocalDate fecha);

    boolean existsByUsuarioIdAndFechaAndIdNot(Long usuarioId, LocalDate fecha, Long id);

    Optional<PesoCorporal> findByUsuarioIdAndFecha(Long usuarioId, LocalDate fecha);
}
