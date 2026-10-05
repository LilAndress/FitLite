import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Dumbbell, LayoutDashboard, Calendar, LineChart, Users, ChevronDown, UserCircle2 } from 'lucide-react';
import { useUser } from '../context/UserContext';

export const Navbar: React.FC = () => {
  const { activeUser, users, setActiveUser } = useUser();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Rutinas', path: '/rutinas', icon: Calendar },
    { label: 'Progreso', path: '/progreso', icon: LineChart },
    { label: 'Usuarios', path: '/usuarios', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--surface)] border-b border-[var(--border)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo: Clean modern fitness aesthetic */}
          <Link to="/" className="flex items-center gap-2.5 group">
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

          {/* User Selector Dropdown */}
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
                    {activeUser ? activeUser.objetivo.toLowerCase().replace('_', ' ') : 'Seleccionar'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" strokeWidth={2} />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-56 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <div className="px-4 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] font-inter border-b border-[var(--border)]">
                  Cambiar usuario activo
                </div>
                {users.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-[var(--text-secondary)] font-inter">No hay usuarios</div>
                ) : (
                  users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setActiveUser(u)}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-[var(--bg-primary)] transition-colors ${
                        activeUser?.id === u.id ? 'text-[var(--accent-primary)] font-semibold bg-[var(--bg-primary)]/80' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="truncate font-inter">{u.nombre}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--border)]/60 text-[var(--text-secondary)] font-space">
                        #{u.id}
                      </span>
                    </button>
                  ))
                )}
                <div className="border-t border-[var(--border)] mt-1.5 pt-1.5 px-2">
                  <Link
                    to="/usuarios"
                    className="flex items-center justify-between px-3 py-1.5 rounded-full text-xs text-[var(--accent-primary)] hover:bg-[var(--bg-primary)] font-semibold transition-colors font-inter"
                  >
                    <span>Gestionar usuarios</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
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
