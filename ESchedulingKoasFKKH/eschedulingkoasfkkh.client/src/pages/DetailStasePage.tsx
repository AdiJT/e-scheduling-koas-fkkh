/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { staseApi, jadwalApi, pembimbingApi, type Stase, type Jadwal, type Pembimbing, type SubStase } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDateDisplay } from '../utils/holidays';
import { StaseIcon, KelompokIcon, JadwalIcon, InfoIcon, PrintIcon, StaseTerpisahIcon, StaseBersamaanIcon, DosenIcon, EditIcon, DeleteIcon, SaveIcon } from '../components/Icons';

export default function DetailStasePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const staseId = Number(id);
  const { user } = useAuth();
  const isDosen = user?.role?.toLowerCase() === 'dosen';
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'administrator';

  const [stase, setStase] = useState<Stase | null>(null);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [pembimbingList, setPembimbingList] = useState<Pembimbing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // SubStase Modals State
  const [showAddSubStase, setShowAddSubStase] = useState(false);
  const [subNama, setSubNama] = useState('');
  const [subUrutan, setSubUrutan] = useState<number | ''>('');
  const [subIdDosen, setSubIdDosen] = useState<number | ''>('');

  const [editingSubStase, setEditingSubStase] = useState<SubStase | null>(null);
  const [deletingSubStase, setDeletingSubStase] = useState<SubStase | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [staseData, allJadwal, pembimbings] = await Promise.all([
        staseApi.get(staseId),
        jadwalApi.getAll(),
        isAdmin ? pembimbingApi.getAll() : Promise.resolve([])
      ]);
      
      setStase(staseData);
      setPembimbingList(pembimbings);
      
      // Filter schedules for this stase
      const filteredJadwal = allJadwal.filter((j) => j.idStase === staseId);
      setJadwalList(filteredJadwal);
    } catch (err: any) {
      console.error("Failed to fetch stase details:", err);
      if (err.status === 404) {
        setError('Stase tidak ditemukan.');
      } else {
        setError('Gagal memuat detail stase.');
      }
    } finally {
      setLoading(false);
    }
  }, [staseId, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateDefaultPembimbing = async (subStaseId: number, idPembimbing: number | null) => {
    try {
      await staseApi.pilihPembimbingSubStase(subStaseId, idPembimbing);
      fetchData();
    } catch (err) {
      console.error("Failed to update default pembimbing:", err);
      alert("Gagal memperbarui dosen default.");
    }
  };

  // SubStase CRUD Handlers
  const handleCreateSubStase = async () => {
    if (!subNama) return;
    try {
      setActionLoading(true);
      await staseApi.createSubStase(staseId, {
        nama: subNama,
        urutan: subUrutan !== '' ? Number(subUrutan) : undefined,
        idDefaultPembimbing: subIdDosen !== '' ? Number(subIdDosen) : null
      });
      setShowAddSubStase(false);
      setSubNama('');
      setSubUrutan('');
      setSubIdDosen('');
      await fetchData();
    } catch (err) {
      console.error("Failed to add sub-stase:", err);
      alert("Gagal menambah sub-stase.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEditSubStase = async () => {
    if (!editingSubStase || !subNama) return;
    try {
      setActionLoading(true);
      await staseApi.updateSubStase(editingSubStase.id, {
        nama: subNama,
        urutan: subUrutan !== '' ? Number(subUrutan) : undefined,
        idDefaultPembimbing: subIdDosen !== '' ? Number(subIdDosen) : null
      });
      setEditingSubStase(null);
      setSubNama('');
      setSubUrutan('');
      setSubIdDosen('');
      await fetchData();
    } catch (err) {
      console.error("Failed to update sub-stase:", err);
      alert("Gagal memperbarui sub-stase.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubStase = async () => {
    if (!deletingSubStase) return;
    try {
      setActionLoading(true);
      await staseApi.deleteSubStase(deletingSubStase.id);
      setDeletingSubStase(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete sub-stase:", err);
      alert("Gagal menghapus sub-stase.");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditSubStaseModal = (sub: SubStase) => {
    setEditingSubStase(sub);
    setSubNama(sub.nama);
    setSubUrutan(sub.urutan);
    setSubIdDosen(sub.idDefaultPembimbing || '');
  };

  // Role-based filtering for Dosen: only show groups they supervise
  const displayedJadwal = jadwalList.filter((j) => {
    if (isDosen) {
      return j.idPembimbing === user?.profileId || j.daftarSubStase?.some(s => s.idPembimbing === user?.profileId);
    }
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div className="p-16 text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Memuat detail stase...</p>
        </div>
      </Layout>
    );
  }

  if (error || !stase) {
    return (
      <Layout>
        <div className="p-16 text-center">
          <div className="flex justify-center mb-4 text-red-500">
            <InfoIcon className="w-16 h-16" />
          </div>
          <p className="text-slate-600 font-medium">{error || 'Stase tidak ditemukan'}</p>
          <button onClick={() => navigate('/stase')} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-xl text-sm">Kembali ke Daftar Stase</button>
        </div>
      </Layout>
    );
  }

  const isKodil = stase.id === 1 || stase.nama.toLowerCase().includes('kodil');

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all duration-200">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <StaseIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Detail Stase: {stase.nama}</h1>
            <p className="text-sm text-slate-500">Informasi lengkap{isKodil ? ', sub-stase rotasi,' : ''} dan jadwal kelompok pada stase ini</p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 animate-fade-in-up">
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <JadwalIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Durasi</p>
            <p className="text-lg font-bold text-primary-900">{stase.waktu} Minggu</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            {stase.jenis === 'Terpisah' ? (
              <StaseTerpisahIcon className="w-6 h-6 text-amber-500" />
            ) : (
              <StaseBersamaanIcon className="w-6 h-6 text-blue-500" />
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Jenis</p>
            <p className="text-lg font-bold text-primary-900">{stase.jenis}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <KelompokIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Kelompok</p>
            <p className="text-lg font-bold text-primary-900">{displayedJadwal.length} Terjadwal</p>
          </div>
        </div>
      </div>

      {/* Sub-Stase Section (Khusus Stase KODIL) */}
      {isKodil && (
        <div className="mb-8 bg-white rounded-2xl shadow-card border border-purple-100 overflow-hidden animate-fade-in-up">
          <div className="p-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">✨</div>
              <div>
                <h2 className="text-lg font-bold text-primary-900">Daftar Sub-Stase & Dosen Spesialis Default</h2>
                <p className="text-xs text-slate-500">
                  {stase.daftarSubStase && stase.daftarSubStase.length > 0
                    ? `Stase ini memiliki ${stase.daftarSubStase.length} sub-stase rotasi spesifik`
                    : 'Belum ada sub-stase. Tambahkan sub-stase baru di bawah ini.'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => { setSubNama(''); setSubUrutan((stase.daftarSubStase?.length || 0) + 1); setSubIdDosen(''); setShowAddSubStase(true); }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                + Tambah Sub-Stase
              </button>
            )}
          </div>
          {stase.daftarSubStase && stase.daftarSubStase.length > 0 ? (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stase.daftarSubStase.map((sub) => (
                <div key={sub.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3 relative group">
                  <div className="flex items-start justify-between">
                    <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">{sub.urutan}</span>
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEditSubStaseModal(sub)}
                            className="p-1 rounded text-amber-600 hover:bg-amber-100 transition-colors"
                            title="Edit Sub-Stase"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingSubStase(sub)}
                            className="p-1 rounded text-red-600 hover:bg-red-100 transition-colors"
                            title="Hapus Sub-Stase"
                          >
                            <DeleteIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 font-semibold rounded-full border border-purple-200">Sub-Stase</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{sub.nama}</h3>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
                      <DosenIcon className="w-4 h-4 text-emerald-600" />
                      <span>Dosen Default: <strong>{sub.namaDefaultPembimbing || 'Belum diatur'}</strong></span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Quick Set Dosen Default:</label>
                      <select
                        value={sub.idDefaultPembimbing || ''}
                        onChange={(e) => handleUpdateDefaultPembimbing(sub.id, e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-purple-500"
                      >
                        <option value="">-- Pilih Dosen Default --</option>
                        {pembimbingList.map(p => (
                          <option key={p.id} value={p.id}>{p.nama}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada sub-stase yang dikonfigurasi untuk stase ini.
            </div>
          )}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" /> 
            Jadwal Kelompok
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
            >
              <PrintIcon className="w-4 h-4" /> Cetak PDF
            </button>
          </div>
        </div>

        {displayedJadwal.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex justify-center mb-4 text-slate-300">
              <JadwalIcon className="w-16 h-16" />
            </div>
            <p className="text-slate-600 font-medium">Tidak ada jadwal ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">
              {isDosen ? 'Tidak ada kelompok bimbingan Anda yang terdaftar pada stase ini.' : 'Belum ada jadwal yang disusun untuk stase ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">No</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Kelompok</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Tanggal Mulai</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Tanggal Selesai</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Dosen Pembimbing</th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedJadwal.map((jadwal, index) => (
                  <tr key={jadwal.id} className="hover:bg-purple-50/20 transition-colors group">
                    <td className="px-5 py-4 text-sm text-slate-500">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                          {jadwal.namaKelompok?.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-primary-900">{jadwal.namaKelompok}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDateDisplay(jadwal.tanggalMulai)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDateDisplay(jadwal.tanggalSelesai)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {jadwal.daftarSubStase && jadwal.daftarSubStase.length > 0 ? (
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-purple-700 block mb-1">Dosen Sub-Stase ({jadwal.daftarSubStase.length}):</span>
                          {jadwal.daftarSubStase.map(sub => (
                            <div key={sub.idSubStase} className="text-xs text-slate-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              <span className="font-semibold">{sub.namaSubStase}:</span>
                              <span>{sub.namaPembimbing || 'Belum diatur'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>{jadwal.namaPembimbing || 'Belum diatur'}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center print:hidden">
                      <button
                        onClick={() => navigate(`/kelompok/${jadwal.idKelompok}`)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Lihat Kelompok
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Sub-Stase */}
      {showAddSubStase && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
              Tambah Sub-Stase Baru
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Sub-Stase <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Patologi Klinik"
                  value={subNama}
                  onChange={(e) => setSubNama(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Urutan Rotasi</label>
                <input
                  type="number"
                  placeholder="1, 2, 3..."
                  value={subUrutan}
                  onChange={(e) => setSubUrutan(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dosen Penanggung Jawab Default</label>
                <select
                  value={subIdDosen}
                  onChange={(e) => setSubIdDosen(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="">-- Tanpa Dosen Default --</option>
                  {pembimbingList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddSubStase(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm">Batal</button>
              <button
                onClick={handleCreateSubStase}
                disabled={!subNama || actionLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><SaveIcon className="w-4 h-4" /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Sub-Stase */}
      {editingSubStase && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
              Edit Sub-Stase
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Sub-Stase <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={subNama}
                  onChange={(e) => setSubNama(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Urutan Rotasi</label>
                <input
                  type="number"
                  value={subUrutan}
                  onChange={(e) => setSubUrutan(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dosen Penanggung Jawab Default</label>
                <select
                  value={subIdDosen}
                  onChange={(e) => setSubIdDosen(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="">-- Tanpa Dosen Default --</option>
                  {pembimbingList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingSubStase(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm">Batal</button>
              <button
                onClick={handleSaveEditSubStase}
                disabled={!subNama || actionLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><SaveIcon className="w-4 h-4" /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Sub-Stase */}
      {deletingSubStase && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4 animate-scale-in text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
              <InfoIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Sub-Stase?</h3>
            <p className="text-sm font-semibold text-slate-700 mb-2">{deletingSubStase.nama}</p>
            <p className="text-xs text-slate-500 mb-6">Sub-stase ini akan dihapus dari stase {stase.nama}.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingSubStase(null)} disabled={actionLoading} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm">Batal</button>
              <button
                onClick={handleDeleteSubStase}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
