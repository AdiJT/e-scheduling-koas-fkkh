import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { broadcastApi, type BroadcastItem, kelompokApi, type Kelompok } from '../services/api';
import { MegaphoneIcon, SearchIcon, RefreshIcon } from '../components/Icons';

export default function BroadcastPage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [kelompoks, setKelompoks] = useState<Kelompok[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
    return (
      b.judul.toLowerCase().includes(q) ||
      b.pesan.toLowerCase().includes(q) ||
      b.senderName?.toLowerCase().includes(q) ||
      b.targetRole.toLowerCase().includes(q)
    );
  });

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <MegaphoneIcon className="w-6 h-6 text-amber-300" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Pusat Broadcast & Pengumuman</h1>
          </div>
          <p className="text-sm text-primary-100/80 max-w-xl">
            Kirim pengumuman resmi dan pemberitahuan penting langsung ke panel notifikasi dosen, mahasiswa, maupun kelompok tertentu.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md"
            title="Muat Ulang"
          >
            <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Buat Broadcast
          </button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <MegaphoneIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Broadcast</p>
            <p className="text-2xl font-bold text-slate-800">{totalBroadcast}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
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

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
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

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
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

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul, pengirim, atau isi pesan..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <span className="text-xs text-slate-500 self-center">
            Menampilkan <span className="font-semibold text-slate-700">{filteredBroadcasts.length}</span> pengumuman
          </span>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm">Memuat data broadcast...</p>
          </div>
        ) : filteredBroadcasts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <MegaphoneIcon className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-base font-bold text-slate-700">Belum Ada Broadcast Pengumuman</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Klik tombol <span className="font-semibold text-primary-600">"Buat Broadcast"</span> untuk mengirim pengumuman baru kepada pengguna sistem.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 lg:px-6">Judul & Pesan</th>
                  <th className="py-3.5 px-4">Sasaran</th>
                  <th className="py-3.5 px-4">Prioritas & Kategori</th>
                  <th className="py-3.5 px-4">Pengirim & Waktu</th>
                  <th className="py-3.5 px-4 text-center">Penerima</th>
                  <th className="py-3.5 px-4 lg:px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBroadcasts.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 lg:px-6 max-w-md">
                      <p className="font-bold text-slate-900 text-sm">{item.judul}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{item.pesan}</p>
                      {item.actionUrl && (
                        <span className="inline-block mt-1 text-[11px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                          Tautan: {item.actionUrl}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getTargetBadge(item)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {getPriorityBadge(item.prioritas)}
                        {item.kategori && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.kategori}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
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
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                        {item.totalPenerima} user
                      </span>
                    </td>
                    <td className="py-4 px-4 lg:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailBroadcast(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Lihat Detail"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Broadcast"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
