/* eslint-disable react-hooks/set-state-in-effect */
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { staseApi, type Stase } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StaseIcon, RefreshIcon, SearchIcon, EditIcon, DeleteIcon, DetailIcon, InfoIcon, SaveIcon, JadwalIcon as ClockIcon, StaseTerpisahIcon, StaseBersamaanIcon } from '../components/Icons';
import Tooltip from '../components/Tooltip';

export default function StasePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPengelola = user?.role?.toLowerCase() === 'pengelola';
  const isMahasiswa = user?.role?.toLowerCase() === 'mahasiswa';
  const isDosen = user?.role?.toLowerCase() === 'dosen';
  const [data, setData] = useState<Stase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortColumn, setSortColumn] = useState<string>('nama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterJenis]);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: 0, nama: '', waktu: 1, jenis: 'Terpisah' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await staseApi.getAll();
      setData(result);
    } catch {
      setError('Gagal memuat data stase. Pastikan server backend sedang berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(s => {
    const matchSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenis = filterJenis === 'all' || s.jenis === filterJenis;
    return matchSearch && matchJenis;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    if (sortColumn === 'nama') {
      aVal = a.nama || '';
      bVal = b.nama || '';
    } else if (sortColumn === 'waktu') {
      aVal = a.waktu || 0;
      bVal = b.waktu || 0;
    } else if (sortColumn === 'jenis') {
      aVal = a.jenis || '';
      bVal = b.jenis || '';
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
      await staseApi.delete(selectedId);
      setData(prev => prev.filter(s => s.id !== selectedId));
    } catch {
      setError('Gagal menghapus data stase.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  // === EDIT ===
  const startEdit = (stase: Stase) => {
    setEditForm({ id: stase.id, nama: stase.nama, waktu: stase.waktu, jenis: stase.jenis });
    setEditErrors({});
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    try {
      setSaving(true);
      setEditErrors({});
      await staseApi.update(editForm.id, {
        id: editForm.id,
        nama: editForm.nama,
        waktu: editForm.waktu,
        jenis: editForm.jenis,
      });
      // Update local state
      setData(prev =>
        prev.map(s =>
          s.id === editForm.id
            ? { ...s, nama: editForm.nama, waktu: editForm.waktu, jenis: editForm.jenis }
            : s
        )
      );
      setShowEditModal(false);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; errors?: Record<string, string> };
      if (apiErr?.status === 400 && apiErr?.errors) {
        setEditErrors(apiErr.errors);
      } else {
        setError('Gagal menyimpan perubahan.');
        setShowEditModal(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedStase = data.find(s => s.id === selectedId);

  const getJenisColor = (jenis: string) => {
    return jenis === 'Terpisah'
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const renderJenisIcon = (jenis: string, className = "w-4 h-4") => {
    return jenis === 'Terpisah' ? <StaseTerpisahIcon className={className} /> : <StaseBersamaanIcon className={className} />;
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <StaseIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">{isMahasiswa || isDosen ? 'Data Stase' : 'Kelola Stase'}</h1>
            <p className="text-sm text-slate-500">{isMahasiswa || isDosen ? 'Lihat daftar stase KOAS' : 'Kelola data stase/rotasi klinik KOAS'}</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in-down">
          <InfoIcon className="text-red-500 w-5 h-5" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg">✕</button>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 mb-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari stase..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 transition-all"
              id="search-stase"
            />
          </div>

          {/* Filter Jenis */}
          {!isMahasiswa && !isDosen && (
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="px-6.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700
                focus:outline-none focus:border-purple-400 transition-all cursor-pointer"
              id="filter-jenis"
            >
              <option value="all">Semua Jenis</option>
              <option value="Terpisah">Terpisah</option>
              <option value="Bersamaan">Bersamaan</option>
            </select>
          )}

          {/* Refresh */}
          <Tooltip content="Muat ulang data" position="bottom">
            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-200 flex items-center justify-center"
            >
              <RefreshIcon className="w-5 h-5" />
            </button>
          </Tooltip>

          {/* Add Button */}
          {!isPengelola && !isMahasiswa && !isDosen && (
            <button
              onClick={() => navigate('/stase/tambah')}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700
                text-white font-semibold rounded-xl shadow-md hover:shadow-glow-purple transition-all text-sm flex items-center gap-2"
              id="btn-tambah-stase"
            >
              <span>+</span> Tambah Stase
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <StaseIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{data.length}</p>
              <p className="text-xs text-slate-500">Total Stase</p>
            </div>
          </div>
          {!isMahasiswa && !isDosen && (
            <>
              <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-md">
                  <StaseTerpisahIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-900">{data.filter(s => s.jenis === 'Terpisah').length}</p>
                  <p className="text-xs text-slate-500">Stase Terpisah</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white shadow-md">
                  <StaseBersamaanIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-900">{data.filter(s => s.jenis === 'Bersamaan').length}</p>
                  <p className="text-xs text-slate-500">Stase Bersamaan</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Memuat data stase dari server...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex justify-center mb-4 text-slate-300">
              <StaseIcon className="w-16 h-16" />
            </div>
            <p className="text-slate-600 font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan menambah stase baru'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header Info */}
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-xs text-slate-500 font-medium">
               Menampilkan <span className="text-primary-900 font-bold">{totalItems === 0 ? 0 : startIndex + 1}</span> - <span className="text-primary-900 font-bold">{endIndex}</span> dari <span className="text-primary-900 font-bold">{totalItems}</span> Stase
              </p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Tampilkan:</label>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs text-slate-500 font-medium">data</span>
                <span className="text-xs text-slate-400 border-l border-slate-200 pl-2">
                  Total waktu: <span className="font-bold text-purple-600">{filteredData.reduce((sum, s) => sum + s.waktu, 0)} minggu</span>
                </span>
              </div>
            </div>
            <div className="overflow-x-auto pb-4">
              <table className="w-full min-w-max" id="table-stase">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-800 to-purple-700 text-white">
                    <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap w-16">No</th>
                    <th
                      onClick={() => handleSort('nama')}
                      className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-purple-900/50"
                    >
                      Nama Stase {renderSortIndicator('nama')}
                    </th>
                    <th
                      onClick={() => handleSort('waktu')}
                      className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-purple-900/50"
                    >
                      Waktu {renderSortIndicator('waktu')}
                    </th>
                    {!isMahasiswa && !isDosen && (
                      <>
                        <th
                          onClick={() => handleSort('jenis')}
                          className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-purple-900/50"
                        >
                          Jenis {renderSortIndicator('jenis')}
                        </th>
                        <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Jadwal</th>
                      </>
                    )}
                    {!isMahasiswa && (
                      <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((stase, index) => (
                    <tr key={stase.id} className="hover:bg-purple-50/30 transition-colors duration-150 group">
                      <td className="px-4 md:px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{startIndex + index + 1}</td>
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {stase.nama.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-primary-900">{stase.nama}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-5 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 whitespace-nowrap">
                          <ClockIcon className="w-3.5 h-3.5" /> {stase.waktu} Minggu
                        </span>
                      </td>
                      {!isMahasiswa && !isDosen && (
                        <>
                          <td className="px-4 md:px-5 py-3.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getJenisColor(stase.jenis)}`}>
                              {renderJenisIcon(stase.jenis, "w-3.5 h-3.5")} {stase.jenis}
                            </span>
                          </td>
                          <td className="px-4 md:px-5 py-3.5 text-center whitespace-nowrap">
                            <span className="text-xs text-slate-500">
                              {stase.daftarJadwal.length > 0 ? (
                                <span className="inline-block px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-semibold whitespace-nowrap">
                                  {stase.daftarJadwal.length} jadwal
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-semibold whitespace-nowrap">
                                  Belum ada
                                </span>
                              )}
                            </span>
                          </td>
                        </>
                      )}
                      {!isMahasiswa && (
                        <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip content="Detail" position="bottom">
                              <button
                                onClick={() => navigate(`/stase/${stase.id}`)}
                                className="p-2 rounded-lg text-purple-600 hover:bg-purple-100 transition-all duration-200"
                              >
                                <DetailIcon className="w-5 h-5" />
                              </button>
                            </Tooltip>
                            {!isPengelola && !isDosen && (
                              <>
                                <Tooltip content="Edit" position="bottom">
                                  <button
                                    onClick={() => startEdit(stase)}
                                    className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 transition-all duration-200 text-sm"
                                  >
                                    <EditIcon className="w-5 h-5" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Hapus" position="bottom">
                                  <button
                                    onClick={() => handleDelete(stase.id)}
                                    className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200 text-sm"
                                  >
                                    <DeleteIcon className="w-5 h-5" />
                                  </button>
                                </Tooltip>
                              </>
                            )}
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
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 animate-scale-in overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-violet-50">
              <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-violet-500 rounded-full" />
                Edit Stase
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Stase <span className="text-red-500">*</span></label>
                <input
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all
                    ${editErrors.nama ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {editErrors.nama && <p className="text-xs text-red-500 mt-1">{editErrors.nama}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Waktu (Minggu) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.waktu}
                    onChange={(e) => setEditForm({ ...editForm, waktu: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jenis <span className="text-red-500">*</span></label>
                  <select
                    value={editForm.jenis}
                    onChange={(e) => setEditForm({ ...editForm, jenis: e.target.value })}
                    className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer
                      ${editErrors.jenis ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  >
                    <option value="Terpisah">Terpisah</option>
                    <option value="Bersamaan">Bersamaan</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Ujian">Ujian</option>
                  </select>
                  {editErrors.jenis && <p className="text-xs text-red-500 mt-1">{editErrors.jenis}</p>}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="px-5 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all text-sm"
              >
                Batal
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm disabled:opacity-70 flex items-center gap-2"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4" />
                    Simpan
                  </>
                )}
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
                <InfoIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Stase?</h3>
              {selectedStase && (
                <p className="text-sm text-slate-600 font-medium mb-1">
                  {selectedStase.nama} ({selectedStase.waktu} Minggu)
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
                id="btn-confirm-delete-stase"
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
