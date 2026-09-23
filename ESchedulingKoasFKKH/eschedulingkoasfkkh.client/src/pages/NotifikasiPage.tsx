import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { notifikasiApi, type NotifikasiItem } from '../services/api';
import { BellIcon, RefreshIcon, SearchIcon, MegaphoneIcon, DeleteIcon, JadwalIcon } from '../components/Icons';
import Tooltip from '../components/Tooltip';

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState<NotifikasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'semua' | 'unread' | 'broadcast' | 'jadwal' | 'penugasan'>('semua');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notifikasiApi.getAll(undefined, 100);
      setNotifications(res.items || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notifikasiApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await notifikasiApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setSuccessMsg('Semua notifikasi berhasil ditandai telah dibaca.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notifikasiApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Hapus seluruh riwayat notifikasi Anda?')) return;
    setActionLoading(true);
    try {
      await notifikasiApi.clearAll();
      setNotifications([]);
      setSuccessMsg('Seluruh notifikasi berhasil dibersihkan.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAction = async (notif: NotifikasiItem) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    if (notif.tautan) {
      navigate(notif.tautan);
    }
  };

  // Stats
  const totalNotif = notifications.length;
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const broadcastCount = notifications.filter(n => n.tipe === 'broadcast').length;
  const jadwalCount = notifications.filter(n => n.tipe?.includes('kegiatan') || n.tipe === 'jadwal' || n.tipe === 'penugasan').length;

  const filteredNotifications = notifications.filter(item => {
    if (filter === 'unread' && item.isRead) return false;
    if (filter === 'broadcast' && item.tipe !== 'broadcast') return false;
    if (filter === 'jadwal' && !item.tipe?.includes('kegiatan') && item.tipe !== 'jadwal') return false;
    if (filter === 'penugasan' && item.tipe !== 'penugasan') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.judul.toLowerCase().includes(q) ||
        item.pesan.toLowerCase().includes(q) ||
        (item.kategori && item.kategori.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getNotifIcon = (tipe: string) => {
    switch (tipe?.toLowerCase()) {
      case 'broadcast':
        return (
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <MegaphoneIcon className="w-5 h-5" />
          </div>
        );
      case 'kegiatan_mulai':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'kegiatan_selesai':
        return (
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'penugasan':
        return (
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <BellIcon className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
      {/* Page Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 rounded-2xl p-6 text-white shadow-xl animate-fade-in-down">
        {/* Subtle decorative watermark */}
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none transform rotate-12">
          <BellIcon className="w-56 h-56 text-white" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all border border-white/10 shadow-sm cursor-pointer"
              title="Kembali ke Dashboard"
            >
              ←
            </button>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <BellIcon className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Pusat Notifikasi</h1>
              <p className="text-sm text-indigo-100/90">Semua pengumuman resmi, informasi penugasan, dan pengingat stase Anda</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-100 self-start sm:self-center">
            <span>Total {totalNotif} Notifikasi</span>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up">
        <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <BellIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Notifikasi</p>
            <p className="text-2xl font-bold text-slate-800">{totalNotif}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Dibaca</p>
            <p className={`text-2xl font-bold ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-800'}`}>
              {unreadCount}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <MegaphoneIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pengumuman</p>
            <p className="text-2xl font-bold text-slate-800">{broadcastCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <JadwalIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jadwal & Tugas</p>
            <p className="text-2xl font-bold text-slate-800">{jadwalCount}</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 animate-fade-in-up">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold pb-1 lg:pb-0">
            <button
              onClick={() => setFilter('semua')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                filter === 'semua'
                  ? 'bg-primary-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({totalNotif})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                filter === 'unread'
                  ? 'bg-primary-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('broadcast')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                filter === 'broadcast'
                  ? 'bg-primary-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pengumuman ({broadcastCount})
            </button>
            <button
              onClick={() => setFilter('jadwal')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                filter === 'jadwal'
                  ? 'bg-primary-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pengingat Kegiatan
            </button>
            <button
              onClick={() => setFilter('penugasan')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                filter === 'penugasan'
                  ? 'bg-primary-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Penugasan
            </button>
          </div>

          {/* Search Box & Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari notifikasi..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
              />
            </div>

            <Tooltip content="Muat ulang notifikasi" position="bottom">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </Tooltip>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-all border border-blue-200 cursor-pointer whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Tandai Dibaca
              </button>
            )}

            {totalNotif > 0 && (
              <button
                onClick={handleClearAll}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-all border border-rose-200 cursor-pointer whitespace-nowrap"
                title="Bersihkan Semua Notifikasi"
              >
                <DeleteIcon className="w-3.5 h-3.5" />
                Bersihkan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {/* Table Header Info */}
        <div className="px-5 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Menampilkan <span className="text-primary-900 font-bold">{filteredNotifications.length}</span> Notifikasi
          </p>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {unreadCount} belum dibaca
            </span>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-medium">Memuat notifikasi...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-24 text-center text-slate-400 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <BellIcon className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-base font-bold text-slate-700">Tidak Ada Notifikasi</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              {filter !== 'semua'
                ? 'Tidak ada notifikasi yang sesuai dengan filter yang dipilih.'
                : 'Kotak masuk notifikasi Anda masih kosong. Kabar dan pengumuman baru akan tampil di sini.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map(item => (
              <div
                key={item.id}
                className={`p-5 sm:p-6 flex items-start gap-4 transition-colors relative group ${
                  !item.isRead ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-slate-50/60'
                }`}
              >
                {/* Icon */}
                {getNotifIcon(item.tipe)}

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm ${!item.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                        {item.judul}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-100"></span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {item.pesan}
                  </p>

                  {/* Metadata and Actions */}
                  <div className="mt-3 flex items-center justify-between gap-2 flex-wrap pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.kategori && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {item.kategori}
                        </span>
                      )}
                      {item.prioritas && item.prioritas.toLowerCase() !== 'normal' && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                          {item.prioritas}
                        </span>
                      )}
                      {item.tautan && (
                        <button
                          onClick={() => handleOpenAction(item)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          Lihat Halaman Terkait &rarr;
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!item.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(item.id)}
                          className="text-xs font-semibold text-slate-500 hover:text-primary-600 hover:underline px-2 py-1 cursor-pointer"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                      <Tooltip content="Hapus Notifikasi">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </Layout>
  );
}
