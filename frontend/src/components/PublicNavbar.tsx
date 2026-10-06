import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Menu, X, ArrowRight } from 'lucide-react';
import { useUser } from '../context/UserContext';

export const PublicNavbar: React.FC = () => {
  const { activeUser } = useUser();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0D1117]/85 backdrop-blur-md border-b border-[var(--border)]/70 py-3 shadow-lg'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo FitLite a la izquierda */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Dumbbell className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight font-space text-[var(--text-primary)]">
                Fit<span className="text-[var(--accent-primary)]">Lite</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-space">
                Pro
              </span>
            </div>
          </Link>

          {/* Links al centro: Características y Cómo funciona */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('caracteristicas')}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors font-inter cursor-pointer"
            >
              Características
            </button>
            <button
              onClick={() => scrollToSection('como-funciona')}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors font-inter cursor-pointer"
            >
              Cómo funciona
            </button>
          </nav>

          {/* Botones de acción a la derecha */}
          <div className="hidden sm:flex items-center gap-3">
            {activeUser ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter shadow-sm"
              >
                <span>Ir al Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] transition-all font-inter active:scale-95"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold tracking-wide hover:brightness-105 active:scale-95 transition-all font-inter shadow-sm"
                >
                  <span>Registrarse</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Botón menú móvil */}
          <div className="flex md:hidden items-center gap-2">
            {activeUser ? (
              <Link
                to="/dashboard"
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--accent-primary)] font-inter"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-inter"
              >
                Acceso
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D1117]/95 border-b border-[var(--border)] px-4 py-5 space-y-4 backdrop-blur-xl animate-fadeIn">
          <nav className="flex flex-col space-y-3">
            <button
              onClick={() => scrollToSection('caracteristicas')}
              className="text-left text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] py-1 font-inter"
            >
              Características
            </button>
            <button
              onClick={() => scrollToSection('como-funciona')}
              className="text-left text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] py-1 font-inter"
            >
              Cómo funciona
            </button>
          </nav>
          <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2.5">
            {activeUser ? (
              <Link
                to="/dashboard"
                className="w-full text-center py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter shadow-md"
              >
                Ir al Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] font-inter"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="w-full text-center py-2.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold font-inter shadow-md"
                >
                  Registrarse gratis
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
