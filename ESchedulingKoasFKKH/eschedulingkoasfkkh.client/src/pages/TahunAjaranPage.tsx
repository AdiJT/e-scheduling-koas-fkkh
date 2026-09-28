/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { tahunAjaranApi, type TahunAjaran } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TahunAjaranIcon, RefreshIcon, SearchIcon, EditIcon, DeleteIcon, SemesterGanjilIcon, SemesterGenapIcon } from '../components/Icons';
import Tooltip from '../components/Tooltip';

const semesterOptions = ['Ganjil', 'Genap'];
const statusOptions = ['Berjalan', 'Akan Datang', 'Selesai'];

export default function TahunAjaranPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = ['admin', 'administrator'].includes(user?.role?.toLowerCase() || '');
  const [data, setData] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortColumn, setSortColumn] = useState<string>('tahun');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Reset pagination on search or status change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState({ id: 0, tahun: new Date().getFullYear().toString(), semester: '', status: 'Akan Datang' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await tahunAjaranApi.getAll();
      setData(result);
    } catch {
      setError('Gagal memuat data tahun ajaran. Pastikan server backend sedang berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(item => {
    const label = `${item.tahun} ${item.semester} ${item.status || ''}`.toLowerCase();
    const matchSearch = label.includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    if (sortColumn === 'tahun') {
      aVal = a.tahun || 0;
      bVal = b.tahun || 0;
    } else if (sortColumn === 'semester') {
      aVal = a.semester || '';
      bVal = b.semester || '';
    } else if (sortColumn === 'status') {
      aVal = a.status || '';
      bVal = b.status || '';
    } else if (sortColumn === 'label') {
      aVal = `${a.tahun} - ${a.semester}`;
      bVal = `${b.tahun} - ${b.semester}`;
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

  const openCreateModal = () => {
    setFormMode('create');
    setForm({ id: 0, tahun: new Date().getFullYear().toString(), semester: '', status: 'Akan Datang' });
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (tahunAjaran: TahunAjaran) => {
    setFormMode('edit');
    setForm({
      id: tahunAjaran.id,
      tahun: tahunAjaran.tahun.toString(),
      semester: tahunAjaran.semester,
      status: tahunAjaran.status || 'Akan Datang',
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setFormErrors({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  const saveForm = async () => {
    try {
      setSaving(true);
      setFormErrors({});

      const payload = {
        tahun: parseInt(form.tahun) || 0,
        semester: form.semester,
        status: form.status,
      };

      if (formMode === 'create') {
        await tahunAjaranApi.create(payload);
      } else {
        await tahunAjaranApi.update(form.id, {
          id: form.id,
          ...payload,
        });
      }

      setShowFormModal(false);
      await fetchData();
    } catch (err: unknown) {
      const apiErr = err as { status?: number; errors?: Record<string, string>; message?: string };
      if (apiErr?.status === 400 && apiErr?.errors) {
        setFormErrors(apiErr.errors);
      } else {
        setError(apiErr?.message || 'Gagal menyimpan data tahun ajaran.');
        setShowFormModal(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (id: number) => {
    setSelectedId(id);
    setDeleteConfirmed(false);
    setDeleteWarning(null);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedId(null);
    setDeleteConfirmed(false);
    setDeleteWarning(null);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;

    try {
      setDeleting(true);
      await tahunAjaranApi.delete(selectedId, deleteConfirmed);
      setData(prev => prev.filter(item => item.id !== selectedId));
      closeDeleteModal();
    } catch (err: unknown) {
      const apiErr = err as {
        status?: number;
        errors?: Record<string, string>;
        message?: string;
        requiresConfirmation?: boolean;
      };

      if (apiErr?.status === 409 && apiErr?.requiresConfirmation) {
        setDeleteWarning(apiErr.message || Object.values(apiErr.errors || {})[0] || 'Data masih dipakai.');
        setDeleteConfirmed(true);
      } else {
        setError(apiErr?.message || 'Gagal menghapus tahun ajaran.');
        closeDeleteModal();
      }
    } finally {
      setDeleting(false);
    }
  };

  const selectedTahunAjaran = data.find(item => item.id === selectedId);

  const getSemesterClass = (semester: string) => {
    return semester === 'Ganjil'
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Berjalan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Berjalan
          </span>
        );
      case 'Akan Datang':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Akan Datang
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {status || '-'}
          </span>
        );
    }
  };

  return (
    <Layout>
      {/* Page Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-700 to-cyan-700 rounded-2xl p-4 sm:p-6 text-white shadow-xl mb-4 sm:mb-6 animate-fade-in-down">
        {/* Subtle decorative watermark */}
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none transform rotate-12">
          <TahunAjaranIcon className="w-44 h-44 sm:w-56 sm:h-56 text-white" />
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
              <TahunAjaranIcon className="w-5 h-5 sm:w-6 sm:h-6 text-sky-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Kelola Tahun Ajaran</h1>
              <p className="text-xs sm:text-sm text-sky-100/90">Atur tahun, semester, dan status periode akademik mahasiswa KOAS</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-sky-100 self-start sm:self-center">
            <span>Total {data.length} Tahun Ajaran</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in-down">
          <span className="text-red-500 text-lg">!</span>
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg">x</button>
        </div>
      )}

      {/* Action Bar & Filter */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-3.5 sm:p-4 mb-4 sm:mb-6 animate-fade-in-up">
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Cari tahun, semester, atau status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-white focus:shadow-sm transition-all duration-200"
                id="search-tahun-ajaran"
              />
            </div>

            {/* Filter Status Selector */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 overflow-x-auto shrink-0">
              {[
                { id: 'all', label: 'Semua Status' },
                { id: 'Berjalan', label: 'Berjalan' },
                { id: 'Akan Datang', label: 'Akan Datang' },
                { id: 'Selesai', label: 'Selesai' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filterStatus === tab.id
                      ? 'bg-white text-sky-700 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Tooltip content="Muat ulang data" position="bottom">
              <button
                onClick={fetchData}
                className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 text-slate-600 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer"
                title="Muat ulang data"
              >
                <RefreshIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </Tooltip>
          </div>

          {canManage && (
            <button
              onClick={openCreateModal}
              className="w-full lg:w-auto px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-md active:scale-95 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
              id="btn-tambah-tahun-ajaran"
            >
              <span className="text-sm font-bold leading-none">+</span> Tambah Tahun Ajaran
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6 animate-fade-in-up">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white shadow-sm sm:shadow-md shrink-0">
              <TahunAjaranIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-2xl font-bold text-primary-900 leading-tight">{data.length}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">Total T.A</p>
            </div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm sm:shadow-md shrink-0">
              <span className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-2xl font-bold text-emerald-700 leading-tight">{data.filter(item => item.status === 'Berjalan').length}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">Sedang Berjalan</p>
            </div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white shadow-sm sm:shadow-md shrink-0">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-2xl font-bold text-sky-700 leading-tight">{data.filter(item => item.status === 'Akan Datang').length}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">Akan Datang</p>
            </div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white shadow-sm sm:shadow-md shrink-0">
              <span className="text-xs font-bold">✓</span>
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-2xl font-bold text-slate-700 leading-tight">{data.filter(item => item.status === 'Selesai').length}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">Telah Selesai</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table & Mobile List Container */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Memuat data tahun ajaran dari server...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex justify-center mb-4 text-slate-300">
              <TahunAjaranIcon className="w-16 h-16" />
            </div>
            <p className="text-slate-600 font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan menambah tahun ajaran baru'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header Info */}
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <p className="text-slate-500 font-medium">
                Menampilkan <span className="text-primary-900 font-bold">{totalItems === 0 ? 0 : startIndex + 1}</span> - <span className="text-primary-900 font-bold">{endIndex}</span> dari <span className="text-primary-900 font-bold">{totalItems}</span> Tahun Ajaran
              </p>
              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-medium whitespace-nowrap">Tampilkan:</label>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
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
              {paginatedData.map((tahunAjaran, index) => (
                <div key={tahunAjaran.id} className="p-3.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-sky-50 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {startIndex + index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-primary-900">{tahunAjaran.tahun}</span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getSemesterClass(tahunAjaran.semester)}`}>
                            {tahunAjaran.semester === 'Ganjil' ? (
                              <SemesterGanjilIcon className="w-3 h-3" />
                            ) : (
                              <SemesterGenapIcon className="w-3 h-3" />
                            )}
                            {tahunAjaran.semester}
                          </span>
                          {getStatusBadge(tahunAjaran.status)}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          Label: {tahunAjaran.tahun} - {tahunAjaran.semester}
                        </p>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEditModal(tahunAjaran)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(tahunAjaran.id)}
                          className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                          title="Hapus"
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table (Screens >= md) */}
            <div className="hidden md:block overflow-x-auto pb-4">
              <table className="w-full min-w-max" id="table-tahun-ajaran">
                <thead>
                  <tr className="bg-gradient-to-r from-sky-700 to-cyan-700 text-white">
                    <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap w-16">No</th>
                    <th
                      onClick={() => handleSort('tahun')}
                      className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-sky-800/50"
                    >
                      Tahun {renderSortIndicator('tahun')}
                    </th>
                    <th
                      onClick={() => handleSort('semester')}
                      className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-sky-800/50"
                    >
                      Semester {renderSortIndicator('semester')}
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-sky-800/50"
                    >
                      Status {renderSortIndicator('status')}
                    </th>
                    <th
                      onClick={() => handleSort('label')}
                      className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-sky-800/50"
                    >
                      Label {renderSortIndicator('label')}
                    </th>
                    {canManage && (
                      <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((tahunAjaran, index) => (
                    <tr key={tahunAjaran.id} className="hover:bg-cyan-50/30 transition-colors duration-150 group">
                      <td className="px-4 md:px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{startIndex + index + 1}</td>
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-bold text-primary-900">{tahunAjaran.tahun}</span>
                      </td>
                      <td className="px-4 md:px-5 py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getSemesterClass(tahunAjaran.semester)}`}>
                          {tahunAjaran.semester === 'Ganjil' ? (
                            <SemesterGanjilIcon className="w-3.5 h-3.5" />
                          ) : (
                            <SemesterGenapIcon className="w-3.5 h-3.5" />
                          )}
                          {tahunAjaran.semester}
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3.5 text-center whitespace-nowrap">
                        {getStatusBadge(tahunAjaran.status)}
                      </td>
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-700">
                          {tahunAjaran.tahun} - {tahunAjaran.semester}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip content="Edit" position="bottom">
                              <button
                                onClick={() => openEditModal(tahunAjaran)}
                                className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 transition-all duration-200"
                              >
                                <EditIcon className="w-5 h-5" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Hapus" position="bottom">
                              <button
                                onClick={() => openDeleteModal(tahunAjaran.id)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200"
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
                              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
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

      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 animate-scale-in overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50">
              <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full" />
                {formMode === 'create' ? 'Tambah Tahun Ajaran' : 'Edit Tahun Ajaran'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tahun <span className="text-red-500">*</span></label>
                <input
                  name="tahun"
                  type="number"
                  min="1"
                  value={form.tahun}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white transition-all ${formErrors.tahun ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  placeholder="Contoh: 2026"
                />
                {formErrors.tahun && <p className="text-xs text-red-500 mt-1">{formErrors.tahun}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Semester <span className="text-red-500">*</span></label>
                <select
                  name="semester"
                  value={form.semester}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white transition-all cursor-pointer ${formErrors.semester ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                >
                  <option value="">Pilih semester</option>
                  {semesterOptions.map(semester => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
                {formErrors.semester && <p className="text-xs text-red-500 mt-1">{formErrors.semester}</p>}
              </div>
              {formMode === 'create' ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status Awal</label>
                  <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-sky-900">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>Otomatis: Akan Datang</span>
                    </div>
                    <p className="text-sky-700 text-[11px] leading-relaxed">
                      Status tahun ajaran baru otomatis <strong>Akan Datang</strong>. Sistem akan otomatis memperbarui status menjadi <strong>Berjalan</strong> saat tanggal mulai jadwal tiba, dan <strong>Selesai</strong> setelah seluruh jadwal stase berakhir.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status <span className="text-red-500">*</span></label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white transition-all cursor-pointer ${formErrors.status ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  >
                    {statusOptions.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    *Status dikelola otomatis berdasarkan siklus jadwal, namun admin dapat menyesuaikannya jika diperlukan.
                  </p>
                  {formErrors.status && <p className="text-xs text-red-500 mt-1">{formErrors.status}</p>}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={closeFormModal}
                disabled={saving}
                className="px-5 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all text-sm"
              >
                Batal
              </button>
              <button
                onClick={saveForm}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm disabled:opacity-70 flex items-center gap-2"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                ) : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4 animate-scale-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-red-600">!</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Tahun Ajaran?</h3>
              {selectedTahunAjaran && (
                <p className="text-sm text-slate-600 font-medium mb-1">
                  {selectedTahunAjaran.tahun} - {selectedTahunAjaran.semester}
                </p>
              )}
              <p className="text-sm text-slate-500">
                {deleteWarning || 'Data yang dihapus tidak dapat dikembalikan'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200 text-sm"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-md transition-all duration-200 text-sm disabled:opacity-70 flex items-center justify-center gap-2"
                id="btn-confirm-delete-tahun-ajaran"
              >
                {deleting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menghapus...</>
                ) : deleteConfirmed ? 'Tetap Hapus' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
