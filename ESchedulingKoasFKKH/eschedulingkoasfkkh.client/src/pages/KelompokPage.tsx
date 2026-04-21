/* eslint-disable react-hooks/set-state-in-effect */
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { kelompokApi, pembimbingApi, type Kelompok, type Pembimbing } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const colors = [
  'from-blue-500 to-blue-600', 'from-emerald-500 to-green-600', 'from-purple-500 to-purple-600',
  'from-orange-500 to-orange-600', 'from-rose-500 to-red-600', 'from-cyan-500 to-cyan-600',
];

export default function KelompokPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPengelola = user?.role?.toLowerCase() === 'pengelola';
  const isMahasiswa = user?.role?.toLowerCase() === 'mahasiswa';
  const isDosen = user?.role?.toLowerCase() === 'dosen';
  const [data, setData] = useState<Kelompok[]>([]);
  const [pembimbingList, setPembimbingList] = useState<Pembimbing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [kelompokData, pembimbingData] = await Promise.all([
        kelompokApi.getAll(),
        pembimbingApi.getAll(),
      ]);
      setData(kelompokData);
      setPembimbingList(pembimbingData);
    } catch {
      setError('Gagal memuat data kelompok. Pastikan server backend sedang berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(k => {
    const matchSearch = k.nama.toLowerCase().includes(searchTerm.toLowerCase());
    if (isMahasiswa) {
      const isMember = k.daftarMahasiswa.some(m => m.nim === user?.username);
      return matchSearch && isMember;
    }
    if (isDosen) {
      const isAssigned = k.idPembimbing === user?.profileId;
      return matchSearch && isAssigned;
    }
    return matchSearch;
  });

  const getPembimbingNama = (idPembimbing: number | null) => {
    if (!idPembimbing) return null;
    return pembimbingList.find(p => p.id === idPembimbing)?.nama || null;
  };

  // === DELETE ===
  const handleDelete = (id: number) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      setDeleting(true);
      await kelompokApi.delete(selectedId);
      setData(prev => prev.filter(k => k.id !== selectedId));
    } catch {
      setError('Gagal menghapus kelompok.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  // === INLINE EDIT ===
  const startEdit = (kel: Kelompok) => {
    setEditingId(kel.id);
    setEditNama(kel.nama);
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNama('');
    setEditErrors({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      setEditErrors({});
      await kelompokApi.update(editingId, { id: editingId, nama: editNama });
      setData(prev => prev.map(k => k.id === editingId ? { ...k, nama: editNama } : k));
      setEditingId(null);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; errors?: Record<string, string> };
      if (apiErr?.status === 400 && apiErr?.errors) {
        setEditErrors(apiErr.errors);
      } else {
        setError('Gagal menyimpan perubahan.');
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedKelompok = data.find(k => k.id === selectedId);

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-2xl shadow-md">👥</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Kelola Kelompok</h1><p className="text-sm text-slate-500">Buat dan kelola kelompok mahasiswa</p></div>
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

      {/* Action Bar */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 mb-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input type="text" placeholder="Cari kelompok..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-all" id="search-kelompok" />
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium rounded-xl transition-all text-sm flex items-center gap-2"
            title="Muat ulang data"
          >
            🔄 Refresh
          </button>
          {!isPengelola && !isMahasiswa && !isDosen && (
            <button onClick={() => navigate('/kelompok/tambah')} className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-md hover:shadow-glow-orange transition-all text-sm flex items-center gap-2" id="btn-tambah-kelompok">
              + Buat Kelompok
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <div className="bg-white rounded-2xl shadow-card p-16 text-center">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Memuat data kelompok dari server...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-16 text-center">
            <span className="text-5xl block mb-4">👥</span>
            <p className="text-slate-600 font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan membuat kelompok baru'}
            </p>
          </div>
        ) : (
          <>
            <div className="px-1 mb-3">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="text-primary-900 font-bold">{filteredData.length}</span> dari <span className="text-primary-900 font-bold">{data.length}</span> kelompok
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.map((kel, i) => {
                const pembimbingNama = getPembimbingNama(kel.idPembimbing);
                
                // Determine current stase
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const currentJadwal = kel.daftarJadwal?.find(j => {
                  const start = new Date(j.tanggalMulai + 'T00:00:00');
                  const end = new Date(j.tanggalSelesai + 'T00:00:00');
                  return today >= start && today <= end;
                });
                const currentStase = currentJadwal?.namaStase;

                return (
                  <div key={kel.id} className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className={`h-2 bg-gradient-to-r ${colors[i % colors.length]}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:scale-110 transition-transform`}>
                          K{kel.id}
                        </div>
                      </div>

                      {editingId === kel.id ? (
                        <div className="mb-3">
                          <input
                            value={editNama}
                            onChange={(e) => setEditNama(e.target.value)}
                            className={`w-full px-3 py-2 bg-slate-50 border-2 rounded-lg text-sm font-bold
                              focus:outline-none focus:border-orange-500 transition-all
                              ${editErrors.nama ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                          />
                          {editErrors.nama && <p className="text-xs text-red-500 mt-1">{editErrors.nama}</p>}
                        </div>
                      ) : (
                        <h3 className="text-lg font-bold text-primary-900 mb-1">{kel.nama}</h3>
                      )}

                      <div className="space-y-1.5 mb-4 text-xs text-slate-500">
                        <p>👨‍🏫 Pembimbing: {pembimbingNama || <span className="text-slate-400 italic">Belum ditentukan</span>}</p>
                        <p>👥 {kel.daftarMahasiswa.length} Anggota</p>
                        <p className="flex justify-between">
                          <span>📅 {kel.daftarJadwal.length} Jadwal</span>
                          {currentStase ? (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-100">
                              Sedang Stase: {currentStase}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px] font-medium border border-slate-200">
                              Tidak ada stase aktif
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        {editingId === kel.id ? (
                          <>
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-600 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {saving ? <div className="w-3 h-3 border-2 border-green-400/30 border-t-green-500 rounded-full animate-spin" /> : '✓'} Simpan
                            </button>
                            <button onClick={cancelEdit} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition-all">
                              ✕ Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => navigate(`/kelompok/${kel.id}`)} className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-xl transition-all">👁️ Detail</button>
                            {!isPengelola && !isMahasiswa && !isDosen && (
                              <>
                                <button onClick={() => startEdit(kel)} className="flex-1 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-xl transition-all">✏️ Edit</button>
                                <button onClick={() => handleDelete(kel.id)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-all">🗑️ Hapus</button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4 animate-scale-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><span className="text-3xl">⚠️</span></div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Kelompok?</h3>
              {selectedKelompok && (
                <p className="text-sm text-slate-600 font-medium mb-1">{selectedKelompok.nama}</p>
              )}
              <p className="text-sm text-slate-500">Data yang dihapus tidak dapat dikembalikan</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-70 flex items-center justify-center gap-2"
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
