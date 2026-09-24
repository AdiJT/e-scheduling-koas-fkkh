/* eslint-disable react-hooks/set-state-in-effect */
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { mahasiswaApi, tahunAjaranApi, type Mahasiswa, type TahunAjaran } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MahasiswaIcon, RefreshIcon, SearchIcon, EditIcon, DeleteIcon, DetailIcon } from '../components/Icons';
import Tooltip from '../components/Tooltip';

export default function MahasiswaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPengelola = user?.role?.toLowerCase() === 'pengelola';
  const [data, setData] = useState<Mahasiswa[]>([]);
  const [tahunAjarans, setTahunAjarans] = useState<TahunAjaran[]>([]);
  const [filterTahunAjaran, setFilterTahunAjaran] = useState<string>('all');
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

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTahunAjaran]);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nim: '', nama: '', idTahunAjaran: 0 });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mhsResult, taResult] = await Promise.all([
        mahasiswaApi.getAll(),
        tahunAjaranApi.getAll()
      ]);
      setData(mhsResult);
      setTahunAjarans(taResult);
    } catch {
      setError('Gagal memuat data mahasiswa. Pastikan server backend sedang berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(mhs => {
    const matchSearch = mhs.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mhs.nim.includes(searchTerm);
    const matchTahunAjaran = filterTahunAjaran === 'all' || mhs.idTahunAjaran?.toString() === filterTahunAjaran;
    return matchSearch && matchTahunAjaran;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    if (sortColumn === 'nim') {
      aVal = a.nim || '';
      bVal = b.nim || '';
    } else if (sortColumn === 'nama') {
      aVal = a.nama || '';
      bVal = b.nama || '';
    } else if (sortColumn === 'tahunAjaran') {
      aVal = a.tahunAjaran ? `${a.tahunAjaran.tahun} - ${a.tahunAjaran.semester}` : '';
      bVal = b.tahunAjaran ? `${b.tahunAjaran.tahun} - ${b.tahunAjaran.semester}` : '';
    } else if (sortColumn === 'idKelompok') {
      aVal = a.idKelompok || 0;
      bVal = b.idKelompok || 0;
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
      await mahasiswaApi.delete(selectedId);
      setData(prev => prev.filter(m => m.id !== selectedId));
    } catch {
      setError('Gagal menghapus data mahasiswa.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  // === EDIT MODAL ===
  const startEdit = (mhs: Mahasiswa) => {
    setEditingId(mhs.id);
    setEditForm({ nim: mhs.nim, nama: mhs.nama, idTahunAjaran: mhs.idTahunAjaran || 0 });
    setEditErrors({});
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ nim: '', nama: '', idTahunAjaran: 0 });
    setEditErrors({});
    setShowEditModal(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      setEditErrors({});
      await mahasiswaApi.update(editingId, {
        id: editingId,
        nim: editForm.nim,
        nama: editForm.nama,
        idTahunAjaran: editForm.idTahunAjaran,
      });
      // Update local state
      setData(prev =>
        prev.map(m =>
          m.id === editingId
            ? {
                ...m,
                nim: editForm.nim,
                nama: editForm.nama,
                idTahunAjaran: editForm.idTahunAjaran,
                tahunAjaran: tahunAjarans.find(ta => ta.id === editForm.idTahunAjaran),
              }
            : m
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

  const selectedMahasiswa = data.find(m => m.id === selectedId);

  return (
    <Layout>
      {/* Page Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-900 to-blue-800 rounded-2xl p-4 sm:p-6 text-white shadow-xl mb-4 sm:mb-6 animate-fade-in-down">
        {/* Subtle decorative watermark */}
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none transform rotate-12">
          <MahasiswaIcon className="w-44 h-44 sm:w-56 sm:h-56 text-white" />
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
              <MahasiswaIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Kelola Mahasiswa</h1>
              <p className="text-xs sm:text-sm text-blue-100/90">Tambah, edit, atau hapus data mahasiswa KOAS</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-100 self-start sm:self-center">
            <span>Total {data.length} Mahasiswa</span>
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
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-3.5 sm:p-4 mb-4 sm:mb-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Cari mahasiswa berdasarkan nama atau NIM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 placeholder-slate-400
                focus:outline-none focus:border-blue-400 focus:bg-white focus:shadow-sm transition-all duration-200"
              id="search-mahasiswa"
            />
          </div>

          {/* Filter & Refresh Controls */}
          <div className="flex items-center gap-2">
            <select
              value={filterTahunAjaran}
              onChange={(e) => setFilterTahunAjaran(e.target.value)}
              className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700
                focus:outline-none focus:border-blue-400 focus:bg-white transition-all cursor-pointer font-medium"
              id="filter-tahun-ajaran"
            >
              <option value="all">Semua Tahun Ajaran</option>
              {tahunAjarans.map(ta => (
                <option key={ta.id} value={ta.id.toString()}>
                  {ta.tahun} - {ta.semester}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <Tooltip content="Muat ulang data" position="bottom">
              <button
                onClick={fetchData}
                className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <RefreshIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </Tooltip>

            {/* Desktop Add Button */}
            {!isPengelola && (
              <button
                onClick={() => navigate('/mahasiswa/tambah')}
                className="hidden sm:flex px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                  text-white font-semibold rounded-xl shadow-md hover:shadow-glow-blue 
                  transition-all duration-300 active:scale-95 text-sm items-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
                id="btn-tambah-mahasiswa"
              >
                <span>+</span> Tambah Mahasiswa
              </button>
            )}
          </div>

          {/* Mobile Add Button */}
          {!isPengelola && (
            <button
              onClick={() => navigate('/mahasiswa/tambah')}
              className="sm:hidden w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                text-white font-semibold rounded-xl shadow-md active:scale-[0.99]
                transition-all duration-200 text-xs flex items-center justify-center gap-2 cursor-pointer"
              id="btn-tambah-mahasiswa-mobile"
            >
              <span className="text-sm font-bold leading-none">+</span> Tambah Mahasiswa
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Memuat data mahasiswa dari server...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex justify-center mb-4 text-slate-300">
              <MahasiswaIcon className="w-16 h-16" />
            </div>
            <p className="text-slate-600 font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan menambah mahasiswa baru'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header Info */}
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <p className="text-slate-500 font-medium">                
                Menampilkan <span className="text-primary-900 font-bold">{totalItems === 0 ? 0 : startIndex + 1}</span> - <span className="text-primary-900 font-bold">{endIndex}</span> dari <span className="text-primary-900 font-bold">{totalItems}</span> Mahasiswa
              </p>
              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-medium whitespace-nowrap">Tampilkan:</label>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-slate-500 font-medium">data</span>
              </div>
            </div>

            {/* Mobile View: Card List (Screens < md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedData.map((mhs, index) => (
                <div key={mhs.id} className="p-3.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div
                      className="flex items-start gap-2.5 flex-1 cursor-pointer"
                      onClick={() => navigate(`/mahasiswa/${mhs.id}`)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0 mt-0.5">
                        {mhs.nama.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            #{startIndex + index + 1}
                          </span>
                          <h3 className="text-sm font-semibold text-primary-900 hover:text-blue-600 transition-colors leading-snug break-words">
                            {mhs.nama}
                          </h3>
                        </div>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">
                          NIM: {mhs.nim || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Row: Tahun Ajaran & Kelompok */}
                  <div className="pl-10.5 flex flex-wrap items-center gap-1.5 mb-2.5">
                    {mhs.tahunAjaran ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60 leading-tight">
                        T.A: {mhs.tahunAjaran.tahun} - {mhs.tahunAjaran.semester}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Belum ada T.A</span>
                    )}

                    {mhs.idKelompok ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60 leading-tight">
                        Kelompok {mhs.idKelompok}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500">
                        Belum ada kelompok
                      </span>
                    )}
                  </div>

                  {/* Mobile Actions */}
                  <div className="pl-10.5 flex items-center gap-2 pt-2 border-t border-slate-100/70">
                    <button
                      onClick={() => navigate(`/mahasiswa/${mhs.id}`)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all cursor-pointer"
                    >
                      <DetailIcon className="w-3.5 h-3.5" /> Detail
                    </button>
                    {!isPengelola && (
                      <>
                        <button
                          onClick={() => startEdit(mhs)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
                        >
                          <EditIcon className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(mhs.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 active:scale-95 transition-all ml-auto cursor-pointer"
                        >
                          <DeleteIcon className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table (Screens >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto" id="table-mahasiswa">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-900 to-blue-800 text-white">
                    <th className="px-3.5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap w-12">No</th>
                    <th
                      onClick={() => handleSort('nim')}
                      className="px-3.5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-blue-900/50 w-28"
                    >
                      NIM {renderSortIndicator('nim')}
                    </th>
                    <th
                      onClick={() => handleSort('nama')}
                      className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none hover:bg-blue-900/50"
                    >
                      Nama Mahasiswa {renderSortIndicator('nama')}
                    </th>
                    <th
                      onClick={() => handleSort('tahunAjaran')}
                      className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-blue-900/50 w-36"
                    >
                      Tahun Ajaran {renderSortIndicator('tahunAjaran')}
                    </th>
                    <th
                      onClick={() => handleSort('idKelompok')}
                      className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-blue-900/50 w-32"
                    >
                      Kelompok {renderSortIndicator('idKelompok')}
                    </th>
                    <th className="px-3.5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((mhs, index) => (
                    <tr key={mhs.id} className="hover:bg-blue-50/30 transition-colors duration-150 group">
                      <td className="px-3.5 py-3.5 text-center text-sm text-slate-500 whitespace-nowrap">{startIndex + index + 1}</td>

                      {/* NIM */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-mono text-slate-600">{mhs.nim}</span>
                      </td>

                      {/* Nama */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                            {mhs.nama.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-primary-900 leading-snug break-words">
                            {mhs.nama}
                          </span>
                        </div>
                      </td>

                      {/* Tahun Ajaran */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-700">
                          {mhs.tahunAjaran ? `${mhs.tahunAjaran.tahun} - ${mhs.tahunAjaran.semester}` : 'Belum ditentukan'}
                        </span>
                      </td>

                      {/* Kelompok */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {mhs.idKelompok ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            Kelompok {mhs.idKelompok}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                            Belum ada
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Tooltip content="Detail Mahasiswa" position="bottom">
                            <button
                              onClick={() => navigate(`/mahasiswa/${mhs.id}`)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-all duration-200 text-sm"
                              title="Detail Mahasiswa"
                            >
                              <DetailIcon className="w-5 h-5" />
                            </button>
                          </Tooltip>
                          {!isPengelola && (
                            <>
                              <Tooltip content="Edit" position="bottom">
                                <button
                                  onClick={() => startEdit(mhs)}
                                  className="p-2 rounded-lg text-amber-500 hover:bg-amber-100 transition-all duration-200 text-sm"
                                  title="Edit Mahasiswa"
                                >
                                  <EditIcon className="w-5 h-5" />
                                </button>
                              </Tooltip>
                              <Tooltip content="Hapus" position="bottom">
                                <button
                                  onClick={() => handleDelete(mhs.id)}
                                  className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200 text-sm"
                                  title="Hapus Mahasiswa"
                                >
                                  <DeleteIcon className="w-5 h-5" />
                                </button>
                              </Tooltip>
                            </>
                          )}
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
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
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

      {/* Edit Mahasiswa Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 animate-scale-in overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                Edit Data Mahasiswa
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* NIM */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">NIM <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editForm.nim}
                  onChange={(e) => setEditForm({ ...editForm, nim: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-all ${
                    editErrors.nim ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                  placeholder="Masukkan NIM..."
                />
                {editErrors.nim && (
                  <p className="text-xs text-red-500 mt-1">{editErrors.nim}</p>
                )}
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all ${
                    editErrors.nama ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                  placeholder="Masukkan nama lengkap..."
                />
                {editErrors.nama && (
                  <p className="text-xs text-red-500 mt-1">{editErrors.nama}</p>
                )}
              </div>

              {/* Tahun Ajaran */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tahun Ajaran <span className="text-red-500">*</span></label>
                <select
                  value={editForm.idTahunAjaran}
                  onChange={(e) => setEditForm({ ...editForm, idTahunAjaran: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value={0} disabled>Pilih Tahun Ajaran</option>
                  {tahunAjarans.map(ta => (
                    <option key={ta.id} value={ta.id}>
                      {ta.tahun} - {ta.semester}
                    </option>
                  ))}
                </select>
                {editErrors.idTahunAjaran && (
                  <p className="text-xs text-red-500 mt-1">{editErrors.idTahunAjaran}</p>
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
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm disabled:opacity-70 flex items-center justify-center gap-2"
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
              <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Mahasiswa?</h3>
              {selectedMahasiswa && (
                <p className="text-sm text-slate-600 font-medium mb-1">
                  {selectedMahasiswa.nama} ({selectedMahasiswa.nim})
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