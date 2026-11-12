import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../notifications/NotificationBell';
import AppearanceMenu from './AppearanceMenu';
import { 
  Hotel, 
  User, 
  LogOut, 
  CalendarCheck, 
  BarChart3, 
  ClipboardList, 
  LogIn,
  UserPlus,
  BedDouble,
  Users,
  DollarSign,
  BookOpen,
  ChevronDown,
  Menu,
  X,
  FileText,
  MoreHorizontal
} from 'lucide-react';

function DropdownMenu({ label, icon: Icon, items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
      >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-scaleIn origin-top-right">
          {items.map((item, i) => (
            <Link
              key={i}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium transition-colors"
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">Admin</span>;
      case 'staff':
        return <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">Staff</span>;
      default:
        return <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">Huésped</span>;
    }
  };

  const masDropdownItems = [
    { to: '/manual', icon: BookOpen, label: 'Manual de usuario' },
    { to: '/terminos', icon: FileText, label: 'Términos y condiciones' },
  ];

  const staffMasItems = [
    { to: '/', icon: Hotel, label: 'Ver Catálogo / Habitaciones' },
    { to: '/manual', icon: BookOpen, label: 'Manual' },
    { to: '/terminos', icon: FileText, label: 'Términos' },
  ];

  const adminMasItems = [
    { to: '/', icon: Hotel, label: 'Ver Catálogo / Habitaciones' },
    { to: '/admin/empleados/nuevo', icon: UserPlus, label: 'Registrar Empleado' },
    { to: '/manual', icon: BookOpen, label: 'Manual' },
    { to: '/terminos', icon: FileText, label: 'Términos' },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link 
            to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'staff' ? '/check-in-out' : '/'} 
            className="flex items-center gap-2.5"
          >
            <div className="bg-brand-600 text-white p-2 rounded-xl shadow-md">
              <Hotel className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
              Hotel<span className="text-brand-600">Work</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-5">
            {/* Unauthenticated */}
            {!isAuthenticated && (
              <>
                <Link
                  to="/"
                  className="text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  Habitaciones
                </Link>
                <Link
                  to="/terminos"
                  className="text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  Términos y Condiciones
                </Link>
              </>
            )}

            {/* Guest */}
            {isAuthenticated && user?.role === 'guest' && (
              <>
                <Link
                  to="/"
                  className="text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  Habitaciones
                </Link>
                <Link
                  to="/my-reservations"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <CalendarCheck className="w-4 h-4" />
                  Mis Reservas
                </Link>
                <DropdownMenu label="Más" icon={MoreHorizontal} items={masDropdownItems} />
              </>
            )}

            {/* Staff (not admin) */}
            {isAuthenticated && user?.role === 'staff' && (
              <>
                <Link
                  to="/check-in-out"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  Recepción & Entrada
                </Link>
                <Link
                  to="/pagados"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Lista Pagados / Conteo
                </Link>
                <Link
                  to="/recaudacion"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  Recaudación
                </Link>
                <DropdownMenu label="Más" icon={MoreHorizontal} items={staffMasItems} />
              </>
            )}

            {/* Admin */}
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/admin/rooms"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <BedDouble className="w-4 h-4" />
                  Habitaciones
                </Link>
                <Link
                  to="/admin/users"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Usuarios
                </Link>
                <DropdownMenu label="Más" icon={MoreHorizontal} items={adminMasItems} />
              </>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <AppearanceMenu />
            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notification Bell */}
                <NotificationBell />

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-xs">
                    {user?.first_name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-brand-600 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Ingresar
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Registrarse
                </Link>
              </div>
            )}

            {/* Hamburger - Mobile */}
            <button
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menú"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-800 py-3 space-y-1 animate-slideUp">
            {!isAuthenticated && (
              <>
                <Link to="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Habitaciones</Link>
                <Link to="/terminos" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Términos y Condiciones</Link>
              </>
            )}
            {isAuthenticated && user?.role === 'guest' && (
              <>
                <Link to="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Habitaciones</Link>
                <Link to="/my-reservations" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Mis Reservas</Link>
                <Link to="/manual" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Manual de usuario</Link>
                <Link to="/terminos" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Términos y condiciones</Link>
              </>
            )}
            {isAuthenticated && user?.role === 'staff' && (
              <>
                <Link to="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Ver Catálogo / Habitaciones</Link>
                <Link to="/check-in-out" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Recepción & Entrada</Link>
                <Link to="/pagados" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Lista Pagados / Conteo</Link>
                <Link to="/recaudacion" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Recaudación</Link>
                <Link to="/manual" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Manual</Link>
                <Link to="/terminos" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Términos</Link>
              </>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <Link to="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Ver Catálogo / Habitaciones</Link>
                <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Dashboard</Link>
                <Link to="/admin/rooms" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Habitaciones</Link>
                <Link to="/admin/users" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Usuarios</Link>
                <Link to="/admin/empleados/nuevo" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Registrar Empleado</Link>
                <Link to="/manual" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Manual</Link>
                <Link to="/terminos" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">Términos</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
