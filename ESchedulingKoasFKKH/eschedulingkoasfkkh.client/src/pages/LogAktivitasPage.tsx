import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { activityLogApi, type ActivityLogItem } from '../services/api';
import { ActivityLogIcon, DetailIcon, RefreshIcon, SearchIcon, ShieldCheckIcon } from '../components/Icons';
import Tooltip from '../components/Tooltip';

const MODUL_OPTIONS = [
  'Tahun Ajaran',
  'Mahasiswa',
  'Dosen Pembimbing',
  'Stase',
  'Kelompok',
  'Jadwal',
  'Riwayat Kelompok',
  'Broadcast',
  'Notifikasi',
  'Manajemen Pengguna',
  'Profil Pengguna',
];

const AKSI_OPTIONS = ['Tambah', 'Ubah', 'Hapus', 'Generate', 'Broadcast', 'Import', 'Reset Password'];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'pengelola', label: 'Pengelola' },
  { value: 'dosen', label: 'Dosen' },
  { value: 'mahasiswa', label: 'Mahasiswa' },
];

function formatDateTimeFull(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameLocalDay(dateStr: string, todayStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` === todayStr;
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function getAksiBadgeClass(aksi: string): string {
  switch (aksi) {
    case 'Tambah':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Ubah':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Hapus':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'Generate':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Broadcast':
      return 'bg-pink-100 text-pink-700 border-pink-200';
    case 'Import':
      return 'bg-teal-100 text-teal-700 border-teal-200';
    case 'Reset Password':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function getRoleBadgeClass(role: string): string {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'pengelola':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'dosen':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'mahasiswa':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function formatRoleLabel(role: string): string {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'Administrator';
    case 'pengelola':
      return 'Pengelola';
    case 'dosen':
      return 'Dosen';
    case 'mahasiswa':
      return 'Mahasiswa';
    default:
      return role;
  }
}

export default function LogAktivitasPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<ActivityLogItem[]>([]);
  const [totalKeseluruhan, setTotalKeseluruhan] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [modulFilter, setModulFilter] = useState('');
  const [aksiFilter, setAksiFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (tanggalMulai && tanggalSelesai && tanggalSelesai < tanggalMulai) {
        setError('Tanggal selesai harus sama atau setelah tanggal mulai.');
        setLoading(false);
        return;
      }

      const res = await activityLogApi.getAll({
        search: searchTerm.trim() || undefined,
        modul: modulFilter || undefined,
        aksi: aksiFilter || undefined,
        role: roleFilter || undefined,
        tanggalMulai: tanggalMulai || undefined,
        tanggalSelesai: tanggalSelesai || undefined,
        limit: 1000,
      });

      setItems(res.items || []);
      setTotalKeseluruhan(res.totalKeseluruhan ?? res.items?.length ?? 0);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: Record<string, string> };
      const firstFieldError = apiErr?.errors ? Object.values(apiErr.errors)[0] : undefined;
      setError(firstFieldError || apiErr?.message || 'Gagal memuat data log aktivitas.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, modulFilter, aksiFilter, roleFilter, tanggalMulai, tanggalSelesai]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const modulOptions = useMemo(() => {
    const set = new Set<string>(MODUL_OPTIONS);
    items.forEach(item => {
      if (item.modul) set.add(item.modul);
    });
    return Array.from(set);
  }, [items]);

  const aksiOptions = useMemo(() => {
    const set = new Set<string>(AKSI_OPTIONS);
    items.forEach(item => {
      if (item.aksi) set.add(item.aksi);
    });
    return Array.from(set);
  }, [items]);

  const stats = useMemo(() => {
    const todayStr = getTodayDateStr();
    const todayCount = items.filter(x => isSameLocalDay(x.createdAt, todayStr)).length;
    const changeCount = items.filter(x => ['Tambah', 'Ubah', 'Generate', 'Broadcast', 'Reset Password'].includes(x.aksi)).length;
    const deleteCount = items.filter(x => x.aksi === 'Hapus').length;
    return { todayCount, changeCount, deleteCount };
  }, [items]);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = items.slice(startIndex, endIndex);

  const hasActiveFilter = Boolean(searchTerm || modulFilter || aksiFilter || roleFilter || tanggalMulai || tanggalSelesai);

  const resetFilters = () => {
    setSearchTerm('');
    setModulFilter('');
    setAksiFilter('');
    setRoleFilter('');
    setTanggalMulai('');
    setTanggalSelesai('');
    setCurrentPage(1);
  };

  const handleDownloadCsv = () => {
    if (items.length === 0) return;

    const headers = [
      'ID',
      'Waktu',
      'Nama Pelaku',
      'Username',
      'Role',
      'Modul',
      'Aksi',
      'Deskripsi',
      'Target Entitas',
      'Endpoint',
      'IP Address',
    ];

    const rows = items.map(item => [
      escapeCsvCell(item.id),
      escapeCsvCell(formatDateTimeFull(item.createdAt)),
      escapeCsvCell(item.namaPelaku || item.username),
      escapeCsvCell(item.username),
      escapeCsvCell(formatRoleLabel(item.role)),
      escapeCsvCell(item.modul),
      escapeCsvCell(item.aksi),
      escapeCsvCell(item.deskripsi),
      escapeCsvCell(item.targetEntitas || ''),
      escapeCsvCell(item.endpoint || ''),
      escapeCsvCell(item.ipAddress || ''),
    ]);

    const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `log-aktivitas-${getTodayDateStr()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      {/* Page Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl mb-4 sm:mb-6 animate-fade-in-down">
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none transform rotate-12">
          <ActivityLogIcon className="w-44 h-44 sm:w-56 sm:h-56 text-white" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all border border-white/10 shadow-sm cursor-pointer shrink-0"
              title="Kembali ke Dashboard"
            >
              ←
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md shrink-0">
              <ActivityLogIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Log Aktivitas Sistem</h1>
              <p className="text-xs sm:text-sm text-indigo-100/90">
                Rekam jejak permanen seluruh perubahan data di aplikasi oleh semua pengguna
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-100">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-300" />
              <span>Audit Permanen • Khusus Admin</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in-down">
          <span className="text-red-500 text-lg font-bold">!</span>
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg cursor-pointer">×</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6 animate-fade-in-up">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-700 to-indigo-800 flex items-center justify-center text-white shadow-sm shrink-0">
            <ActivityLogIcon className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-2xl font-bold text-primary-900 leading-tight">{totalKeseluruhan}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">Total Seluruh Log</p>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="text-xs sm:text-sm font-bold">24j</span>
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-2xl font-bold text-indigo-700 leading-tight">{stats.todayCount}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">Aktivitas Hari Ini</p>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="text-sm sm:text-base font-bold">+ / ✎</span>
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-2xl font-bold text-emerald-700 leading-tight">{stats.changeCount}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">Tambah & Perubahan</p>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="text-sm sm:text-base font-bold">−</span>
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-2xl font-bold text-red-600 leading-tight">{stats.deleteCount}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">Penghapusan Data</p>
          </div>
        </div>
      </div>

      {/* Filter & Export Bar */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-3.5 sm:p-4 mb-4 sm:mb-6 animate-fade-in-up space-y-3">
        <div className="flex flex-col lg:flex-row gap-2.5">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Cari pelaku, username, deskripsi, target, atau endpoint..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
              id="search-log-aktivitas"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tooltip content="Muat ulang log" position="bottom">
              <button
                onClick={fetchLogs}
                className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 text-slate-600 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                title="Muat ulang log"
              >
                <RefreshIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </Tooltip>

            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
                id="btn-reset-filter-log"
              >
                Reset Filter
              </button>
            )}

            <button
              onClick={handleDownloadCsv}
              disabled={items.length === 0}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-slate-800 hover:from-indigo-700 hover:to-slate-900 text-white font-semibold rounded-xl shadow-md active:scale-95 transition-all text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              id="btn-download-csv-log"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Unduh CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <select
            value={modulFilter}
            onChange={(e) => { setModulFilter(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-400 focus:bg-white cursor-pointer"
            id="filter-modul-log"
          >
            <option value="">Semua Modul</option>
            {modulOptions.map(modul => (
              <option key={modul} value={modul}>{modul}</option>
            ))}
          </select>

          <select
            value={aksiFilter}
            onChange={(e) => { setAksiFilter(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-400 focus:bg-white cursor-pointer"
            id="filter-aksi-log"
          >
            <option value="">Semua Aksi</option>
            {aksiOptions.map(aksi => (
              <option key={aksi} value={aksi}>{aksi}</option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-400 focus:bg-white cursor-pointer"
            id="filter-role-log"
          >
            <option value="">Semua Role</option>
            {ROLE_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-[11px] text-slate-500 font-semibold shrink-0">Dari:</span>
            <input
              type="date"
              value={tanggalMulai}
              onChange={(e) => { setTanggalMulai(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-700 focus:outline-none"
              id="filter-tanggal-mulai-log"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-[11px] text-slate-500 font-semibold shrink-0">Sampai:</span>
            <input
              type="date"
              value={tanggalSelesai}
              onChange={(e) => { setTanggalSelesai(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-700 focus:outline-none"
              id="filter-tanggal-selesai-log"
            />
          </div>
        </div>
      </div>

      {/* Data Table & Mobile List Container */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Memuat catatan log aktivitas...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex justify-center mb-4 text-slate-300">
              <ActivityLogIcon className="w-16 h-16" />
            </div>
            <p className="text-slate-600 font-medium">Belum ada log aktivitas ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">
              {hasActiveFilter
                ? 'Coba ubah filter atau kata kunci pencarian Anda'
                : 'Setiap aktivitas perubahan data di aplikasi akan tercatat di sini secara otomatis'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header Info */}
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <p className="text-slate-500 font-medium">
                Menampilkan <span className="text-primary-900 font-bold">{startIndex + 1}</span> - <span className="text-primary-900 font-bold">{endIndex}</span> dari <span className="text-primary-900 font-bold">{totalItems}</span> Log
                {totalKeseluruhan > totalItems && ` (Total database: ${totalKeseluruhan})`}
              </p>
              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-medium whitespace-nowrap">Tampilkan:</label>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-slate-500 font-medium">baris</span>
              </div>
            </div>

            {/* Mobile View: Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedItems.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-50/70 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">{formatDateTimeFull(log.createdAt)}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-xs font-bold text-primary-900">{log.namaPelaku || log.username}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeClass(log.role)}`}>
                          {formatRoleLabel(log.role)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-2 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 shrink-0 cursor-pointer"
                      title="Detail Log"
                    >
                      <DetailIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getAksiBadgeClass(log.aksi)}`}>
                      {log.aksi}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      {log.modul}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{log.deskripsi}</p>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-max" id="table-log-aktivitas">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white">
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Waktu</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Pelaku</th>
                    <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Role</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Modul</th>
                    <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Aksi</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Deskripsi Aktivitas</th>
                    <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map((log) => (
                    <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors duration-150">
                      <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap font-medium">
                        {formatDateTimeFull(log.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary-900">{log.namaPelaku || log.username}</span>
                          <span className="text-[11px] text-slate-400">@{log.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeClass(log.role)}`}>
                          {formatRoleLabel(log.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          {log.modul}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getAksiBadgeClass(log.aksi)}`}>
                          {log.aksi}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700 max-w-md">
                        <p className="line-clamp-2">{log.deskripsi}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <Tooltip content="Lihat Detail" position="bottom">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-all cursor-pointer"
                          >
                            <DetailIcon className="w-5 h-5" />
                          </button>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs font-medium text-slate-500">
                  Halaman <span className="text-primary-900 font-bold">{currentPage}</span> dari <span className="text-primary-900 font-bold">{totalPages}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated w-full max-w-lg animate-scale-in overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <ActivityLogIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary-900">Detail Log Aktivitas #{selectedLog.id}</h3>
                  <p className="text-xs text-slate-500">{formatDateTimeFull(selectedLog.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-sm max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Nama Pelaku</p>
                  <p className="font-bold text-primary-900 mt-0.5">{selectedLog.namaPelaku || selectedLog.username}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Username & Role</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="font-semibold text-slate-700">@{selectedLog.username}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadgeClass(selectedLog.role)}`}>
                      {formatRoleLabel(selectedLog.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Modul</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLog.modul}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Jenis Aksi</p>
                  <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getAksiBadgeClass(selectedLog.aksi)}`}>
                    {selectedLog.aksi}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Deskripsi</p>
                <p className="text-slate-700 mt-1 leading-relaxed">{selectedLog.deskripsi}</p>
              </div>

              {selectedLog.targetEntitas && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Target Entitas</p>
                  <p className="font-medium text-slate-700 mt-0.5">{selectedLog.targetEntitas}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Endpoint</p>
                  <p className="font-mono text-xs text-slate-700 mt-0.5 break-all">{selectedLog.endpoint || '-'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">IP Address</p>
                  <p className="font-mono text-xs text-slate-700 mt-0.5">{selectedLog.ipAddress || '-'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm cursor-pointer transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
