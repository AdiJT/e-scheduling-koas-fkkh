import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { notifikasiApi, type NotifikasiItem } from '../services/api';
import { BellIcon, RefreshIcon, SearchIcon, MegaphoneIcon, DeleteIcon, JadwalIcon, DetailIcon } from '../components/Icons';
import Tooltip from '../components/Tooltip';

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState<NotifikasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'semua' | 'unread' | 'broadcast' | 'jadwal' | 'penugasan'>('semua');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [detailNotif, setDetailNotif] = useState<NotifikasiItem | null>(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper untuk validasi URL/tautan agar tidak navigasi ke halaman blank/rusak
  const getSafeUrl = (url?: string) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed || trimmed.toLowerCase() === 'test' || trimmed === '-' || trimmed.toLowerCase() === 'null') {
      return null;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { type: 'external' as const, href: trimmed };
    }
    if (trimmed.startsWith('/')) {
      return { type: 'internal' as const, href: trimmed };
    }
    return null;
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notifikasiApi.getAll(undefined, 100);
      const items = res.items || [];
      setNotifications(items);

      // Cek apakah ada query param detailId dari navigasi bell
      const detailIdParam = searchParams.get('detailId');
      if (detailIdParam) {
        const found = items.find(n => String(n.id) === detailIdParam);
        if (found) {
          handleOpenDetail(found);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number, isBroadcast?: boolean) => {
    try {
      await notifikasiApi.markAsRead(id, isBroadcast);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Gagal menandai notifikasi dibaca:', err);
    }
  };

  const handleOpenDetail = async (notif: NotifikasiItem) => {
    setDetailNotif(notif);
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id, notif.isBroadcast);
    }
    // Hapus detailId dari URL agar bersih saat modal ditutup nanti
    if (searchParams.has('detailId')) {
      searchParams.delete('detailId');
      setSearchParams(searchParams, { replace: true });
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
      console.error('Gagal menandai semua dibaca:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number, isBroadcast?: boolean) => {
    try {
      await notifikasiApi.delete(id, isBroadcast);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (detailNotif?.id === id) {
        setDetailNotif(null);
      }
    } catch (err) {
      console.error('Gagal menghapus notifikasi:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Hapus seluruh riwayat notifikasi Anda?')) return;
    setActionLoading(true);
    try {
      await notifikasiApi.clearAll();
      setNotifications([]);
      setDetailNotif(null);
      setSuccessMsg('Seluruh notifikasi berhasil dibersihkan.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Stats
  const totalNotif = notifications.length;
  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
  const broadcastCount = useMemo(() => notifications.filter(n => n.tipe === 'broadcast').length, [notifications]);
  const jadwalCount = useMemo(() => notifications.filter(n => n.tipe?.includes('kegiatan') || n.tipe === 'jadwal' || n.tipe === 'penugasan').length, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      if (filter === 'unread' && item.isRead) return false;
      if (filter === 'broadcast' && item.tipe !== 'broadcast') return false;
      if (filter === 'jadwal' && !item.tipe?.includes('kegiatan') && item.tipe !== 'jadwal') return false;
      if (filter === 'penugasan' && item.tipe !== 'penugasan') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.judul.toLowerCase().includes(q) ||
          item.pesan.toLowerCase().includes(q) ||
          (item.senderName && item.senderName.toLowerCase().includes(q)) ||
          (item.kategori && item.kategori.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [notifications, filter, search]);

  const getNotifIcon = (tipe: string, size = 'md') => {
    const isLg = size === 'lg';
    const boxClass = isLg 
      ? 'w-12 h-12 rounded-2xl' 
      : 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl';
    const iconClass = isLg ? 'w-6 h-6' : 'w-4 h-4 sm:w-5 sm:h-5';

    switch (tipe?.toLowerCase()) {
      case 'broadcast':
        return (
          <div className={`${boxClass} bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-sm`}>
            <MegaphoneIcon className={iconClass} />
          </div>
        );
      case 'kegiatan_mulai':
        return (
          <div className={`${boxClass} bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm`}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'kegiatan_selesai':
        return (
          <div className={`${boxClass} bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm`}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'penugasan':
        return (
          <div className={`${boxClass} bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm`}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${boxClass} bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 shadow-sm`}>
            <BellIcon className={iconClass} />
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header Card */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl animate-fade-in-down">
          {/* Subtle watermark */}
          <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none transform rotate-12">
            <BellIcon className="w-48 h-48 sm:w-60 sm:h-60 text-white" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all border border-white/10 shadow-sm cursor-pointer shrink-0"
                title="Kembali ke Dashboard"
              >
                ←
              </button>
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md shrink-0">
                <BellIcon className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Pusat Notifikasi</h1>
                <p className="text-xs sm:text-sm text-indigo-100/90">Semua pengumuman resmi, jadwal kegiatan stase, dan informasi akademik Anda</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-indigo-100 self-start sm:self-center">
              <span>Total {totalNotif} Notifikasi</span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-card border border-slate-100/80 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Total Notifikasi</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{totalNotif}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-card border border-slate-100/80 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Belum Dibaca</p>
              <p className={`text-xl sm:text-2xl font-bold ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-800'}`}>
                {unreadCount}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-card border border-slate-100/80 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <MegaphoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Pengumuman</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{broadcastCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-card border border-slate-100/80 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <JadwalIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Jadwal & Tugas</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{jadwalCount}</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-3.5 sm:p-4 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
            {/* Filter Tabs */}
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

            {/* Search & Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cari kata kunci notifikasi..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                  />
                </div>

                <Tooltip content="Muat ulang data notifikasi" position="bottom">
                  <button
                    onClick={fetchNotifications}
                    disabled={loading}
                    className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>
              </div>

              {(unreadCount > 0 || totalNotif > 0) && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={actionLoading}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-all border border-blue-200 cursor-pointer whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Tandai Semua Dibaca
                    </button>
                  )}

                  {totalNotif > 0 && (
                    <button
                      onClick={handleClearAll}
                      disabled={actionLoading}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-all border border-rose-200 cursor-pointer whitespace-nowrap"
                      title="Bersihkan Semua Notifikasi"
                    >
                      <DeleteIcon className="w-3.5 h-3.5" />
                      Bersihkan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List Card */}
        <div className="bg-white rounded-3xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up">
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
                  ? 'Tidak ada notifikasi dalam kategori filter yang dipilih.'
                  : 'Kotak masuk notifikasi Anda masih kosong. Kabar dan pengumuman baru akan tampil di sini.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map(item => {
                const safeUrl = getSafeUrl(item.tautan);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenDetail(item)}
                    className={`p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-colors relative group cursor-pointer ${
                      !item.isRead ? 'bg-blue-50/30 hover:bg-blue-50/60' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Icon */}
                    {getNotifIcon(item.tipe)}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm ${!item.isRead ? 'font-bold text-slate-900 group-hover:text-primary-700 transition-colors' : 'font-semibold text-slate-800'}`}>
                            {item.judul}
                          </h4>
                          {!item.isRead && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white uppercase tracking-wider">
                              Baru
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                        {item.pesan}
                      </p>

                      {/* Metadata and Actions */}
                      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.senderName && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                              <span className="opacity-60">Dari:</span> {item.senderName}
                            </span>
                          )}
                          {item.kategori && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {item.kategori}
                            </span>
                          )}
                          {item.prioritas && item.prioritas.toLowerCase() !== 'normal' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                              {item.prioritas}
                            </span>
                          )}
                          {safeUrl && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                              <span>🔗 Tautan Terlampir</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                          >
                            <DetailIcon className="w-3.5 h-3.5" />
                            <span>Lihat Detail</span>
                          </button>

                          {!item.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(item.id, item.isBroadcast)}
                              className="text-xs font-semibold text-slate-500 hover:text-primary-600 hover:underline px-2 py-1 cursor-pointer"
                            >
                              Tandai Dibaca
                            </button>
                          )}

                          <Tooltip content="Hapus Notifikasi">
                            <button
                              onClick={() => handleDelete(item.id, item.isBroadcast)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <DeleteIcon className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL DETAIL NOTIFIKASI */}
        {detailNotif && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
            onClick={() => setDetailNotif(null)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-in"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-start gap-4">
                {getNotifIcon(detailNotif.tipe, 'lg')}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {detailNotif.tipe === 'broadcast' ? 'Pengumuman Siaran' : 'Pemberitahuan Sistem'}
                      </span>
                      {detailNotif.prioritas && detailNotif.prioritas.toLowerCase() !== 'normal' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                          {detailNotif.prioritas}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setDetailNotif(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
                    {detailNotif.judul}
                  </h3>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Pengirim:</span>
                    <span>{detailNotif.senderName || 'Sistem Penjadwalan FKKH'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Waktu:</span>
                    <span>
                      {new Date(detailNotif.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Content Message */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Isi Pemberitahuan</label>
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {detailNotif.pesan}
                  </div>
                </div>

                {/* Attached Safe Link */}
                {(() => {
                  const safe = getSafeUrl(detailNotif.tautan);
                  if (!safe) return null;
                  return (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                          <span>🔗 Halaman Terkait</span>
                        </p>
                        <p className="text-xs text-indigo-700 font-mono truncate">{safe.href}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (safe.type === 'external') {
                            window.open(safe.href, '_blank');
                          } else {
                            setDetailNotif(null);
                            navigate(safe.href);
                          }
                        }}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Buka Halaman</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleDelete(detailNotif.id, detailNotif.isBroadcast)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <DeleteIcon className="w-4 h-4" />
                  <span>Hapus</span>
                </button>

                <button
                  onClick={() => setDetailNotif(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
