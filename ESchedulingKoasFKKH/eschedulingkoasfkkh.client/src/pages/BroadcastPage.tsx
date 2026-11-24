import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  broadcastApi, 
  type BroadcastItem, 
  type BroadcastStats, 
  kelompokApi, 
  type Kelompok 
} from '../services/api';
import { MegaphoneIcon, SearchIcon, RefreshIcon, DetailIcon, DeleteIcon } from '../components/Icons';
import Tooltip from '../components/Tooltip';
import SearchableSelect from '../components/SearchableSelect';

export default function BroadcastPage() {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [stats, setStats] = useState<BroadcastStats>({
    totalBroadcast: 0,
    broadcastAktif: 0,
    totalDibaca: 0,
    broadcastBulanIni: 0,
  });
  const [kelompoks, setKelompoks] = useState<Kelompok[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTarget, setFilterTarget] = useState<string>('all');
  const [filterPrioritas, setFilterPrioritas] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [detailBroadcast, setDetailBroadcast] = useState<BroadcastItem | null>(null);

  // Form State
  const [formJudul, setFormJudul] = useState('');
  const [formPesan, setFormPesan] = useState('');
  const [formTargetRole, setFormTargetRole] = useState<'semua' | 'dosen' | 'mahasiswa' | 'kelompok'>('semua');
  const [formTargetKelompokId, setFormTargetKelompokId] = useState<number | undefined>(undefined);
  const [formPrioritas, setFormPrioritas] = useState<'Normal' | 'Penting' | 'Mendesak'>('Normal');
  const [formKategori, setFormKategori] = useState('Pengumuman');
  const [formActionUrl, setFormActionUrl] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [bList, statsData, kList] = await Promise.all([
        broadcastApi.getAll(),
        broadcastApi.getStats().catch(() => ({
          totalBroadcast: 0,
          broadcastAktif: 0,
          totalDibaca: 0,
          broadcastBulanIni: 0,
        })),
        kelompokApi.getAll().catch(() => []),
      ]);
      setBroadcasts(bList || []);
      setStats(statsData);
      setKelompoks(kList || []);
    } catch (err: any) {
      console.error('Gagal memuat data broadcast:', err);
      setErrorMsg(err.message || 'Gagal memuat riwayat broadcast pengumuman. Pastikan koneksi server aktif.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = () => {
    setFormJudul('');
    setFormPesan('');
    setFormTargetRole('semua');
    setFormTargetKelompokId(undefined);
    setFormPrioritas('Normal');
    setFormKategori('Pengumuman');
    setFormActionUrl('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formPesan.trim()) {
      setErrorMsg('Judul dan isi pesan pengumuman wajib diisi.');
      return;
    }

    if (formTargetRole === 'kelompok' && !formTargetKelompokId) {
      setErrorMsg('Pilih kelompok sasaran untuk broadcast kelompok.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await broadcastApi.create({
        judul: formJudul.trim(),
        pesan: formPesan.trim(),
        targetRole: formTargetRole,
        targetKelompokId: formTargetRole === 'kelompok' ? formTargetKelompokId : undefined,
        prioritas: formPrioritas,
        kategori: formKategori,
        tipe: formKategori,
        actionUrl: formActionUrl.trim() || undefined,
        tautan: formActionUrl.trim() || undefined,
      });

      setSuccessMsg('Pengumuman broadcast berhasil disiarkan terpusat ke seluruh target pengguna!');
      setIsModalOpen(false);
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal mengirim broadcast.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: BroadcastItem) => {
    setTogglingId(item.id);
    try {
      await broadcastApi.toggleStatus(item.id);
      const newStatus = !item.isActive;
      setBroadcasts(prev => prev.map(b => b.id === item.id ? { ...b, isActive: newStatus } : b));
      setStats(prev => ({
        ...prev,
        broadcastAktif: newStatus ? prev.broadcastAktif + 1 : Math.max(0, prev.broadcastAktif - 1)
      }));
      setSuccessMsg(`Status siaran "${item.judul}" berhasil diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengubah status broadcast: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus arsip pengumuman broadcast ini beserta seluruh data status bacanya?')) return;
    try {
      await broadcastApi.delete(id);
      setBroadcasts(prev => prev.filter(b => b.id !== id));
      setSuccessMsg('Broadcast pengumuman berhasil dihapus.');
      // Refresh stats
      broadcastApi.getStats().then(setStats).catch(() => {});
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus broadcast: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  const filteredBroadcasts = broadcasts.filter(b => {
    const q = search.toLowerCase();
    const sender = b.senderName || b.createdByName || '';
    const matchSearch =
      b.judul.toLowerCase().includes(q) ||
      b.pesan.toLowerCase().includes(q) ||
      sender.toLowerCase().includes(q) ||
      (b.targetRole && b.targetRole.toLowerCase().includes(q));

    const matchTarget = filterTarget === 'all' || b.targetRole?.toLowerCase() === filterTarget.toLowerCase();
    const matchPrioritas = filterPrioritas === 'all' || b.prioritas?.toLowerCase() === filterPrioritas.toLowerCase();
    const matchStatus = filterStatus === 'all' 
      ? true 
      : (filterStatus === 'active' ? b.isActive : !b.isActive);

    return matchSearch && matchTarget && matchPrioritas && matchStatus;
  });

  const totalItems = filteredBroadcasts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedBroadcasts = filteredBroadcasts.slice(startIndex, endIndex);

  const getPriorityBadge = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'mendesak':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-700 border border-rose-200">Mendesak</span>;
      case 'penting':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-amber-100 text-amber-700 border border-amber-200">Penting</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-700">Normal</span>;
    }
  };

  const getTargetBadge = (item: BroadcastItem) => {
    const target = item.targetRole?.toLowerCase();
    const kelompokNama = item.targetNamaKelompok || item.targetKelompokNama;
    switch (target) {
      case 'semua':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Semua Pengguna</span>;
      case 'dosen':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Dosen Pembimbing</span>;
      case 'mahasiswa':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">Seluruh Mahasiswa</span>;
      case 'kelompok':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">Kelompok: {kelompokNama || `ID ${item.targetKelompokId}`}</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">{item.targetRole}</span>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header Card */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl animate-fade-in-down">
          {/* Subtle decorative watermark */}
          <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none transform rotate-12">
            <MegaphoneIcon className="w-44 h-44 sm:w-56 sm:h-56 text-white" />
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
                <MegaphoneIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Pusat Broadcast & Pengumuman</h1>
                <p className="text-xs sm:text-sm text-indigo-100/90">Kirim siaran terpusat dan kelola pengumuman resmi ke seluruh dosen, mahasiswa, maupun kelompok tertentu</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-100 self-start sm:self-center">
              <span>Total {stats.totalBroadcast || broadcasts.length} Broadcast</span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in shadow-sm">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {/* Error Alert with Retry button */}
        {errorMsg && !isModalOpen && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 animate-fade-in shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
            <button
              onClick={() => fetchData()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {/* Metric Cards (Aligned with SAPA Stats) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-card border border-slate-100/80 flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <MegaphoneIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Total Broadcast</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{stats.totalBroadcast || broadcasts.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-card border border-slate-100/80 flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Broadcast Aktif</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{stats.broadcastAktif || broadcasts.filter(b => b.isActive).length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-card border border-slate-100/80 flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Total Dibaca</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{stats.totalDibaca}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-card border border-slate-100/80 flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Siaran Bulan Ini</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{stats.broadcastBulanIni}</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-3.5 sm:p-4 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Cari judul, pengirim, atau isi pesan siaran..."
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:shadow-sm transition-all duration-200"
              />
            </div>

            {/* Filter Group */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex-1 sm:w-40">
                <SearchableSelect
                  value={filterTarget}
                  onChange={val => { setFilterTarget(String(val)); setCurrentPage(1); }}
                  options={[
                    { value: 'all', label: 'Semua Sasaran' },
                    { value: 'semua', label: 'Semua Pengguna' },
                    { value: 'dosen', label: 'Dosen' },
                    { value: 'mahasiswa', label: 'Mahasiswa' },
                    { value: 'kelompok', label: 'Kelompok' },
                  ]}
                  placeholder="Semua Sasaran"
                />
              </div>

              <div className="flex-1 sm:w-36">
                <SearchableSelect
                  value={filterPrioritas}
                  onChange={val => { setFilterPrioritas(String(val)); setCurrentPage(1); }}
                  options={[
                    { value: 'all', label: 'Semua Prioritas' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'penting', label: 'Penting' },
                    { value: 'mendesak', label: 'Mendesak' },
                  ]}
                  placeholder="Semua Prioritas"
                />
              </div>

              <div className="flex-1 sm:w-36">
                <SearchableSelect
                  value={filterStatus}
                  onChange={val => { setFilterStatus(String(val)); setCurrentPage(1); }}
                  options={[
                    { value: 'all', label: 'Semua Status' },
                    { value: 'active', label: 'Aktif' },
                    { value: 'inactive', label: 'Nonaktif' },
                  ]}
                  placeholder="Semua Status"
                />
              </div>

              <Tooltip content="Muat Ulang Data">
                <button
                  onClick={() => fetchData()}
                  disabled={loading}
                  className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <RefreshIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </Tooltip>

              <button
                onClick={handleOpenModal}
                className="px-4 py-2 sm:py-2.5 bg-gradient-to-r from-primary-900 to-indigo-900 hover:from-primary-800 hover:to-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>+</span>
                <span>Buat Broadcast</span>
              </button>
            </div>
          </div>
        </div>

        {/* Broadcast Table Card */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Memuat data broadcast pengumuman...</span>
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
                <MegaphoneIcon className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-base font-bold text-slate-700">Belum Ada Broadcast Pengumuman</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                {search || filterTarget !== 'all' || filterPrioritas !== 'all' || filterStatus !== 'all'
                  ? 'Tidak ada broadcast yang cocok dengan filter pencarian.'
                  : 'Klik tombol "+ Buat Broadcast" untuk mengirim pengumuman baru kepada pengguna sistem.'}
              </p>
            </div>
          ) : (
            <>
              {/* Table Header Info */}
              <div className="px-5 py-3.5 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-500 font-medium">
                  Menampilkan <span className="text-primary-900 font-bold">{totalItems === 0 ? 0 : startIndex + 1}</span> - <span className="text-primary-900 font-bold">{endIndex}</span> dari <span className="text-primary-900 font-bold">{totalItems}</span> Broadcast
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Tampilkan:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-xs text-slate-500 font-medium">data</span>
                </div>
              </div>

              <div className="overflow-x-auto pb-4">
                <table className="w-full min-w-max" id="table-broadcast">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 text-white">
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap w-14">No</th>
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Judul & Pesan</th>
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Sasaran</th>
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Prioritas & Kategori</th>
                      <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Pengirim & Waktu</th>
                      <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Dibaca / Sasaran</th>
                      <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedBroadcasts.map((item, index) => {
                      const senderName = item.senderName || item.createdByName || 'Administrator';
                      const totalPenerima = item.totalPenerima ?? item.jumlahPenerima ?? 0;
                      const totalDibaca = item.totalDibaca ?? 0;
                      const tautan = item.actionUrl || item.tautan;
                      const kategori = item.kategori || item.tipe || 'Pengumuman';

                      return (
                        <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${!item.isActive ? 'bg-slate-50/40 opacity-75' : ''}`}>
                          <td className="px-4 md:px-5 py-4 text-xs font-medium text-slate-500">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-4 md:px-5 py-4 max-w-sm">
                            <p className="font-bold text-slate-900 text-sm">{item.judul}</p>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{item.pesan}</p>
                            {tautan && (
                              <span className="inline-block mt-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                Tautan: {tautan}
                              </span>
                            )}
                          </td>
                          <td className="px-4 md:px-5 py-4 whitespace-nowrap">
                            {getTargetBadge(item)}
                          </td>
                          <td className="px-4 md:px-5 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              {getPriorityBadge(item.prioritas)}
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {kategori}
                              </span>
                            </div>
                          </td>
                          {/* Status & Toggle (SAPA Feature) */}
                          <td className="px-4 md:px-5 py-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(item)}
                              disabled={togglingId === item.id}
                              title="Klik untuk ubah status siaran"
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
                                item.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                              <span>{item.isActive ? 'Aktif' : 'Nonaktif'}</span>
                            </button>
                          </td>
                          <td className="px-4 md:px-5 py-4 whitespace-nowrap">
                            <p className="font-semibold text-slate-800 text-xs">{senderName}</p>
                            <p className="text-[11px] text-slate-400">
                              {new Date(item.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </td>
                          {/* Dibaca / Target Sasaran */}
                          <td className="px-4 md:px-5 py-4 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-xs font-bold text-slate-800">
                                {totalDibaca} <span className="font-normal text-slate-400">/ {totalPenerima} user</span>
                              </span>
                              <span className="text-[10px] font-semibold text-indigo-600">
                                {totalPenerima > 0 ? Math.round((totalDibaca / totalPenerima) * 100) : 0}% dibaca
                              </span>
                            </div>
                          </td>
                          <td className="px-4 md:px-5 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip content="Lihat Detail">
                                <button
                                  onClick={() => setDetailBroadcast(item)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 cursor-pointer"
                                >
                                  <DetailIcon className="w-4 h-4" />
                                </button>
                              </Tooltip>
                              <Tooltip content="Hapus Broadcast">
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer"
                                >
                                  <DeleteIcon className="w-4 h-4" />
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs">
                  <p className="text-slate-500">
                    Halaman <span className="font-bold text-slate-800">{currentPage}</span> dari <span className="font-bold text-slate-800">{totalPages}</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Tooltip content="Sebelumnya" position="top">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all disabled:opacity-40 shadow-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    </Tooltip>
                    <Tooltip content="Berikutnya" position="top">
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all disabled:opacity-40 shadow-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      {/* Modal Buat Broadcast */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-8 shadow-2xl ring-1 ring-black/5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-primary-100 text-primary-700 shrink-0">
                  <MegaphoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Buat Broadcast Pengumuman</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">Pemberitahuan akan disiarkan terpusat langsung ke lonceng notifikasi target pengguna.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={e => setFormJudul(e.target.value)}
                  placeholder="Contoh: Pembagian Rotasi Stase Semester Genap 2026"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-slate-800"
                />
              </div>

              {/* Isi Pesan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Isi Pesan / Pengumuman <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formPesan}
                  onChange={e => setFormPesan(e.target.value)}
                  placeholder="Tuliskan detail pengumuman yang ingin disampaikan secara lengkap..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 leading-relaxed"
                />
              </div>

              {/* Sasaran Penerima */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Sasaran Penerima <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTargetRole('semua')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formTargetRole === 'semua'
                        ? 'bg-primary-50 border-primary-600 text-primary-700 ring-2 ring-primary-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Semua Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTargetRole('dosen')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formTargetRole === 'dosen'
                        ? 'bg-primary-50 border-primary-600 text-primary-700 ring-2 ring-primary-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Dosen Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTargetRole('mahasiswa')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formTargetRole === 'mahasiswa'
                        ? 'bg-primary-50 border-primary-600 text-primary-700 ring-2 ring-primary-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Mahasiswa Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTargetRole('kelompok')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formTargetRole === 'kelompok'
                        ? 'bg-primary-50 border-primary-600 text-primary-700 ring-2 ring-primary-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Kelompok
                  </button>
                </div>
              </div>

              {/* Target Kelompok Dropdown jika sasaran kelompok */}
              {formTargetRole === 'kelompok' && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 animate-fade-in">
                  <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                    Pilih Kelompok Sasaran <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    value={formTargetKelompokId || ''}
                    onChange={val => setFormTargetKelompokId(val ? Number(val) : undefined)}
                    options={kelompoks.map(k => ({
                      value: k.id,
                      label: k.nama,
                      subLabel: `${k.daftarMahasiswa?.length || 0} Mahasiswa`
                    }))}
                    placeholder="Pilih Kelompok Sasaran"
                    required
                  />
                </div>
              )}

              {/* Prioritas & Kategori Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tingkat Prioritas
                  </label>
                  <SearchableSelect
                    value={formPrioritas}
                    onChange={val => setFormPrioritas(val as any)}
                    options={[
                      { value: 'Normal', label: 'Normal' },
                      { value: 'Penting', label: 'Penting', badge: 'Kuning' },
                      { value: 'Mendesak', label: 'Mendesak', badge: 'Merah' }
                    ]}
                    placeholder="Pilih Prioritas"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori
                  </label>
                  <SearchableSelect
                    value={formKategori}
                    onChange={val => setFormKategori(String(val))}
                    options={[
                      { value: 'Pengumuman', label: 'Pengumuman Umum' },
                      { value: 'Akademik', label: 'Akademik & Perkuliahan' },
                      { value: 'Jadwal', label: 'Jadwal & Stase' },
                      { value: 'Kegiatan', label: 'Kegiatan Lapangan' },
                      { value: 'Urgent', label: 'Darurat / Mendesak' }
                    ]}
                    placeholder="Pilih Kategori"
                  />
                </div>
              </div>

              {/* Tautan Aksi (Opsional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tautan Aksi (Opsional)
                </label>
                <input
                  type="text"
                  value={formActionUrl}
                  onChange={e => setFormActionUrl(e.target.value)}
                  placeholder="Contoh: /jadwal atau /kelompok"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Jika diisi, user yang mengklik notifikasi akan otomatis diarahkan ke tautan ini.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyiarkan...</span>
                    </>
                  ) : (
                    <>
                      <MegaphoneIcon className="w-4 h-4" />
                      <span>Siarkan Pengumuman</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail View */}
      {detailBroadcast && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-8 shadow-2xl ring-1 ring-black/5 animate-scale-in space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                  <MegaphoneIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{detailBroadcast.judul}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Disiarkan oleh <span className="font-semibold text-slate-600">{detailBroadcast.senderName || detailBroadcast.createdByName || 'Administrator'}</span> pada{' '}
                    {new Date(detailBroadcast.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailBroadcast(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 shrink-0 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {getTargetBadge(detailBroadcast)}
              {getPriorityBadge(detailBroadcast.prioritas)}
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                detailBroadcast.isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {detailBroadcast.isActive ? 'Status: Aktif' : 'Status: Nonaktif'}
              </span>
              <span className="text-xs text-slate-500 font-medium ml-auto">
                {detailBroadcast.totalDibaca ?? 0} dibaca / {detailBroadcast.totalPenerima ?? detailBroadcast.jumlahPenerima ?? 0} sasaran
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
              {detailBroadcast.pesan}
            </div>

            {(detailBroadcast.actionUrl || detailBroadcast.tautan) && (
              <div className="text-xs font-medium text-slate-500 p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                Tautan terkait:{' '}
                <a
                  href={detailBroadcast.actionUrl || detailBroadcast.tautan}
                  className="text-primary-600 underline font-semibold ml-1"
                >
                  {detailBroadcast.actionUrl || detailBroadcast.tautan}
                </a>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailBroadcast(null)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors text-center cursor-pointer"
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
