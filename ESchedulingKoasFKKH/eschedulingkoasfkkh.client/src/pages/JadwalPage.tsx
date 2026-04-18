import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { jadwalApi, type Jadwal } from '../services/api';
import { formatDateDisplay } from '../utils/holidays';

export default function JadwalPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await jadwalApi.getAll();
      setData(result);
    } catch {
      setError('Gagal memuat data jadwal. Pastikan server backend sedang berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate status based on dates
  const getStatus = (tanggalMulai: string, tanggalSelesai: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(tanggalMulai + 'T00:00:00');
    const end = new Date(tanggalSelesai + 'T00:00:00');
    
    if (today > end) return 'Selesai';
    if (today >= start && today <= end) return 'Berlangsung';
    return 'Akan Datang';
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Berlangsung': return 'bg-green-100 text-green-700 border-green-200';
      case 'Akan Datang': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Selesai': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'Berlangsung': return '🟢';
      case 'Akan Datang': return '🔵';
      case 'Selesai': return '⚪';
      default: return '⚪';
    }
  };

  const dataWithStatus = data.map(j => ({
    ...j,
    status: getStatus(j.tanggalMulai, j.tanggalSelesai),
  }));

  const filteredData = dataWithStatus.filter(j =>
    filterStatus === 'all' || j.status === filterStatus
  );

  // Stats
  const countBerlangsung = dataWithStatus.filter(j => j.status === 'Berlangsung').length;
  const countAkanDatang = dataWithStatus.filter(j => j.status === 'Akan Datang').length;
  const countSelesai = dataWithStatus.filter(j => j.status === 'Selesai').length;

  // === DELETE ===
  const handleDelete = (id: number) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      setDeleting(true);
      await jadwalApi.delete(selectedId);
      setData(prev => prev.filter(j => j.id !== selectedId));
    } catch {
      setError('Gagal menghapus jadwal.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  const selectedJadwal = dataWithStatus.find(j => j.id === selectedId);

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-2xl shadow-md">📅</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Kelola Jadwal</h1><p className="text-sm text-slate-500">Kelola jadwal stase KOAS</p></div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in-down">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg">✕</button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 animate-fade-in-up">
        <button onClick={() => navigate('/jadwal/tambah')}
          className="p-4 bg-gradient-to-r from-primary-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white rounded-2xl shadow-elevated hover:shadow-glow-blue transition-all flex items-center gap-4 group"
          id="btn-tambah-jadwal">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📝</div>
          <div className="text-left">
            <p className="font-bold text-sm">Tambah Jadwal</p>
            <p className="text-xs text-blue-200/60">Buat jadwal stase baru</p>
          </div>
        </button>
        <button onClick={fetchData}
          className="p-4 bg-white border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-slate-600 hover:text-blue-600 rounded-2xl shadow-soft hover:shadow-card transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-2xl transition-all">🔄</div>
          <div className="text-left">
            <p className="font-bold text-sm">Refresh Data</p>
            <p className="text-xs text-slate-400">Muat ulang data dari server</p>
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-lg shadow-md">📊</div>
            <div><p className="text-xl font-bold text-primary-900">{data.length}</p><p className="text-xs text-slate-500">Total</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center text-lg shadow-md">🟢</div>
            <div><p className="text-xl font-bold text-primary-900">{countBerlangsung}</p><p className="text-xs text-slate-500">Berlangsung</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-lg shadow-md">🔵</div>
            <div><p className="text-xl font-bold text-primary-900">{countAkanDatang}</p><p className="text-xs text-slate-500">Akan Datang</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-lg shadow-md">⚪</div>
            <div><p className="text-xl font-bold text-primary-900">{countSelesai}</p><p className="text-xs text-slate-500">Selesai</p></div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {['all', 'Berlangsung', 'Akan Datang', 'Selesai'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === s
                ? 'bg-primary-900 text-white shadow-md'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}>
            {s === 'all' ? 'Semua' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Memuat jadwal dari server...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-5xl block mb-4">📅</span>
            <p className="text-slate-600 font-medium">Tidak ada jadwal ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">Mulai dengan menambah jadwal baru</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="text-primary-900 font-bold">{filteredData.length}</span> dari <span className="text-primary-900 font-bold">{data.length}</span> jadwal
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" id="table-jadwal">
                <thead>
                  <tr className="bg-gradient-to-r from-rose-600 to-red-700 text-white">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">No</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Kelompok</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Stase</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Periode</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase">Status</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((j, i) => (
                    <tr key={j.id} className="hover:bg-red-50/20 transition-colors group">
                      <td className="px-5 py-3.5 text-sm text-slate-500">{i + 1}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-primary-900">{j.namaKelompok}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                          {j.namaStase}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs text-slate-600">
                          <span className="font-medium">{formatDateDisplay(j.tanggalMulai)}</span>
                          <span className="text-slate-400 mx-1.5">→</span>
                          <span className="font-medium">{formatDateDisplay(j.tanggalSelesai)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(j.status)}`}>
                          {statusIcon(j.status)} {j.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleDelete(j.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200 text-sm opacity-0 group-hover:opacity-100"
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4 animate-scale-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Jadwal?</h3>
              {selectedJadwal && (
                <p className="text-sm text-slate-600 font-medium mb-1">
                  {selectedJadwal.namaKelompok} — {selectedJadwal.namaStase}
                </p>
              )}
              <p className="text-sm text-slate-500">Data yang dihapus tidak dapat dikembalikan</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-all"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
              >
                {deleting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menghapus...</>
                ) : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
