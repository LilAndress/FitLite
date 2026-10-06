package com.fitlite.fitlite_backend.repository;

import com.fitlite.fitlite_backend.entity.EjercicioCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EjercicioCatalogoRepository extends JpaRepository<EjercicioCatalogo, Long> {
    List<EjercicioCatalogo> findByNombreContainingIgnoreCase(String query);
    Optional<EjercicioCatalogo> findByNombreIgnoreCase(String nombre);
}
