import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { broadcastApi, type BroadcastItem, kelompokApi, type Kelompok } from '../services/api';
import { MegaphoneIcon, SearchIcon, RefreshIcon, DetailIcon, DeleteIcon } from '../components/Icons';
import Tooltip from '../components/Tooltip';

export default function BroadcastPage() {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [kelompoks, setKelompoks] = useState<Kelompok[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTarget, setFilterTarget] = useState<string>('all');
  const [filterPrioritas, setFilterPrioritas] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [bList, kList] = await Promise.all([
        broadcastApi.getAll(),
        kelompokApi.getAll().catch(() => []),
      ]);
      setBroadcasts(bList || []);
      setKelompoks(kList || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal memuat riwayat broadcast pengumuman.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        actionUrl: formActionUrl.trim() || undefined,
      });

      setSuccessMsg('Pengumuman broadcast berhasil dikirim ke seluruh sasaran pengguna!');
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus arsip pengumuman broadcast ini?')) return;
    try {
      await broadcastApi.delete(id);
      setBroadcasts(prev => prev.filter(b => b.id !== id));
      setSuccessMsg('Broadcast berhasil dihapus.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus broadcast: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  // Stats calculation
  const totalBroadcast = broadcasts.length;
  const targetDosenCount = broadcasts.filter(b => b.targetRole?.toLowerCase() === 'dosen').length;
  const targetMahasiswaCount = broadcasts.filter(b => b.targetRole?.toLowerCase() === 'mahasiswa').length;
  const targetSemuaCount = broadcasts.filter(b => b.targetRole?.toLowerCase() === 'semua').length;

  const filteredBroadcasts = broadcasts.filter(b => {
    const q = search.toLowerCase();
    const matchSearch =
      b.judul.toLowerCase().includes(q) ||
      b.pesan.toLowerCase().includes(q) ||
      (b.senderName && b.senderName.toLowerCase().includes(q)) ||
      (b.targetRole && b.targetRole.toLowerCase().includes(q));

    const matchTarget = filterTarget === 'all' || b.targetRole?.toLowerCase() === filterTarget.toLowerCase();
    const matchPrioritas = filterPrioritas === 'all' || b.prioritas?.toLowerCase() === filterPrioritas.toLowerCase();

    return matchSearch && matchTarget && matchPrioritas;
  });

  const totalItems = filteredBroadcasts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedBroadcasts = filteredBroadcasts.slice(startIndex, endIndex);

  const getPriorityBadge = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'mendesak':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-100 text-rose-700 border border-rose-200">Mendesak</span>;
      case 'penting':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 text-amber-700 border border-amber-200">Penting</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-700">Normal</span>;
    }
  };

  const getTargetBadge = (item: BroadcastItem) => {
    switch (item.targetRole?.toLowerCase()) {
      case 'semua':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Semua Pengguna</span>;
      case 'dosen':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Dosen Pembimbing</span>;
      case 'mahasiswa':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">Seluruh Mahasiswa</span>;
      case 'kelompok':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">Kelompok: {item.targetNamaKelompok || `ID ${item.targetKelompokId}`}</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">{item.targetRole}</span>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header Card */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 rounded-2xl p-6 text-white shadow-xl animate-fade-in-down">
          {/* Subtle decorative watermark */}
          <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none transform rotate-12">
            <MegaphoneIcon className="w-56 h-56 text-white" />
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
                <MegaphoneIcon className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Pusat Broadcast & Pengumuman</h1>
                <p className="text-sm text-indigo-100/90">Kirim dan kelola pengumuman resmi ke dosen, mahasiswa, maupun kelompok tertentu</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-100 self-start sm:self-center">
              <span>Total {totalBroadcast} Broadcast</span>
            </div>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}
        {errorMsg && !isModalOpen && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <MegaphoneIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Broadcast</p>
              <p className="text-2xl font-bold text-slate-800">{totalBroadcast}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semua Pengguna</p>
              <p className="text-2xl font-bold text-slate-800">{targetSemuaCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sasaran Dosen</p>
              <p className="text-2xl font-bold text-slate-800">{targetDosenCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sasaran Mahasiswa</p>
              <p className="text-2xl font-bold text-slate-800">{targetMahasiswaCount}</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Cari judul, pengirim, atau isi pesan broadcast..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400
                  focus:outline-none focus:border-indigo-400 focus:bg-white focus:shadow-sm transition-all duration-200"
              />
            </div>

            {/* Filter Sasaran */}
            <select
              value={filterTarget}
              onChange={e => { setFilterTarget(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700
                focus:outline-none focus:border-indigo-400 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">Semua Sasaran</option>
              <option value="semua">Semua Pengguna</option>
              <option value="dosen">Dosen Pembimbing</option>
              <option value="mahasiswa">Seluruh Mahasiswa</option>
              <option value="kelompok">Kelompok Tertentu</option>
            </select>

            {/* Filter Prioritas */}
            <select
              value={filterPrioritas}
              onChange={e => { setFilterPrioritas(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700
                focus:outline-none focus:border-indigo-400 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">Semua Prioritas</option>
              <option value="Normal">Normal</option>
              <option value="Penting">Penting</option>
              <option value="Mendesak">Mendesak</option>
            </select>

            {/* Refresh Button */}
            <Tooltip content="Muat ulang data" position="bottom">
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </Tooltip>

            {/* Buat Broadcast Button */}
            <button
              onClick={handleOpenModal}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-900 to-indigo-800 hover:from-primary-800 hover:to-indigo-700 
                text-white font-semibold rounded-xl shadow-md hover:shadow-glow-indigo 
                transition-all duration-300 active:scale-95 text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>+</span> Buat Broadcast
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Memuat data broadcast dari server...</p>
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <div className="p-16 text-center">
              <div className="flex justify-center mb-4 text-slate-300">
                <MegaphoneIcon className="w-16 h-16 opacity-40" />
              </div>
              <h3 className="text-base font-bold text-slate-700">Belum Ada Broadcast Pengumuman</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                {search || filterTarget !== 'all' || filterPrioritas !== 'all'
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
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap w-16">No</th>
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Judul & Pesan</th>
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Sasaran</th>
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Prioritas & Kategori</th>
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Pengirim & Waktu</th>
                      <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Penerima</th>
                      <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedBroadcasts.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 md:px-5 py-4 text-xs font-medium text-slate-500">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-4 md:px-5 py-4 max-w-md">
                          <p className="font-bold text-slate-900 text-sm">{item.judul}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{item.pesan}</p>
                          {item.actionUrl && (
                            <span className="inline-block mt-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              Tautan: {item.actionUrl}
                            </span>
                          )}
                        </td>
                        <td className="px-4 md:px-5 py-4 whitespace-nowrap">
                          {getTargetBadge(item)}
                        </td>
                        <td className="px-4 md:px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            {getPriorityBadge(item.prioritas)}
                            {item.kategori && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {item.kategori}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 md:px-5 py-4 whitespace-nowrap">
                          <p className="font-medium text-slate-800 text-xs">{item.senderName || 'Admin'}</p>
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
                        <td className="px-4 md:px-5 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                            {item.totalPenerima} user
                          </span>
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    Memiliki Total <span className="text-primary-900 font-bold">{totalItems}</span> Data
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Tooltip content="Sebelumnya" position="top">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-white shadow-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    </Tooltip>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all shadow-sm ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <Tooltip content="Berikutnya" position="top">
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-white shadow-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl ring-1 ring-black/5 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-100 text-primary-700">
                  <MegaphoneIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Buat Broadcast Pengumuman</h3>
                  <p className="text-xs text-slate-500">Pemberitahuan akan disiarkan langsung ke notifikasi target pengguna.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
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
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
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
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
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
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
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
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
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
                  <select
                    value={formTargetKelompokId || ''}
                    onChange={e => setFormTargetKelompokId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                  >
                    <option value="">-- Pilih Kelompok --</option>
                    {kelompoks.map(k => (
                      <option key={k.id} value={k.id}>
                        {k.nama} ({k.daftarMahasiswa?.length || 0} Mahasiswa)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Prioritas & Kategori Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={formPrioritas}
                    onChange={e => setFormPrioritas(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Penting">Penting (Highlight Kuning)</option>
                    <option value="Mendesak">Mendesak (Highlight Merah)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={formKategori}
                    onChange={e => setFormKategori(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="Pengumuman">Pengumuman Umum</option>
                    <option value="Akademik">Akademik & Perkuliahan</option>
                    <option value="Jadwal">Jadwal & Stase</option>
                    <option value="Kegiatan">Kegiatan Lapangan</option>
                    <option value="Urgent">Darurat / Mendesak</option>
                  </select>
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
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Mengirim...</span>
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl ring-1 ring-black/5 animate-scale-in space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <MegaphoneIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{detailBroadcast.judul}</h3>
                  <p className="text-xs text-slate-400">
                    Disiarkan oleh <span className="font-semibold text-slate-600">{detailBroadcast.senderName}</span> pada{' '}
                    {new Date(detailBroadcast.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailBroadcast(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {getTargetBadge(detailBroadcast)}
              {getPriorityBadge(detailBroadcast.prioritas)}
              {detailBroadcast.kategori && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {detailBroadcast.kategori}
                </span>
              )}
              <span className="text-xs text-slate-500 font-medium ml-auto">
                {detailBroadcast.totalPenerima} penerima
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
              {detailBroadcast.pesan}
            </div>

            {detailBroadcast.actionUrl && (
              <div className="text-xs font-medium text-slate-500">
                Tautan terkait:{' '}
                <a
                  href={detailBroadcast.actionUrl}
                  className="text-primary-600 underline font-semibold"
                >
                  {detailBroadcast.actionUrl}
                </a>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailBroadcast(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
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
