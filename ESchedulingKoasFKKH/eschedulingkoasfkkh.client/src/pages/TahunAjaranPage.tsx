/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { tahunAjaranApi, type StatusPeriodeTahunAjaran, type TahunAjaran } from '../services/api';
import { formatDateDisplay } from '../utils/holidays';
import { useAuth } from '../contexts/AuthContext';
import { TahunAjaranIcon, RefreshIcon, SearchIcon, EditIcon, DeleteIcon, SemesterGanjilIcon, SemesterGenapIcon } from '../components/Icons';
import Tooltip from '../components/Tooltip';

const semesterOptions = ['Ganjil', 'Genap'];

function addYearsDateStr(dateStr: string, years: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return '';

  const year = Number(match[1]) + years;
  const month = Number(match[2]);
  const day = Number(match[3]);
  const maxDay = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, maxDay);

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function computeStatusFromDates(tanggalMulai: string, tanggalSelesai: string): StatusPeriodeTahunAjaran | null {
  if (!tanggalMulai || !tanggalSelesai) return null;
  const today = getTodayDateStr();
  if (today < tanggalMulai) return 'Belum Mulai';
  if (today > tanggalSelesai) return 'Selesai';
  return 'Aktif';
}

export default function TahunAjaranPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || '';
  const isAdmin = ['admin', 'administrator'].includes(role);
  const isPengelola = role === 'pengelola';
  const canEditRange = isAdmin || isPengelola;

  const [data, setData] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusPeriodeTahunAjaran>('all');

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortColumn, setSortColumn] = useState<string>('tahun');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState({
    id: 0,
    tahun: new Date().getFullYear().toString(),
    semester: '',
    tanggalMulai: '',
    tanggalSelesai: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
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
    const label = `${item.tahun} ${item.semester} ${item.status} ${formatDateDisplay(item.tanggalMulai)} ${formatDateDisplay(item.tanggalSelesai)}`.toLowerCase();
    const matchesSearch = label.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
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
    } else if (sortColumn === 'label') {
      aVal = `${a.tahun} - ${a.semester}`;
      bVal = `${b.tahun} - ${b.semester}`;
    } else if (sortColumn === 'rentang') {
      aVal = a.tanggalMulai || '';
      bVal = b.tanggalMulai || '';
    } else if (sortColumn === 'status') {
      const rank: Record<string, number> = { Aktif: 1, 'Belum Mulai': 2, Selesai: 3 };
      aVal = rank[a.status] ?? 99;
      bVal = rank[b.status] ?? 99;
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
    if (!isAdmin) return;
    const defaultStart = getTodayDateStr();
    setFormMode('create');
    setForm({
      id: 0,
      tahun: new Date().getFullYear().toString(),
      semester: '',
      tanggalMulai: defaultStart,
      tanggalSelesai: addYearsDateStr(defaultStart, 2),
    });
    setFormErrors({});
    setFormSubmitError(null);
    setShowFormModal(true);
  };

  const openEditModal = (tahunAjaran: TahunAjaran) => {
    if (!canEditRange) return;
    setFormMode('edit');
    setForm({
      id: tahunAjaran.id,
      tahun: tahunAjaran.tahun.toString(),
      semester: tahunAjaran.semester,
      tanggalMulai: tahunAjaran.tanggalMulai || '',
      tanggalSelesai: tahunAjaran.tanggalSelesai || '',
    });
    setFormErrors({});
    setFormSubmitError(null);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setFormErrors({});
    setFormSubmitError(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'tanggalMulai') {
      const minEnd = addYearsDateStr(value, 2);
      setForm(prev => {
        const shouldAutoFillEnd =
          formMode === 'create' &&
          Boolean(minEnd) &&
          (!prev.tanggalSelesai || prev.tanggalSelesai < minEnd);

        return {
          ...prev,
          tanggalMulai: value,
          tanggalSelesai: shouldAutoFillEnd ? minEnd : prev.tanggalSelesai,
        };
      });
      setFormErrors(prev => ({
        ...prev,
        tanggalMulai: '',
        ...(formMode === 'create' ? { tanggalSelesai: '' } : {}),
      }));
      setFormSubmitError(null);
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    setFormSubmitError(null);
  };

  const applyMinTwoYears = () => {
    if (!form.tanggalMulai) return;
    const minEnd = addYearsDateStr(form.tanggalMulai, 2);
    if (!minEnd) return;
    setForm(prev => ({ ...prev, tanggalSelesai: minEnd }));
    if (formErrors.tanggalSelesai) {
      setFormErrors(prev => ({ ...prev, tanggalSelesai: '' }));
    }
    setFormSubmitError(null);
  };

  const validateClientForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const parsedTahun = parseInt(form.tahun, 10);

    if (isAdmin || formMode === 'create') {
      if (!parsedTahun || parsedTahun <= 0) {
        errors.tahun = 'Tahun ajaran harus lebih besar dari 0';
      }
      if (!form.semester) {
        errors.semester = 'Semester wajib dipilih';
      }
    }

    if (!form.tanggalMulai) {
      errors.tanggalMulai = 'Tanggal mulai periode wajib diisi';
    }
    if (!form.tanggalSelesai) {
      errors.tanggalSelesai = 'Tanggal selesai periode wajib diisi';
    }

    if (form.tanggalMulai && form.tanggalSelesai) {
      if (form.tanggalSelesai <= form.tanggalMulai) {
        errors.tanggalSelesai = 'Tanggal selesai harus setelah tanggal mulai';
      } else {
        const minEnd = addYearsDateStr(form.tanggalMulai, 2);
        if (minEnd && form.tanggalSelesai < minEnd) {
          errors.tanggalSelesai = `Rentang periode minimal 2 tahun (minimal selesai ${formatDateDisplay(minEnd)})`;
        }
      }
    }

    return errors;
  };

  const saveForm = async () => {
    const clientErrors = validateClientForm();
    if (Object.keys(clientErrors).length > 0) {
      setFormErrors(clientErrors);
      return;
    }

    try {
      setSaving(true);
      setFormErrors({});
      setFormSubmitError(null);

      const payload = {
        tahun: parseInt(form.tahun, 10) || 0,
        semester: form.semester,
        tanggalMulai: form.tanggalMulai,
        tanggalSelesai: form.tanggalSelesai,
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
        setFormSubmitError(apiErr?.message || 'Gagal menyimpan data tahun ajaran.');
      }
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (id: number) => {
    if (!isAdmin) return;
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
    if (!selectedId || !isAdmin) return;

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
  const activeCount = data.filter(item => item.isAktif).length;
  const minTanggalSelesai = form.tanggalMulai ? addYearsDateStr(form.tanggalMulai, 2) : '';
  const previewStatus = computeStatusFromDates(form.tanggalMulai, form.tanggalSelesai);
  const isReadOnlyIdentity = formMode === 'edit' && !isAdmin;

  const getSemesterClass = (semester: string) => {
    return semester === 'Ganjil'
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const getStatusBadgeClass = (status: StatusPeriodeTahunAjaran | string) => {
    if (status === 'Aktif') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Belum Mulai') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getStatusDotClass = (status: StatusPeriodeTahunAjaran | string) => {
    if (status === 'Aktif') return 'bg-emerald-500 animate-pulse';
    if (status === 'Belum Mulai') return 'bg-amber-500';
    return 'bg-slate-400';
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
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Kelola Tahun Ajaran & Periode KOAS</h1>
              <p className="text-xs sm:text-sm text-sky-100/90">
                Atur periode akademik tiap 6 bulan dengan rentang minimal 2 tahun; beberapa periode dapat aktif bersamaan.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-400/20 backdrop-blur-md border border-emerald-200/30 text-xs font-semibold text-emerald-50">
              <span>{activeCount} Periode Aktif</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-sky-100">
              <span>Total {data.length} Periode</span>
            </div>
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

      {/* Action Bar */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-3.5 sm:p-4 mb-4 sm:mb-6 animate-fade-in-up">
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Cari tahun, semester, tanggal, atau status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-white focus:shadow-sm transition-all duration-200"
                id="search-tahun-ajaran"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | StatusPeriodeTahunAjaran)}
                className="flex-1 sm:flex-none px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:border-cyan-400 focus:bg-white cursor-pointer"
                id="filter-status-tahun-ajaran"
              >
                <option value="all">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Belum Mulai">Belum Mulai</option>
                <option value="Selesai">Selesai</option>
              </select>

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
          </div>

          {isAdmin ? (
            <button
              onClick={openCreateModal}
              className="w-full lg:w-auto px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-md active:scale-95 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
              id="btn-tambah-tahun-ajaran"
            >
              <span className="text-sm font-bold leading-none">+</span> Tambah Periode
            </button>
          ) : isPengelola ? (
            <div className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold whitespace-nowrap shrink-0">
              Akses Pengelola: Edit Rentang Periode
            </div>
          ) : null}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6 animate-fade-in-up">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white shadow-sm sm:shadow-md shrink-0">
              <TahunAjaranIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-2xl font-bold text-primary-900 leading-tight">{data.length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">Total Periode</p>
            </div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm sm:shadow-md shrink-0">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-2xl font-bold text-emerald-700 leading-tight">{activeCount}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">Periode Aktif</p>
            </div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white shadow-sm sm:shadow-md shrink-0">
              <SemesterGanjilIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-2xl font-bold text-primary-900 leading-tight">{data.filter(item => item.semester === 'Ganjil').length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">Ganjil</p>
            </div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-card border border-slate-100/80 p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white shadow-sm sm:shadow-md shrink-0">
              <SemesterGenapIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-2xl font-bold text-primary-900 leading-tight">{data.filter(item => item.semester === 'Genap').length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">Genap</p>
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
              {searchTerm || statusFilter !== 'all'
                ? 'Coba ubah kata kunci pencarian atau filter status'
                : isAdmin
                  ? 'Mulai dengan menambah periode tahun ajaran baru'
                  : 'Belum ada periode tahun ajaran yang terdaftar'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header Info */}
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <p className="text-slate-500 font-medium">
                Menampilkan <span className="text-primary-900 font-bold">{totalItems === 0 ? 0 : startIndex + 1}</span> - <span className="text-primary-900 font-bold">{endIndex}</span> dari <span className="text-primary-900 font-bold">{totalItems}</span> Periode Tahun Ajaran
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-sky-50 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {startIndex + index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-primary-900">{tahunAjaran.tahun}</span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getSemesterClass(tahunAjaran.semester)}`}>
                            {tahunAjaran.semester === 'Ganjil' ? (
                              <SemesterGanjilIcon className="w-3 h-3" />
                            ) : (
                              <SemesterGenapIcon className="w-3 h-3" />
                            )}
                            {tahunAjaran.semester}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(tahunAjaran.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(tahunAjaran.status)}`} />
                            {tahunAjaran.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium">
                          Rentang: {formatDateDisplay(tahunAjaran.tanggalMulai)} – {formatDateDisplay(tahunAjaran.tanggalSelesai)}
                        </p>
                      </div>
                    </div>

                    {canEditRange && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEditModal(tahunAjaran)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all cursor-pointer"
                          title={isAdmin ? 'Edit Periode' : 'Atur Rentang Tanggal'}
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => openDeleteModal(tahunAjaran.id)}
                            className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <DeleteIcon className="w-4 h-4" />
                          </button>
                        )}
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
                      onClick={() => handleSort('rentang')}
                      className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-sky-800/50"
                    >
                      Rentang Periode {renderSortIndicator('rentang')}
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-sky-800/50"
                    >
                      Status {renderSortIndicator('status')}
                    </th>
                    {canEditRange && (
                      <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((tahunAjaran, index) => (
                    <tr key={tahunAjaran.id} className="hover:bg-cyan-50/30 transition-colors duration-150 group">
                      <td className="px-4 md:px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{startIndex + index + 1}</td>
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary-900">{tahunAjaran.tahun}</span>
                          <span className="text-xs text-slate-400">{tahunAjaran.tahun} - {tahunAjaran.semester}</span>
                        </div>
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
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-700">
                          {formatDateDisplay(tahunAjaran.tanggalMulai)} – {formatDateDisplay(tahunAjaran.tanggalSelesai)}
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusBadgeClass(tahunAjaran.status)}`}>
                          <span className={`w-2 h-2 rounded-full ${getStatusDotClass(tahunAjaran.status)}`} />
                          {tahunAjaran.status}
                        </span>
                      </td>
                      {canEditRange && (
                        <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip content={isAdmin ? 'Edit Periode' : 'Atur Rentang Tanggal'} position="bottom">
                              <button
                                onClick={() => openEditModal(tahunAjaran)}
                                className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 transition-all duration-200 cursor-pointer"
                              >
                                <EditIcon className="w-5 h-5" />
                              </button>
                            </Tooltip>
                            {isAdmin && (
                              <Tooltip content="Hapus" position="bottom">
                                <button
                                  onClick={() => openDeleteModal(tahunAjaran.id)}
                                  className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200 cursor-pointer"
                                >
                                  <DeleteIcon className="w-5 h-5" />
                                </button>
                              </Tooltip>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md animate-scale-in overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50">
              <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full" />
                {formMode === 'create'
                  ? 'Tambah Periode Tahun Ajaran'
                  : isAdmin
                    ? 'Edit Periode Tahun Ajaran'
                    : 'Atur Rentang Periode'}
              </h3>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {isReadOnlyIdentity && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 font-medium">
                  Sebagai Pengelola, Anda hanya dapat mengatur tanggal mulai dan tanggal selesai periode. Tahun dan semester hanya dapat diubah oleh Admin.
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Tahun <span className="text-red-500">*</span>
                  </label>
                  {isReadOnlyIdentity && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      Read-only
                    </span>
                  )}
                </div>
                <input
                  name="tahun"
                  type="number"
                  min="1"
                  value={form.tahun}
                  onChange={handleFormChange}
                  disabled={isReadOnlyIdentity}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-all ${
                    isReadOnlyIdentity
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : formErrors.tahun
                        ? 'border-red-400 bg-red-50 focus:border-cyan-500 focus:bg-white'
                        : 'bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white'
                  }`}
                  placeholder="Contoh: 2026"
                />
                {formErrors.tahun && <p className="text-xs text-red-500 mt-1">{formErrors.tahun}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  {isReadOnlyIdentity && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      Read-only
                    </span>
                  )}
                </div>
                <select
                  name="semester"
                  value={form.semester}
                  onChange={handleFormChange}
                  disabled={isReadOnlyIdentity}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-all ${
                    isReadOnlyIdentity
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : formErrors.semester
                        ? 'border-red-400 bg-red-50 focus:border-cyan-500 focus:bg-white cursor-pointer'
                        : 'bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white cursor-pointer'
                  }`}
                >
                  <option value="">Pilih semester</option>
                  {semesterOptions.map(semester => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
                {formErrors.semester && <p className="text-xs text-red-500 mt-1">{formErrors.semester}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tanggal Mulai Periode <span className="text-red-500">*</span>
                </label>
                <input
                  name="tanggalMulai"
                  type="date"
                  value={form.tanggalMulai}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white transition-all ${formErrors.tanggalMulai ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {formErrors.tanggalMulai && <p className="text-xs text-red-500 mt-1">{formErrors.tanggalMulai}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Tanggal Selesai Periode <span className="text-red-500">*</span>
                  </label>
                  {form.tanggalMulai && (
                    <button
                      type="button"
                      onClick={applyMinTwoYears}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                    >
                      Set Min. 2 Tahun
                    </button>
                  )}
                </div>
                <input
                  name="tanggalSelesai"
                  type="date"
                  min={minTanggalSelesai || undefined}
                  value={form.tanggalSelesai}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white transition-all ${formErrors.tanggalSelesai ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {minTanggalSelesai && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Minimal 2 tahun dari tanggal mulai: <span className="font-semibold text-slate-700">{formatDateDisplay(minTanggalSelesai)}</span>
                  </p>
                )}
                {formErrors.tanggalSelesai && <p className="text-xs text-red-500 mt-1">{formErrors.tanggalSelesai}</p>}
              </div>

              {previewStatus && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Status Otomatis Periode:</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(previewStatus)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(previewStatus)}`} />
                    {previewStatus}
                  </span>
                </div>
              )}

              {formSubmitError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {formSubmitError}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={closeFormModal}
                disabled={saving}
                className="px-5 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all text-sm cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={saveForm}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm disabled:opacity-70 flex items-center gap-2 cursor-pointer"
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
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200 text-sm cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-md transition-all duration-200 text-sm disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
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
