import React, { useState, useEffect, useRef } from 'react';
import { notificationsApi } from '../../api/notificationsApi';
import { useAuthStore } from '../../store/authStore';
import { Bell, Check, Info, CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react';

export default function NotificationBell() {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsApi.getMyNotifications();
      const notifs = res.data?.notifications || [];
      setNotifications(notifs);
      setUnreadCount(res.data?.unread_count || 0);
    } catch {
      // Quiet fail if network glitch
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Click outside and Escape key listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggleOpen = async () => {
    const willOpen = !open;
    setOpen(willOpen);

    // When user opens the panel, mark unread notifications as read
    if (willOpen && unreadCount > 0) {
      // Optimistic update in client
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );

      // Persist in backend
      try {
        await notificationsApi.markAllAsRead();
      } catch {
        // Quiet fail, state will sync on next poll if API failed
      }
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  if (!isAuthenticated) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'confirmation':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-brand-600 shrink-0" />;
      case 'cancellation':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleOpen}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 pointer-events-none z-10 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-3 z-50 animate-fadeIn">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Notificaciones
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">Alertas</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No tienes notificaciones pendientes.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start gap-3 transition-colors ${
                    !n.is_read ? 'bg-brand-50/40 hover:bg-brand-50/70' : 'hover:bg-slate-50 dark:bg-slate-900/50'
                  }`}
                >
                  <div className="mt-0.5">{getTypeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{n.title}</p>
                      {!n.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          className="text-[10px] text-brand-600 hover:text-brand-800 font-semibold shrink-0"
                          title="Marcar como leída"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

