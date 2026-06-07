/* eslint-disable react-hooks/set-state-in-effect */
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { pembimbingApi, type Pembimbing } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { DosenIcon, RefreshIcon, SearchIcon, EditIcon, DeleteIcon } from '../components/Icons';
import Tooltip from '../components/Tooltip';

export default function DosenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPengelola = user?.role?.toLowerCase() === 'pengelola';
  const [data, setData] = useState<Pembimbing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortColumn, setSortColumn] = useState<string>('nama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
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

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    if (sortColumn === 'nip') {
      aVal = a.nip || '';
      bVal = b.nip || '';
    } else if (sortColumn === 'nama') {
      aVal = a.nama || '';
      bVal = b.nama || '';
    } else if (sortColumn === 'kelompok') {
      aVal = a.daftarKelompok ? a.daftarKelompok.join(', ') : '';
      bVal = b.daftarKelompok ? b.daftarKelompok.join(', ') : '';
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (column: string) => {
    if (sortColumn !== column) return <span className="text-slate-300 ml-1">⇅</span>;
    return sortDirection === 'asc' ? <span className="text-white ml-1">▲</span> : <span className="text-white ml-1">▼</span>;
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

  // === EDIT MODAL ===
  const startEdit = (dsn: Pembimbing) => {
    setEditingId(dsn.id);
    setEditForm({ nip: dsn.nip, nama: dsn.nama });
    setEditErrors({});
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ nip: '', nama: '' });
    setEditErrors({});
    setShowEditModal(false);
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
      setShowEditModal(false);
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md">
            <DosenIcon className="w-6 h-6" />
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
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
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
          <Tooltip content="Muat ulang data" position="bottom">
            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-200 flex items-center justify-center"
            >
              <RefreshIcon className="w-5 h-5" />
            </button>
          </Tooltip>

          {/* Add Button */}
          {!isPengelola && (
            <button
              onClick={() => navigate('/dosen/tambah')}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 
                text-white font-semibold rounded-xl shadow-md hover:shadow-glow-green 
                transition-all duration-300 active:scale-95 text-sm flex items-center gap-2 whitespace-nowrap"
              id="btn-tambah-dosen"
            >
              <span>+</span> Tambah Dosen
            </button>
          )}
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
            <div className="flex justify-center mb-4 text-slate-300">
              <DosenIcon className="w-16 h-16" />
            </div>
            <p className="text-slate-600 font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan menambah dosen baru'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header Info */}
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="text-primary-900 font-bold">{totalItems === 0 ? 0 : startIndex + 1}</span> - <span className="text-primary-900 font-bold">{endIndex}</span> dari <span className="text-primary-900 font-bold">{totalItems}</span> Dosen
              </p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Tampilkan:</label>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-green-400 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs text-slate-500 font-medium">data</span>
              </div>
            </div>
            <div className="overflow-x-auto pb-4">
              <table className="w-full min-w-max" id="table-dosen">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
                    <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap w-16">No</th>
                    <th
                      onClick={() => handleSort('nip')}
                      className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-emerald-700/50"
                    >
                      NIP {renderSortIndicator('nip')}
                    </th>
                    <th
                      onClick={() => handleSort('nama')}
                      className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-emerald-700/50"
                    >
                      Nama Dosen {renderSortIndicator('nama')}
                    </th>
                    <th
                      onClick={() => handleSort('kelompok')}
                      className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-emerald-700/50"
                    >
                      Kelompok {renderSortIndicator('kelompok')}
                    </th>
                    {!isPengelola && (
                      <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((dsn, index) => (
                    <tr key={dsn.id} className="hover:bg-green-50/30 transition-colors duration-150 group">
                      <td className="px-4 md:px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{startIndex + index + 1}</td>

                      {/* NIP */}
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-mono text-slate-600">{dsn.nip}</span>
                      </td>

                      {/* Nama */}
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {dsn.nama.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-primary-900">{dsn.nama}</span>
                        </div>
                      </td>

                      {/* Kelompok */}
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        {dsn.daftarKelompok && dsn.daftarKelompok.length > 0 ? (
                          <div className="flex gap-1 min-w-max">
                            {dsn.daftarKelompok.map(kId => (
                              <span key={kId} className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                Kelompok {kId}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                            Belum ada
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      {!isPengelola && (
                        <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip content="Edit" position="bottom">
                              <button
                                onClick={() => startEdit(dsn)}
                                className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 transition-all duration-200 text-sm"
                              >
                                <EditIcon className="w-5 h-5" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Hapus" position="bottom">
                              <button
                                onClick={() => handleDelete(dsn.id)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200 text-sm"
                              >
                                <DeleteIcon className="w-5 h-5" />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs font-medium text-slate-500">
                  Memiliki Toral <span className="text-primary-900 font-bold">{totalItems}</span> Data
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
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
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

      {/* Edit Dosen Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 animate-scale-in overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-green-50">
              <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full" />
                Edit Data Dosen
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* NIP */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">NIP <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editForm.nip}
                  onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white transition-all ${
                    editErrors.nip ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                  placeholder="Masukkan NIP..."
                />
                {editErrors.nip && (
                  <p className="text-xs text-red-500 mt-1">{editErrors.nip}</p>
                )}
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all ${
                    editErrors.nama ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                  placeholder="Masukkan nama lengkap..."
                />
                {editErrors.nama && (
                  <p className="text-xs text-red-500 mt-1">{editErrors.nama}</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="px-5 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                ) : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

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
