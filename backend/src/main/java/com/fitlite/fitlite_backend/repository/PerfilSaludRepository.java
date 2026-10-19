package com.fitlite.fitlite_backend.repository;

import com.fitlite.fitlite_backend.entity.PerfilSalud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PerfilSaludRepository extends JpaRepository<PerfilSalud, Long> {
    Optional<PerfilSalud> findByUsuarioId(Long usuarioId);
}
