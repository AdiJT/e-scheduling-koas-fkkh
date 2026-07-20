/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { kelompokApi, mahasiswaApi, type Kelompok, type Mahasiswa } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDateDisplay } from '../utils/holidays';
import { KelompokIcon, MahasiswaIcon, DeleteIcon, JadwalIcon, InfoIcon, DosenIcon } from '../components/Icons';

export default function DetailKelompokPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const kelompokId = Number(id);
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'administrator';
  const isMahasiswa = user?.role?.toLowerCase() === 'mahasiswa';
  const isDosen = user?.role?.toLowerCase() === 'dosen';

  const [kelompok, setKelompok] = useState<Kelompok | null>(null);
  const [allMahasiswa, setAllMahasiswa] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMahasiswaIds, setSelectedMahasiswaIds] = useState<number[]>([]);

  // Remove member modal
  const [showRemoveMember, setShowRemoveMember] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const kel = await kelompokApi.get(kelompokId);
      setKelompok(kel);

      if (!isMahasiswa) {
        try {
          const mhs = await mahasiswaApi.getAll();
          setAllMahasiswa(mhs);
        } catch (e) {
          console.warn("Failed to fetch mahasiswa data:", e);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch kelompok:", err);
      if (err.status === 403) {
        setError('Anda tidak memiliki akses ke kelompok ini.');
      } else if (err.status === 404) {
        setError('Kelompok tidak ditemukan.');
      } else {
        setError('Gagal memuat data kelompok.');
      }
    } finally {
      setLoading(false);
    }
  }, [kelompokId, isMahasiswa]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Available mahasiswa (not in any kelompok)
  const availableMahasiswa = allMahasiswa.filter(m => !m.idKelompok);

  // === ADD MEMBER ===
  const handleCheckboxChange = (id: number) => {
    setSelectedMahasiswaIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedMahasiswaIds.length === availableMahasiswa.length) {
      setSelectedMahasiswaIds([]);
    } else {
      setSelectedMahasiswaIds(availableMahasiswa.map(m => m.id));
    }
  };

  const handleAddMember = async () => {
    if (selectedMahasiswaIds.length === 0 || !kelompok) return;
    try {
      setActionLoading(true);
      await Promise.all(
        selectedMahasiswaIds.map(id => kelompokApi.tambahAnggota(kelompokId, id))
      );
      await fetchData();
      setShowAddMember(false);
      setSelectedMahasiswaIds([]);
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string>; message?: string };
      setError(apiErr?.errors?.idMahasiswa || apiErr?.message || 'Gagal menambah anggota.');
    } finally {
      setActionLoading(false);
    }
  };

  // === REMOVE MEMBER ===
  const confirmRemoveMember = async () => {
    if (!removeMemberId) return;
    try {
      setActionLoading(true);
      await kelompokApi.hapusAnggota(kelompokId, removeMemberId);
      await fetchData();
      setShowRemoveMember(false);
      setRemoveMemberId(null);
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string>; message?: string };
      setError(apiErr?.errors?.idMahasiswa || apiErr?.message || 'Gagal menghapus anggota.');
    } finally {
      setActionLoading(false);
    }
  };

  const removingMember = kelompok?.daftarMahasiswa.find(m => m.id === removeMemberId);

  if (loading) {
    return (
      <Layout>
        <div className="p-16 text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Memuat detail kelompok...</p>
        </div>
      </Layout>
    );
  }

  if (error || !kelompok) {
    return (
      <Layout>
        <div className="p-16 text-center">
          <div className="flex justify-center mb-4 text-red-500">
            <InfoIcon className="w-16 h-16" />
          </div>
          <p className="text-slate-600 font-medium">{error || 'Kelompok tidak ditemukan'}</p>
          <button onClick={() => navigate('/kelompok')} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm">Kembali ke Daftar Kelompok</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate('/kelompok')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all duration-200">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-md">
            <KelompokIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Detail {kelompok.nama}</h1>
            <p className="text-sm text-slate-500">Informasi anggota kelompok dan Dosen Pembimbing per stase</p>
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

      {/* Anggota Section */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden mb-6 animate-fade-in-up">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" /> Anggota Kelompok
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{kelompok.daftarMahasiswa.length} Mahasiswa</span>
          </h2>
          {!isAdmin && !isMahasiswa && !isDosen && (
            <button
              onClick={() => { setShowAddMember(true); setSelectedMahasiswaIds([]); }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
            >
              + Tambah Anggota
            </button>
          )}
        </div>

        {kelompok.daftarMahasiswa.length === 0 ? (
          <div className="p-10 text-center">
            <div className="flex justify-center mb-3 text-slate-300">
              <MahasiswaIcon className="w-16 h-16" />
            </div>
            <p className="text-slate-500 text-sm">Belum ada anggota dalam kelompok ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full min-w-max" id="table-anggota">
              <thead>
                <tr className="bg-gradient-to-r from-primary-900 to-blue-800 text-white">
                  <th className="px-4 md:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">No</th>
                  <th className="px-4 md:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">NIM</th>
                  <th className="px-4 md:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Nama Mahasiswa</th>
                  {!isAdmin && !isMahasiswa && !isDosen && (
                    <th className="px-4 md:px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kelompok.daftarMahasiswa.map((mhs, index) => (
                  <tr key={mhs.id} className="hover:bg-blue-50/30 transition-colors duration-150 group">
                    <td className="px-4 md:px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{index + 1}</td>
                    <td className="px-4 md:px-5 py-3.5 text-sm font-mono text-slate-600 whitespace-nowrap">{mhs.nim}</td>
                    <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {mhs.nama.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-primary-900">{mhs.nama}</span>
                      </div>
                    </td>
                    {!isAdmin && !isMahasiswa && !isDosen && (
                      <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => { setRemoveMemberId(mhs.id); setShowRemoveMember(true); }}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200 text-sm"
                            title="Keluarkan dari kelompok"
                          >
                            <DeleteIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Jadwal & Dosen Pembimbing per Stase Section */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" /> Jadwal & Dosen Pembimbing per Stase
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">{kelompok.daftarJadwal.length} Stase</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Dosen pembimbing melekat langsung pada jadwal stase masing-masing</p>
          </div>
          <button 
            onClick={() => navigate('/jadwal')}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            Lihat Kelola Jadwal
          </button>
        </div>

        {kelompok.daftarJadwal.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-3 text-slate-300">
              <JadwalIcon className="w-16 h-16" />
            </div>
            <p className="text-slate-600 font-semibold text-base">Belum Ada Jadwal Stase</p>
            <p className="text-xs text-slate-400 mt-1">Jadwal dan Dosen Pembimbing stase akan muncul setelah disusun di menu Kelola Jadwal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-pink-700 text-white">
                  <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">No</th>
                  <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Stase</th>
                  <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Periode Stase</th>
                  <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Dosen Pembimbing Stase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kelompok.daftarJadwal.map((jadwal, index) => {
                  const isKodil = jadwal.namaStase?.toLowerCase().includes('kodil') || jadwal.idStase === 1;

                  return (
                    <tr key={jadwal.id} className="hover:bg-purple-50/30 transition-colors duration-150 group">
                      <td className="px-4 md:px-5 py-4 text-sm text-slate-500 whitespace-nowrap align-top">{index + 1}</td>
                      <td className="px-4 md:px-5 py-4 whitespace-nowrap align-top">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold border border-purple-200">
                            {jadwal.namaStase}
                          </span>
                          {isKodil && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                              ✨ 5 Sub-Stase
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-5 py-4 text-xs text-slate-600 whitespace-nowrap align-top">
                        <p className="font-semibold text-slate-800">{formatDateDisplay(jadwal.tanggalMulai)}</p>
                        <p className="text-slate-400">s/d {formatDateDisplay(jadwal.tanggalSelesai)}</p>
                      </td>
                      <td className="px-4 md:px-5 py-4 text-sm text-slate-700">
                        {isKodil && jadwal.daftarSubStase && jadwal.daftarSubStase.length > 0 ? (
                          <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200/80 space-y-2 max-w-lg">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 border-b border-purple-200 pb-1.5">
                              <DosenIcon className="w-4 h-4 text-purple-700" />
                              <span>Dosen Pembimbing Spesialis 5 Sub-Stase KODIL:</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {jadwal.daftarSubStase.map((sub) => {
                                const dosenNames = sub.daftarPembimbing && sub.daftarPembimbing.length > 0
                                  ? sub.daftarPembimbing.map(p => p.nama).join(', ')
                                  : (sub.namaPembimbing || 'Belum diatur');

                                return (
                                  <div key={sub.idSubStase || sub.urutan} className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-sm flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{sub.urutan}</span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-bold text-slate-800 truncate">{sub.namaSubStase}</p>
                                      <p className="text-xs text-purple-700 font-medium leading-tight">{dosenNames}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                              {jadwal.namaPembimbing?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{jadwal.namaPembimbing || 'Belum diatur'}</p>
                              {jadwal.nipPembimbing && <p className="text-xs text-slate-400 font-mono">NIP: {jadwal.nipPembimbing}</p>}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-lg mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" /> Tambah Anggota
              </h3>
              {availableMahasiswa.length > 0 && (
                <button type="button" onClick={selectAll} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  {selectedMahasiswaIds.length === availableMahasiswa.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              )}
            </div>
            
            {availableMahasiswa.length === 0 ? (
              <p className="text-sm text-slate-500 mb-4 text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                Tidak ada mahasiswa yang tersedia. Semua mahasiswa sudah terdaftar di kelompok.
              </p>
            ) : (
              <div className="mb-5 border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col h-[280px]">
                <div className="flex-1 overflow-y-auto p-2">
                  {availableMahasiswa.map(mhs => (
                    <label key={mhs.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50/50 cursor-pointer transition-colors border border-transparent hover:border-blue-100">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedMahasiswaIds.includes(mhs.id)}
                          onChange={() => handleCheckboxChange(mhs.id)}
                          className="peer w-5 h-5 appearance-none border-2 border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 checked:border-blue-500 checked:bg-blue-500 transition-all cursor-pointer"
                        />
                        <svg className="absolute w-3.5 h-3.5 text-white left-[3px] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 peer-checked:text-blue-700">{mhs.nama}</p>
                        <p className="text-xs text-slate-500 font-mono">{mhs.nim}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-200 bg-white text-xs font-semibold text-slate-600 text-center">
                  <span className="text-blue-600">{selectedMahasiswaIds.length}</span> mahasiswa dipilih
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowAddMember(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors">Batal</button>
              <button
                onClick={handleAddMember}
                disabled={selectedMahasiswaIds.length === 0 || actionLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '+'} Tambahkan ({selectedMahasiswaIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {showRemoveMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4 animate-scale-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <InfoIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">Keluarkan Anggota?</h3>
              {removingMember && <p className="text-sm text-slate-600 font-medium mb-1">{removingMember.nama} ({removingMember.nim})</p>}
              <p className="text-sm text-slate-500">Mahasiswa akan dikeluarkan dari kelompok ini</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRemoveMember(false)} disabled={actionLoading} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm">Batal</button>
              <button onClick={confirmRemoveMember} disabled={actionLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-70 flex items-center justify-center gap-2">
                {actionLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menghapus...</> : 'Ya, Keluarkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
