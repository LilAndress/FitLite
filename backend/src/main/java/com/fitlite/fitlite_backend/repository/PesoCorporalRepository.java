package com.fitlite.fitlite_backend.repository;

import com.fitlite.fitlite_backend.entity.PesoCorporal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PesoCorporalRepository extends JpaRepository<PesoCorporal, Long> {

    List<PesoCorporal> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    List<PesoCorporal> findByUsuarioIdOrderByFechaAsc(Long usuarioId);
}
