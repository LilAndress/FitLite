package com.fitlite.fitlite_backend.service;

import com.fitlite.fitlite_backend.dto.ActualizarPesoRequestDTO;
import com.fitlite.fitlite_backend.dto.PesoCorporalRequestDTO;
import com.fitlite.fitlite_backend.dto.UsuarioRequestDTO;
import com.fitlite.fitlite_backend.dto.UsuarioResponseDTO;
import com.fitlite.fitlite_backend.entity.PesoCorporal;
import com.fitlite.fitlite_backend.entity.Usuario;
import com.fitlite.fitlite_backend.enums.ObjetivoFisico;
import com.fitlite.fitlite_backend.enums.RolUsuario;
import com.fitlite.fitlite_backend.repository.PesoCorporalRepository;
import com.fitlite.fitlite_backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioPesoServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PesoCorporalRepository pesoCorporalRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    @InjectMocks
    private PesoCorporalService pesoCorporalService;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("Carlos Mendoza");
        usuario.setEmail("carlos@fitlite.com");
        usuario.setPassword("123456");
        usuario.setObjetivo(ObjetivoFisico.GANAR_MASA);
        usuario.setRol(RolUsuario.USUARIO);
        usuario.setPesoActual(75.0);
    }

    @Test
    void crearUsuario_ConPesoActual_GuardaHistoricoEnPesoCorporal() {
        UsuarioRequestDTO request = UsuarioRequestDTO.builder()
                .nombre("Carlos Mendoza")
                .email("carlos@fitlite.com")
                .password("123456")
                .objetivo(ObjetivoFisico.GANAR_MASA)
                .rol(RolUsuario.USUARIO)
                .pesoActual(75.5)
                .build();

        when(usuarioRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        UsuarioResponseDTO response = usuarioService.crearUsuario(request);

        assertNotNull(response);
        assertEquals(75.5, response.getPesoActual());

        // Verificar que se guardó el histórico en la tabla de peso corporal
        ArgumentCaptor<PesoCorporal> captor = ArgumentCaptor.forClass(PesoCorporal.class);
        verify(pesoCorporalRepository, times(1)).save(captor.capture());
        PesoCorporal pesoGuardado = captor.getValue();
        assertEquals(75.5, pesoGuardado.getPeso());
        assertEquals(1L, pesoGuardado.getUsuario().getId());
    }

    @Test
    void actualizarPesoActual_ActualizaUsuarioYGuardaHistorico() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ActualizarPesoRequestDTO request = ActualizarPesoRequestDTO.builder()
                .peso(77.2)
                .fecha(LocalDate.now())
                .notas("Control semanal")
                .build();

        UsuarioResponseDTO response = usuarioService.actualizarPesoActual(1L, request);

        assertEquals(77.2, response.getPesoActual());
        assertEquals(77.2, usuario.getPesoActual());

        ArgumentCaptor<PesoCorporal> captor = ArgumentCaptor.forClass(PesoCorporal.class);
        verify(pesoCorporalRepository, times(1)).save(captor.capture());
        PesoCorporal guardado = captor.getValue();
        assertEquals(77.2, guardado.getPeso());
        assertEquals("Control semanal", guardado.getNotas());
    }

    @Test
    void registrarPesoDesdePesoCorporalService_SincronizaPesoActualEnUsuario() {
        pesoCorporalService = new PesoCorporalService(pesoCorporalRepository, usuarioRepository);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(pesoCorporalRepository.save(any(PesoCorporal.class))).thenAnswer(invocation -> {
            PesoCorporal p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });

        PesoCorporalRequestDTO request = PesoCorporalRequestDTO.builder()
                .usuarioId(1L)
                .peso(78.0)
                .fecha(LocalDate.now())
                .notas("Medición en ayunas")
                .build();

        var response = pesoCorporalService.registrarPeso(request);

        assertEquals(78.0, response.getPeso());
        assertEquals(78.0, usuario.getPesoActual());
        verify(usuarioRepository, times(1)).save(usuario);
    }
}
