import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifikasiApi, type NotifikasiItem } from '../services/api';
import { BellIcon } from './Icons';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotifikasiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'semua' | 'unread'>('semua');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch unread count periodically
  const fetchUnreadCount = async () => {
    try {
      const res = await notifikasiApi.getUnreadCount();
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Ignore background network errors
    }
  };

  // Fetch recent notifications when dropdown opens
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notifikasiApi.getAll(undefined, 15);
      setNotifications(res.items || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 25000); // Poll every 25s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await notifikasiApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (notif: NotifikasiItem) => {
    if (!notif.isRead) {
      try {
        await notifikasiApi.markAsRead(notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }

    setIsOpen(false);
    if (notif.tautan) {
      navigate(notif.tautan);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const getNotifIcon = (tipe: string) => {
    switch (tipe?.toLowerCase()) {
      case 'broadcast':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        );
      case 'kegiatan_mulai':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'kegiatan_selesai':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'penugasan':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-primary-700 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        title="Notifikasi"
        aria-label="Buka Notifikasi"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden animate-scale-in origin-top-right">
          {/* Header */}
          <div className="p-4 pb-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-base">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors hover:underline flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Tandai dibaca
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="p-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilter('semua')}
              className={`flex-1 py-1.5 rounded-xl font-semibold transition-all text-center ${
                filter === 'semua'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 py-1.5 rounded-xl font-semibold transition-all text-center ${
                filter === 'unread'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Belum Dibaca {unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Memuat notifikasi...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                  <BellIcon className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Tidak ada notifikasi</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  {filter !== 'semua'
                    ? 'Tidak ada notifikasi dalam filter ini.'
                    : 'Anda sudah membaca semua kabar dan pengumuman terbaru.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/90 transition-colors cursor-pointer relative group ${
                    !item.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* Type Icon */}
                  {getNotifIcon(item.tipe)}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs font-semibold truncate ${!item.isRead ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                        {item.judul}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.pesan}
                    </p>

                    {/* Metadata tags */}
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {item.kategori && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.kategori}
                        </span>
                      )}
                      {item.prioritas && item.prioritas.toLowerCase() !== 'normal' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                          {item.prioritas}
                        </span>
                      )}
                      {item.tautan && (
                        <span className="text-[9px] text-primary-600 font-medium flex items-center gap-0.5 group-hover:underline">
                          Buka detail &rarr;
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0 mt-1.5 ring-4 ring-primary-100"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notifikasi');
              }}
              className="w-full text-center py-1.5 font-semibold text-primary-600 hover:text-primary-800 hover:bg-primary-100/50 rounded-lg transition-colors"
            >
              Lihat Semua Notifikasi &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
