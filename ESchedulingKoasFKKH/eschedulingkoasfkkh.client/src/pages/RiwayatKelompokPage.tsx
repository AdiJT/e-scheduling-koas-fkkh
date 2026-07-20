import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { riwayatKelompokApi, type RiwayatKelompok } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDateDisplay } from '../utils/holidays';
import { SearchIcon, RefreshIcon, DetailIcon, DeleteIcon, InfoIcon, JadwalIcon as ClockIcon, DosenIcon, MahasiswaIcon } from '../components/Icons';
import Tooltip from '../components/Tooltip';

export default function RiwayatKelompokPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'administrator';

  const [data, setData] = useState<RiwayatKelompok[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiwayat, setSelectedRiwayat] = useState<RiwayatKelompok | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<string>('tanggalDiarsipkan');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await riwayatKelompokApi.getAll();
      setData(result);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data riwayat kelompok.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredData = data.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.namaKelompok.toLowerCase().includes(term) ||
      r.namaStase.toLowerCase().includes(term) ||
      (r.namaPembimbing && r.namaPembimbing.toLowerCase().includes(term)) ||
      r.tahunAjaran.toLowerCase().includes(term)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal: any = '';
    let bVal: any = '';

    if (sortColumn === 'namaKelompok') {
      aVal = a.namaKelompok || '';
      bVal = b.namaKelompok || '';
    } else if (sortColumn === 'namaStase') {
      aVal = a.namaStase || '';
      bVal = b.namaStase || '';
    } else if (sortColumn === 'tahunAjaran') {
      aVal = a.tahunAjaran || '';
      bVal = b.tahunAjaran || '';
    } else if (sortColumn === 'tanggalMulai') {
      aVal = a.tanggalMulai || '';
      bVal = b.tanggalMulai || '';
    } else if (sortColumn === 'tanggalDiarsipkan') {
      aVal = a.tanggalDiarsipkan || '';
      bVal = b.tanggalDiarsipkan || '';
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

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      setDeleting(true);
      await riwayatKelompokApi.delete(deletingId);
      setData(prev => prev.filter(r => r.id !== deletingId));
      setShowDeleteModal(false);
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus riwayat.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <span>⏱️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Riwayat Kelompok</h1>
            <p className="text-sm text-slate-500">Daftar lengkap stase yang telah selesai dijalani oleh kelompok KOAS</p>
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
              placeholder="Cari berdasarkan kelompok, stase, tahun ajaran, atau dosen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-all"
            />
          </div>

          <Tooltip content="Muat ulang data" position="bottom">
            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-200 flex items-center justify-center h-full"
            >
              <RefreshIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Memuat data histori kelompok...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex justify-center mb-4 text-slate-300 text-5xl">
              ⏱️
            </div>
            <p className="text-slate-600 font-medium">Belum ada riwayat terekam</p>
            <p className="text-sm text-slate-400 mt-1">
              Riwayat stase kelompok otomatis dicatat setelah tanggal berakhir stase terlewati.
            </p>
          </div>
        ) : (
          <>
            {/* Table Header Info */}
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="text-primary-900 font-bold">{totalItems === 0 ? 0 : startIndex + 1}</span> - <span className="text-primary-900 font-bold">{endIndex}</span> dari <span className="text-primary-900 font-bold">{totalItems}</span> Riwayat Stase
              </p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Tampilkan:</label>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer"
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
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-800 to-indigo-700 text-white">
                    <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap w-16">No</th>
                    <th
                      onClick={() => handleSort('namaKelompok')}
                      className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-indigo-900/50"
                    >
                      Kelompok {renderSortIndicator('namaKelompok')}
                    </th>
                    <th
                      onClick={() => handleSort('tahunAjaran')}
                      className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-indigo-900/50"
                    >
                      Tahun Ajaran {renderSortIndicator('tahunAjaran')}
                    </th>
                    <th
                      onClick={() => handleSort('namaStase')}
                      className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-indigo-900/50"
                    >
                      Stase {renderSortIndicator('namaStase')}
                    </th>
                    <th
                      onClick={() => handleSort('tanggalMulai')}
                      className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-indigo-900/50"
                    >
                      Jadwal Stase {renderSortIndicator('tanggalMulai')}
                    </th>
                    <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Dosen Pembimbing</th>
                    <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Anggota</th>
                    <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((r, index) => (
                    <tr key={r.id} className="hover:bg-indigo-50/20 transition-colors duration-150 group">
                      <td className="px-4 md:px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{startIndex + index + 1}</td>
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-bold text-primary-900">{r.namaKelompok}</span>
                      </td>
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {r.tahunAjaran}
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap font-medium text-indigo-900">
                        {r.namaStase}
                      </td>
                      <td className="px-4 md:px-5 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 whitespace-nowrap border border-indigo-200">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {formatDateDisplay(r.tanggalMulai)} - {formatDateDisplay(r.tanggalSelesai)}
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        {r.namaPembimbing ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 w-fit">
                            <span>👨‍🏫</span>
                            <span>{r.namaPembimbing}</span>
                          </div>
                        ) : r.daftarSubStase && r.daftarSubStase.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 w-fit">
                            <span>📦</span>
                            <span>Multi-Dosen Sub-Stase</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">- Tidak ada -</span>
                        )}
                      </td>
                      <td className="px-4 md:px-5 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <MahasiswaIcon className="w-3 h-3 text-slate-500" />
                          {r.daftarMahasiswa?.length || 0} Mahasiswa
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Tooltip content="Detail Lengkap" position="bottom">
                            <button
                              onClick={() => setSelectedRiwayat(r)}
                              className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-all duration-200"
                            >
                              <DetailIcon className="w-5 h-5" />
                            </button>
                          </Tooltip>
                          {isAdmin && (
                            <Tooltip content="Hapus Riwayat" position="bottom">
                              <button
                                onClick={() => handleDeleteClick(r.id)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200"
                              >
                                <DeleteIcon className="w-5 h-5" />
                              </button>
                            </Tooltip>
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
                  Total <span className="text-primary-900 font-bold">{totalItems}</span> Data Riwayat
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all disabled:opacity-40 shadow-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
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
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all disabled:opacity-40 shadow-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRiwayat && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-elevated w-full max-w-2xl mx-auto my-8 animate-scale-in overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-550 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Detail Riwayat: {selectedRiwayat.namaKelompok}</h3>
                <p className="text-xs text-indigo-100 mt-1">Diarsipkan secara otomatis pada {new Date(selectedRiwayat.tanggalDiarsipkan).toLocaleString('id-ID')}</p>
              </div>
              <button
                onClick={() => setSelectedRiwayat(null)}
                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center font-bold transition-all text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Info Header */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tahun Ajaran</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedRiwayat.tahunAjaran}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Stase</span>
                  <p className="text-sm font-bold text-indigo-700 mt-0.5">{selectedRiwayat.namaStase}</p>
                </div>
                <div className="col-span-2 border-t border-slate-200/60 pt-3 mt-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Periode Jadwal</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    ⏱️ {formatDateDisplay(selectedRiwayat.tanggalMulai)} s/d {formatDateDisplay(selectedRiwayat.tanggalSelesai)}
                  </p>
                </div>
              </div>

              {/* Dosen Pembimbing */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <DosenIcon className="w-5 h-5 text-indigo-500" />
                  Dosen Pembimbing Stase
                </h4>
                {selectedRiwayat.namaPembimbing ? (
                  <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-600 text-white font-bold rounded-xl flex items-center justify-center shadow-sm">
                      {selectedRiwayat.namaPembimbing.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{selectedRiwayat.namaPembimbing}</p>
                      <p className="text-xs text-slate-500 font-mono">NIP: {selectedRiwayat.nipPembimbing || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-center text-xs text-slate-500 italic">
                    Dosen pembimbing utama stase tidak ditunjuk.
                  </div>
                )}
              </div>

              {/* Sub-Stase (If Kodil) */}
              {selectedRiwayat.daftarSubStase && selectedRiwayat.daftarSubStase.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                    <span>📦</span>
                    Dosen Pembimbing Per Sub-Stase
                  </h4>
                  <div className="space-y-2">
                    {selectedRiwayat.daftarSubStase.map((sub, idx) => (
                      <div key={idx} className="bg-indigo-50/40 border border-indigo-100/60 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">Sub-Stase {idx + 1}</span>
                          <p className="text-xs font-bold text-slate-800 mt-1">{sub.namaSubStase}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {sub.namaPembimbing ? (
                            <>
                              <p className="text-xs font-bold text-slate-700">{sub.namaPembimbing}</p>
                              <p className="text-[10px] text-slate-500 font-mono">NIP: {sub.nipPembimbing || '-'}</p>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum ditunjuk</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daftar Mahasiswa */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <MahasiswaIcon className="w-5 h-5 text-indigo-500" />
                  Anggota Mahasiswa KOAS ({selectedRiwayat.daftarMahasiswa?.length || 0})
                </h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {selectedRiwayat.daftarMahasiswa && selectedRiwayat.daftarMahasiswa.length > 0 ? (
                    selectedRiwayat.daftarMahasiswa.map((m, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800">{m.nama}</p>
                            <p className="text-[10px] text-slate-500 font-mono">NIM: {m.nim}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      Tidak ada mahasiswa terdaftar di kelompok ini.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedRiwayat(null)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-elevated p-6 w-full max-w-sm mx-auto animate-scale-in text-center border border-slate-100">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600 text-2xl">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Riwayat?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Data riwayat stase kelompok ini akan dihapus permanen dari histori.
            </p>
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
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-650 hover:from-red-650 hover:to-red-700 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-75 flex items-center justify-center gap-2 transition-all"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
