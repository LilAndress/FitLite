package com.fitlite.fitlite_backend.repository;

import com.fitlite.fitlite_backend.entity.MensajeChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensajeChatRepository extends JpaRepository<MensajeChat, Long> {

    List<MensajeChat> findByUsuarioIdOrderByFechaCreacionAsc(Long usuarioId);

    List<MensajeChat> findTop20ByUsuarioIdOrderByFechaCreacionDesc(Long usuarioId);

    @Modifying
    @Query("DELETE FROM MensajeChat m WHERE m.usuario.id = :usuarioId")
    void deleteByUsuarioId(Long usuarioId);
}
