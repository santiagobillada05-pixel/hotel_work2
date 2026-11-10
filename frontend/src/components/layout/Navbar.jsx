import React from 'react';
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
  BookOpen
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

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

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {!isAuthenticated && (
              <>
                <Link
                  to="/"
                  className="text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  Explorar Habitaciones
                </Link>
                <Link
                  to="/terminos"
                  className="text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  Términos y Condiciones
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'guest' && (
              <Link
                to="/"
                className="text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
              >
                Explorar Habitaciones
              </Link>
            )}

            {isAuthenticated && user?.role === 'guest' && (
              <>
                <Link
                  to="/my-reservations"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <CalendarCheck className="w-4 h-4" />
                  Mis Reservas
                </Link>
                <Link
                  to="/manual"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  Manual de usuario
                </Link>
                <Link
                  to="/terminos"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <Hotel className="w-4 h-4" />
                  Términos y condiciones
                </Link>
              </>
            )}

            {isAuthenticated && (user?.role === 'staff' || user?.role === 'admin') && (
              <>
                <Link
                  to="/check-in-out"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  Recepción & Check-in
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
                <Link
                  to="/manual"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Manual
                </Link>
                <Link
                  to="/terminos"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <Hotel className="w-4 h-4" />
                  Términos
                </Link>
              </>
            )}

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
                <Link
                  to="/admin/empleados/nuevo"
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 text-sm font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Registrar Empleado
                </Link>
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
          </div>
        </div>
      </div>
    </nav>
  );
}
