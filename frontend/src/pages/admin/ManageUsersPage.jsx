import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersApi } from '../../api/usersApi';
import { useAuthStore } from '../../store/authStore';
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Pencil,
  X,
  Check,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const roleBadge = (role) => {
  const styles = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    staff: 'bg-amber-50 text-amber-700 border-amber-200',
    guest: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  const labels = { admin: 'Administrador', staff: 'Staff', guest: 'Huésped' };
  return (
    <span
      className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${styles[role] || styles.guest}`}
    >
      {labels[role] || role}
    </span>
  );
};

export default function ManageUsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', document_id: '' });
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getUsers({ search: searchTerm || undefined, per_page: 50 });
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message || 'Error al obtener lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId, currentlyActive) => {
    if (userId === currentUser?.id) {
      alert('No puedes desactivar tu propia cuenta de administrador');
      return;
    }
    const action = currentlyActive ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Deseas ${action} este usuario?`)) return;
    try {
      await usersApi.updateUser(userId, { is_active: !currentlyActive });
      await fetchUsers();
    } catch (err) {
      alert(err.message || `Error al ${action} usuario`);
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditForm({
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone: u.phone || '',
      document_id: u.document_id || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await usersApi.updateUser(editingUser.id, editForm);
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      alert(err.message || 'Error al actualizar usuario');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-brand-600" />
              Gestión de Usuarios
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Consulta usuarios, edita datos de contacto y controla el estado de las cuentas
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/admin/empleados/nuevo"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Registrar Empleado
            </Link>
            <button
              onClick={fetchUsers}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-700 dark:text-slate-200 shadow-sm transition-all"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por correo, nombre o documento..."
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Usuario / Email</th>
                    <th className="py-4 px-6">Documento</th>
                    <th className="py-4 px-6">Teléfono</th>
                    <th className="py-4 px-6">Rol</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:bg-slate-900/50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-100 text-brand-700 font-bold rounded-full flex items-center justify-center text-xs">
                            {u.first_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-slate-50 block">
                              {u.first_name} {u.last_name}
                            </span>
                            <span className="text-xs text-slate-400">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {u.document_id || 'No registrado'}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {u.phone || 'No registrado'}
                      </td>

                      <td className="py-4 px-6">
                        {roleBadge(u.role)}
                      </td>

                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleActive(u.id, u.is_active)}
                          disabled={u.id === currentUser?.id}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                            u.id === currentUser?.id
                              ? 'cursor-not-allowed opacity-60'
                              : 'cursor-pointer hover:opacity-80'
                          } ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                          title={u.id === currentUser?.id ? 'No puedes desactivar tu propia cuenta' : (u.is_active ? 'Click para desactivar' : 'Click para activar')}
                        >
                          {u.is_active ? (
                            <><ToggleRight className="w-3.5 h-3.5" /> Activo</>
                          ) : (
                            <><ToggleLeft className="w-3.5 h-3.5" /> Inactivo</>
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Editar datos"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Editar Usuario</h2>
                <div className="mt-1">{roleBadge(editingUser.role)}</div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+57 300 000 0000"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Documento (Cédula / Pasaporte)</label>
                <input
                  type="text"
                  value={editForm.document_id}
                  onChange={(e) => setEditForm({ ...editForm, document_id: e.target.value })}
                  placeholder="CC-12345678"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {editLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
