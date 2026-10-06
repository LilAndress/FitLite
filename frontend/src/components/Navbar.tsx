import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Dumbbell, LayoutDashboard, Calendar, LineChart, Users, ChevronDown, UserCircle2, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext';

export const Navbar: React.FC = () => {
  const { activeUser, logout } = useUser();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Rutinas', path: '/rutinas', icon: Calendar },
    { label: 'Progreso', path: '/progreso', icon: LineChart },
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
            <div className="relative group">
              <button className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 transition-all text-left">
                <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center font-bold text-xs font-space">
                  {activeUser ? activeUser.nombre.charAt(0).toUpperCase() : <UserCircle2 className="w-3.5 h-3.5" strokeWidth={2} />}
                </div>
                <div className="hidden sm:block text-xs font-inter leading-tight">
                  <p className="font-semibold text-[var(--text-primary)]">
                    {activeUser ? activeUser.nombre : 'Sin usuario'}
                  </p>
                  <p className="text-[10px] text-[var(--accent-secondary)] font-medium font-inter capitalize">
                    {activeUser ? (activeUser.rol === 'ADMIN' ? 'Admin' : activeUser.objetivo.toLowerCase().replace('_', ' ')) : 'Acceso'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" strokeWidth={2} />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-64 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                {/* Perfil del usuario activo */}
                <div className="px-2 py-2 border-b border-[var(--border)] mb-2">
                  <p className="text-xs font-semibold text-[var(--text-primary)] font-space truncate">
                    {activeUser?.nombre}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] font-inter truncate">
                    {activeUser?.email}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-space tracking-wide ${
                      activeUser?.rol === 'ADMIN'
                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40'
                        : 'bg-[var(--accent-secondary)]/15 text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/40'
                    }`}>
                      ROL: {activeUser?.rol || 'USUARIO'}
                    </span>
                  </div>
                </div>

                {/* Acceso a Gestión de Usuarios SOLO si es ADMIN */}
                {activeUser?.rol === 'ADMIN' && (
                  <Link
                    to="/usuarios"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--accent-primary)] hover:bg-[var(--bg-primary)] font-semibold transition-colors font-inter mb-1"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>Gestionar usuarios</span>
                    </span>
                    <span>→</span>
                  </Link>
                )}

                {/* Cerrar sesión */}
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-[var(--bg-primary)] font-semibold transition-colors font-inter cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar sesión</span>
                  </span>
                  <span>✕</span>
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
          {navItems.map((item) => {
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
