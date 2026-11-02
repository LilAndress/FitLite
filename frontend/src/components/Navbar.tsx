import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Dumbbell, LayoutDashboard, Calendar, LineChart, Users, ChevronDown, UserCircle2, LogOut, Sparkles, User, Heart, Lock } from 'lucide-react';
import { useUser } from '../context/UserContext';

export const Navbar: React.FC = () => {
  const { activeUser, logout } = useUser();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

  const menuOptions = [
    { label: 'Mi perfil', path: '/perfil', icon: User },
    { label: 'Salud y privacidad', path: '/perfil#salud', icon: Heart },
    { label: 'Seguridad', path: '/perfil#seguridad', icon: Lock },
    ...(activeUser?.rol === 'ADMIN' ? [{ label: 'Gestionar usuarios', path: '/usuarios', icon: Users }] : []),
  ];

  const totalMenuItems = menuOptions.length + 1; // +1 for Cerrar sesión

  // Close on click outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Handle focus when navigating with keyboard
  useEffect(() => {
    if (isMenuOpen && focusedIndex >= 0) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [isMenuOpen, focusedIndex]);

  // Keyboard navigation inside dropdown menu
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (!isMenuOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const next = prev < 0 ? 0 : (prev + 1) % totalMenuItems;
        itemRefs.current[next]?.focus();
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const next = prev <= 0 ? totalMenuItems - 1 : prev - 1;
        itemRefs.current[next]?.focus();
        return next;
      });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsMenuOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'Tab') {
      setIsMenuOpen(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Rutinas', path: '/rutinas', icon: Calendar },
    { label: 'Progreso', path: '/progreso', icon: LineChart },
    { label: 'Coach IA', path: '/coach', icon: Sparkles },
    ...(activeUser?.rol === 'ADMIN' ? [{ label: 'Usuarios', path: '/usuarios', icon: Users }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--surface)] border-b border-[var(--border)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo: Clean modern fitness aesthetic */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-150">
              <Dumbbell className="w-4 h-4" strokeWidth={2} />
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

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] font-semibold border border-[var(--border)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className="w-4 h-4 transition-colors"
                        strokeWidth={2}
                        color={isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'}
                      />
                      <span className="font-inter">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                ref={buttonRef}
                type="button"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                aria-label="Menú de usuario"
                onClick={() => {
                  setIsMenuOpen((prev) => !prev);
                  setFocusedIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsMenuOpen(true);
                    setFocusedIndex(0);
                  }
                }}
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 transition-all text-left cursor-pointer focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center font-bold text-xs font-space">
                  {activeUser ? activeUser.nombre.charAt(0).toUpperCase() : <UserCircle2 className="w-3.5 h-3.5" strokeWidth={2} />}
                </div>
                <div className="hidden sm:block text-xs font-inter leading-tight">
                  <p className="font-semibold text-[var(--text-primary)]">
                    {activeUser ? activeUser.nombre : 'Sin usuario'}
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium font-inter capitalize">
                    {activeUser ? (activeUser.rol === 'ADMIN' ? 'Admin' : activeUser.objetivo.toLowerCase().replace('_', ' ')) : 'Acceso'}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform duration-150 ${
                    isMenuOpen ? 'rotate-180 text-[var(--accent-primary)]' : ''
                  }`}
                  strokeWidth={2}
                />
              </button>

              {/* Dropdown Menu */}
              <div
                ref={dropdownRef}
                role="menu"
                aria-orientation="vertical"
                tabIndex={-1}
                onKeyDown={handleMenuKeyDown}
                className={`absolute right-0 mt-2 w-64 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl transition-all duration-150 ease-out z-50 ${
                  isMenuOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto visible'
                    : 'opacity-0 -translate-y-2 pointer-events-none invisible'
                }`}
              >
                {/* Perfil del usuario activo con rol */}
                <div className="px-3 py-2.5 border-b border-[var(--border)] mb-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-xs font-semibold text-[var(--text-primary)] font-space truncate">
                      {activeUser?.nombre}
                    </p>
                    <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-space tracking-wide">
                      {activeUser?.rol === 'ADMIN' ? 'Admin' : activeUser?.rol === 'ENTRENADOR' ? 'Entrenador' : 'Usuario'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] font-inter truncate">
                    {activeUser?.email}
                  </p>
                </div>

                {/* Opciones del menú */}
                <div className="space-y-0.5" role="none">
                  {menuOptions.map((item, index) => {
                    const Icon = item.icon;
                    const isFocused = focusedIndex === index;
                    return (
                      <Link
                        key={item.path}
                        ref={(el) => { itemRefs.current[index] = el; }}
                        to={item.path}
                        role="menuitem"
                        tabIndex={isMenuOpen ? 0 : -1}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] hover:bg-white/[0.05] transition-colors duration-150 font-medium font-inter outline-none focus:bg-white/[0.08] focus:text-[var(--accent-primary)] ${
                          isFocused ? 'bg-white/[0.08] text-[var(--accent-primary)]' : ''
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[var(--text-secondary)] stroke-[1.8] shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Línea separadora */}
                <div className="my-1 border-t border-[var(--border)]" role="separator" />

                {/* Cerrar sesión */}
                <button
                  ref={(el) => { itemRefs.current[menuOptions.length] = el; }}
                  role="menuitem"
                  tabIndex={isMenuOpen ? 0 : -1}
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 transition-colors duration-150 font-medium font-inter cursor-pointer text-left outline-none focus:bg-[var(--accent-error)]/10"
                >
                  <LogOut className="w-4 h-4 text-[var(--accent-error)] stroke-[1.8] shrink-0" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
            {activeUser ? (
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-red-500/40 text-xs font-semibold text-[var(--text-secondary)] hover:text-red-400 transition-all font-inter active:scale-95"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--accent-primary)] text-[#0D1117] text-xs font-semibold hover:brightness-105 active:scale-95 transition-all font-inter"
              >
                Acceso
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[var(--border)]">
          {[
            ...navItems,
            { label: 'Perfil', path: '/perfil', icon: UserCircle2 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 text-[11px] py-1 px-3 rounded-full font-inter ${
                    isActive ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-secondary)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className="w-4 h-4"
                      strokeWidth={2}
                      color={isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
};
