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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <Dumbbell className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight font-['Outfit'] bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Fit<span className="text-emerald-400">Lite</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-900 text-emerald-400 shadow-inner border border-slate-800'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Selector Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-semibold text-xs border border-emerald-500/30">
                  {activeUser ? activeUser.nombre.charAt(0).toUpperCase() : <UserCircle2 className="w-4 h-4" />}
                </div>
                <div className="hidden sm:block text-xs">
                  <p className="font-semibold text-slate-200 leading-tight">
                    {activeUser ? activeUser.nombre : 'Sin usuario'}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-medium">
                    {activeUser ? activeUser.objetivo.replace('_', ' ') : 'Seleccionar'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-56 py-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Cambiar Usuario Activo
                </div>
                {users.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400">No hay usuarios registrados</div>
                ) : (
                  users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setActiveUser(u)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        activeUser?.id === u.id ? 'text-emerald-400 font-bold bg-slate-800/40' : 'text-slate-300'
                      }`}
                    >
                      <span className="truncate">{u.nombre}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        #{u.id}
                      </span>
                    </button>
                  ))
                )}
                <div className="border-t border-slate-800 mt-1 pt-1">
                  <Link
                    to="/usuarios"
                    className="block px-3 py-1.5 text-xs text-emerald-400 hover:bg-slate-800 transition-colors font-medium"
                  >
                    + Gestionar / Crear Usuario
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 text-[11px] py-1 px-3 rounded-lg ${
                    isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
};
