import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { pembimbingApi, type Pembimbing } from '../services/api';

export default function DosenPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Pembimbing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit inline state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nip: '', nama: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await pembimbingApi.getAll();
      setData(result);
    } catch {
      setError('Gagal memuat data dosen. Pastikan server backend sedang berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(dsn => {
    const matchSearch = dsn.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dsn.nip.includes(searchTerm);
    return matchSearch;
  });

  // === DELETE ===
  const handleDelete = (id: number) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      setDeleting(true);
      await pembimbingApi.delete(selectedId);
      setData(prev => prev.filter(d => d.id !== selectedId));
    } catch {
      setError('Gagal menghapus data dosen.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  // === EDIT INLINE ===
  const startEdit = (dsn: Pembimbing) => {
    setEditingId(dsn.id);
    setEditForm({ nip: dsn.nip, nama: dsn.nama });
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ nip: '', nama: '' });
    setEditErrors({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      setEditErrors({});
      await pembimbingApi.update(editingId, {
        id: editingId,
        nip: editForm.nip,
        nama: editForm.nama,
      });
      // Update local state
      setData(prev =>
        prev.map(d =>
          d.id === editingId ? { ...d, nip: editForm.nip, nama: editForm.nama } : d
        )
      );
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

  const selectedDosen = data.find(d => d.id === selectedId);

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all duration-200"
          >
            ←
          </button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-md">
            👨‍🏫
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Kelola Dosen</h1>
            <p className="text-sm text-slate-500">Tambah, edit, atau hapus data dosen pembimbing</p>
          </div>
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Cari dosen berdasarkan nama atau NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400
                focus:outline-none focus:border-green-400 focus:bg-white focus:shadow-sm transition-all duration-200"
              id="search-dosen"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 
              text-slate-600 font-medium rounded-xl transition-all duration-200 text-sm flex items-center gap-2"
            title="Muat ulang data"
          >
            🔄 Refresh
          </button>

          {/* Add Button */}
          <button
            onClick={() => navigate('/dosen/tambah')}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 
              text-white font-semibold rounded-xl shadow-md hover:shadow-glow-green 
              transition-all duration-300 active:scale-95 text-sm flex items-center gap-2 whitespace-nowrap"
            id="btn-tambah-dosen"
          >
            <span>+</span> Tambah Dosen
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Memuat data dosen dari server...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-5xl block mb-4">👨‍🏫</span>
            <p className="text-slate-600 font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan menambah dosen baru'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header Info */}
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="text-primary-900 font-bold">{filteredData.length}</span> dari <span className="text-primary-900 font-bold">{data.length}</span> dosen
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" id="table-dosen">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">No</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">NIP</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Nama Dosen</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Kelompok</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((dsn, index) => (
                    <tr key={dsn.id} className="hover:bg-green-50/30 transition-colors duration-150 group">
                      <td className="px-5 py-3.5 text-sm text-slate-500">{index + 1}</td>

                      {/* NIP */}
                      <td className="px-5 py-3.5">
                        {editingId === dsn.id ? (
                          <div>
                            <input
                              value={editForm.nip}
                              onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })}
                              className={`px-3 py-1.5 bg-slate-50 border-2 rounded-lg text-sm font-mono w-36
                                focus:outline-none focus:border-green-500 transition-all
                                ${editErrors.nip ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                            {editErrors.nip && (
                              <p className="text-xs text-red-500 mt-1">{editErrors.nip}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm font-mono text-slate-600">{dsn.nip}</span>
                        )}
                      </td>

                      {/* Nama */}
                      <td className="px-5 py-3.5">
                        {editingId === dsn.id ? (
                          <input
                            value={editForm.nama}
                            onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                            className="px-3 py-1.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm w-full
                              focus:outline-none focus:border-green-500 transition-all"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                              {dsn.nama.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-primary-900">{dsn.nama}</span>
                          </div>
                        )}
                      </td>

                      {/* Kelompok */}
                      <td className="px-5 py-3.5">
                        {dsn.daftarKelompok && dsn.daftarKelompok.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {dsn.daftarKelompok.map(kId => (
                              <span key={kId} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                Kelompok {kId}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                            Belum ada
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          {editingId === dsn.id ? (
                            <>
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium
                                  transition-all duration-200 disabled:opacity-50 flex items-center gap-1"
                              >
                                {saving ? (
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : '✓'} Simpan
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-medium
                                  transition-all duration-200"
                              >
                                ✕ Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(dsn)}
                                className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 transition-all duration-200 text-sm
                                  opacity-0 group-hover:opacity-100"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(dsn.id)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200 text-sm
                                  opacity-0 group-hover:opacity-100"
                                title="Hapus"
                              >
                                🗑️
                              </button>
                            </>
                          )}
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
              <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Dosen?</h3>
              {selectedDosen && (
                <p className="text-sm text-slate-600 font-medium mb-1">
                  {selectedDosen.nama} ({selectedDosen.nip})
                </p>
              )}
              <p className="text-sm text-slate-500">Data yang dihapus tidak dapat dikembalikan</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200 text-sm"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-md hover:shadow-glow-red transition-all duration-200 text-sm disabled:opacity-70 flex items-center justify-center gap-2"
                id="btn-confirm-delete"
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
