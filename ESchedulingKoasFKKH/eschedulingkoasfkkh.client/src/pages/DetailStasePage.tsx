/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { staseApi, jadwalApi, pembimbingApi, type Stase, type Jadwal, type Pembimbing, type SubStase } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDateDisplay } from '../utils/holidays';
import { StaseIcon, KelompokIcon, JadwalIcon, InfoIcon, PrintIcon, StaseTerpisahIcon, StaseBersamaanIcon, DosenIcon, EditIcon, DeleteIcon, SaveIcon, KoordinatorIcon } from '../components/Icons';

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
  const [subSelectedDosenIds, setSubSelectedDosenIds] = useState<number[]>([]);

  const [editingSubStase, setEditingSubStase] = useState<SubStase | null>(null);
  const [deletingSubStase, setDeletingSubStase] = useState<SubStase | null>(null);

  // Manage Dosen Stase Modal State
  const [showManageDosen, setShowManageDosen] = useState(false);
  const [selectedDosenIds, setSelectedDosenIds] = useState<number[]>([]);

  // Manage Koordinator Stase Modal State
  const [showManageKoordinator, setShowManageKoordinator] = useState(false);
  const [selectedKoordinatorId, setSelectedKoordinatorId] = useState<number | ''>('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [staseData, allJadwal, pembimbings] = await Promise.all([
        staseApi.get(staseId),
        jadwalApi.getAll(),
        pembimbingApi.getAll()
      ]);
      
      setStase(staseData);
      setPembimbingList(pembimbings);
      setSelectedDosenIds(staseData.daftarPembimbing?.map(p => p.id) || []);
      setSelectedKoordinatorId(staseData.idKoordinator || '');
      
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
  }, [staseId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // SubStase CRUD Handlers
  const handleCreateSubStase = async () => {
    if (!subNama) return;
    try {
      setActionLoading(true);
      await staseApi.createSubStase(staseId, {
        nama: subNama,
        urutan: subUrutan !== '' ? Number(subUrutan) : undefined,
        idDefaultPembimbingList: subSelectedDosenIds
      });
      setShowAddSubStase(false);
      setSubNama('');
      setSubUrutan('');
      setSubSelectedDosenIds([]);
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
        idDefaultPembimbingList: subSelectedDosenIds
      });
      setEditingSubStase(null);
      setSubNama('');
      setSubUrutan('');
      setSubSelectedDosenIds([]);
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
    setSubSelectedDosenIds(sub.daftarDefaultPembimbing?.map(p => p.id) || (sub.idDefaultPembimbing ? [sub.idDefaultPembimbing] : []));
  };

  const toggleSubDosenId = (dosenId: number) => {
    setSubSelectedDosenIds(prev =>
      prev.includes(dosenId)
        ? prev.filter(id => id !== dosenId)
        : [...prev, dosenId]
    );
  };

  // Manage Dosen Stase Handlers
  const handleOpenManageDosen = () => {
    const ids = stase?.daftarPembimbing?.map(p => p.id) || [];
    if (stase?.idKoordinator && !ids.includes(stase.idKoordinator)) {
      ids.push(stase.idKoordinator);
    }
    setSelectedDosenIds(ids);
    setShowManageDosen(true);
  };

  const handleToggleDosen = (dosenId: number) => {
    // Koordinator stase dikunci agar tetap terdaftar sebagai pembimbing
    if (stase?.idKoordinator === dosenId) return;

    setSelectedDosenIds(prev =>
      prev.includes(dosenId)
        ? prev.filter(id => id !== dosenId)
        : [...prev, dosenId]
    );
  };

  const handleSaveManageDosen = async () => {
    try {
      setActionLoading(true);
      const idsToSave = [...selectedDosenIds];
      if (stase?.idKoordinator && !idsToSave.includes(stase.idKoordinator)) {
        idsToSave.push(stase.idKoordinator);
      }
      await staseApi.updatePembimbingStase(staseId, idsToSave);
      setShowManageDosen(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to save stase Dosen:", err);
      alert("Gagal menyimpan daftar dosen stase.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveKoordinator = async () => {
    try {
      setActionLoading(true);
      await staseApi.pilihKoordinatorStase(staseId, selectedKoordinatorId !== '' ? Number(selectedKoordinatorId) : null);
      setShowManageKoordinator(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to save Koordinator Stase:", err);
      alert("Gagal menyimpan Koordinator Stase.");
    } finally {
      setActionLoading(false);
    }
  };

  // Role-based filtering for Dosen: only show groups they supervise
  const displayedJadwal = jadwalList.filter((j) => {
    if (isDosen) {
      return j.idPembimbing === user?.profileId || j.daftarSubStase?.some(s => s.idPembimbing === user?.profileId || s.daftarPembimbing?.some(dp => dp.id === user?.profileId));
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
      {/* Hero Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 rounded-2xl p-4 sm:p-6 text-white shadow-xl mb-4 sm:mb-6 animate-fade-in-down">
        {/* Subtle decorative watermark */}
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none transform rotate-12">
          <StaseIcon className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/stase')}
              className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all border border-white/10 shadow-sm cursor-pointer shrink-0"
              title="Kembali ke Daftar Stase"
            >
              ←
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md shrink-0">
              <StaseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Detail Stase: {stase.nama}</h1>
              <p className="text-xs sm:text-sm text-purple-100/90 mt-0.5">
                Informasi lengkap{isKodil ? ', sub-stase rotasi,' : ''} dan jadwal kelompok pada stase ini
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-purple-100 self-start sm:self-center">
            <span>{stase.waktu} Minggu • {stase.jenis}</span>
          </div>
        </div>
      </div>

      {/* Koordinator Stase Banner */}
      <div className="mb-4 sm:mb-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-2xl p-4 sm:p-5 text-white shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-fade-in-up">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-inner border border-white/30 shrink-0">
            <KoordinatorIcon className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-100" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-white/20 px-2 sm:px-2.5 py-0.5 rounded-full border border-white/30 text-purple-100 inline-block">
              Koordinator Stase
            </span>
            <h2 className="text-base sm:text-xl font-extrabold text-white mt-1 truncate">
              {stase.namaKoordinator ? stase.namaKoordinator : 'Belum Ditunjuk'}
            </h2>
            {stase.nipKoordinator && (
              <p className="text-[11px] sm:text-xs text-purple-200 font-mono mt-0.5">NIP: {stase.nipKoordinator}</p>
            )}
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setSelectedKoordinatorId(stase.idKoordinator || ''); setShowManageKoordinator(true); }}
            className="w-full sm:w-auto px-3.5 sm:px-4 py-2 bg-white text-purple-900 hover:bg-purple-50 active:scale-95 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <EditIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-700" />
            <span>{stase.idKoordinator ? 'Ubah Koordinator' : 'Pilih Koordinator Stase'}</span>
          </button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 animate-fade-in-up">
        <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-card border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider truncate">Durasi</p>
            <p className="text-xs sm:text-lg font-bold text-primary-900 mt-0.5 truncate">{stase.waktu} Minggu</p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 self-start sm:self-center">
            <JadwalIcon className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-card border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider truncate">Jenis</p>
            <p className="text-xs sm:text-lg font-bold text-primary-900 mt-0.5 truncate">{stase.jenis}</p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 self-start sm:self-center">
            {stase.jenis === 'Terpisah' ? (
              <StaseTerpisahIcon className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500" />
            ) : (
              <StaseBersamaanIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
            )}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-card border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider truncate">Kelompok</p>
            <p className="text-xs sm:text-lg font-bold text-primary-900 mt-0.5 truncate">{displayedJadwal.length} <span className="hidden sm:inline">Terjadwal</span></p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 self-start sm:self-center">
            <KelompokIcon className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Dosen Pembimbing Stase Section */}
      <div className="mb-6 sm:mb-8 bg-white rounded-2xl shadow-card border border-emerald-100 overflow-hidden animate-fade-in-up">
        <div className="p-4 sm:p-5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
              <DosenIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-primary-900">Dosen Pembimbing Terdaftar pada Stase Ini</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {stase.daftarPembimbing && stase.daftarPembimbing.length > 0
                  ? `Terdapat ${stase.daftarPembimbing.length} Dosen Pembimbing yang bertugas pada stase ${stase.nama}`
                  : 'Belum ada dosen yang ditugaskan untuk stase ini (semua dosen akan ditampilkan di opsi jadwal).'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={handleOpenManageDosen}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <DosenIcon className="w-4 h-4" /> <span>Kelola Dosen Stase</span>
            </button>
          )}
        </div>
        {stase.daftarPembimbing && stase.daftarPembimbing.length > 0 ? (
          <div className="p-3.5 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {stase.daftarPembimbing.map((p) => {
              const isKoordinator = stase.idKoordinator === p.id;
              return (
                <div
                  key={p.id}
                  className={`p-3 sm:p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                    isKoordinator
                      ? 'bg-gradient-to-r from-purple-50 to-indigo-50/60 border-purple-200 shadow-sm'
                      : 'bg-emerald-50/50 border-emerald-100'
                  }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 shadow-sm ${
                      isKoordinator
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {p.nama.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-slate-800 text-xs truncate">{p.nama}</p>
                      {isKoordinator && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-700 rounded-md border border-purple-200 inline-flex items-center gap-0.5">
                          <KoordinatorIcon className="w-2.5 h-2.5 text-purple-600" /> Koordinator
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono">NIP: {p.nip}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 sm:p-6 text-center text-slate-400 text-xs">
            Belum ada Dosen Pembimbing yang dikhususkan untuk stase ini. Klik tombol <strong>Kelola Dosen Stase</strong> untuk memilih dosen.
          </div>
        )}
      </div>

      {/* Sub-Stase Section (Khusus Stase KODIL) */}
      {isKodil && (
        <div className="mb-6 sm:mb-8 bg-white rounded-2xl shadow-card border border-purple-100 overflow-hidden animate-fade-in-up">
          <div className="p-4 sm:p-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">✨</div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-primary-900">Daftar Sub-Stase KODIL & Dosen Spesialis Default (Multi-Dosen)</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  {stase.daftarSubStase && stase.daftarSubStase.length > 0
                    ? `Stase ini memiliki ${stase.daftarSubStase.length} sub-stase rotasi spesifik`
                    : 'Belum ada sub-stase. Tambahkan sub-stase baru di bawah ini.'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => { setSubNama(''); setSubUrutan((stase.daftarSubStase?.length || 0) + 1); setSubSelectedDosenIds([]); setShowAddSubStase(true); }}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>+ Tambah Sub-Stase</span>
              </button>
            )}
          </div>
          {stase.daftarSubStase && stase.daftarSubStase.length > 0 ? (
            <div className="p-3.5 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {stase.daftarSubStase.map((sub) => {
                const defaultDosenList = sub.daftarDefaultPembimbing || (sub.namaDefaultPembimbing ? [{ id: sub.idDefaultPembimbing!, nip: sub.nipDefaultPembimbing || '', nama: sub.namaDefaultPembimbing }] : []);

                return (
                  <div key={sub.id} className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3 relative group">
                    <div className="flex items-start justify-between">
                      <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">{sub.urutan}</span>
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditSubStaseModal(sub)}
                              className="p-1 rounded text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Edit Sub-Stase & Multi-Dosen"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingSubStase(sub)}
                              className="p-1 rounded text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                              title="Hapus Sub-Stase"
                            >
                              <DeleteIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <span className="text-[11px] px-2 py-0.5 bg-purple-50 text-purple-700 font-semibold rounded-full border border-purple-200">Sub-Stase</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm mb-1">{sub.nama}</h3>
                      <div className="space-y-1.5 mt-2">
                        <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <DosenIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dosen Spesialis Default ({defaultDosenList.length}):</span>
                        </p>
                        {defaultDosenList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {defaultDosenList.map(p => (
                              <span key={p.id} className="px-2 py-0.5 bg-purple-100/80 text-purple-900 text-xs font-medium rounded-lg border border-purple-200">
                                {p.nama}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Belum ada Dosen default</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center text-slate-400 text-sm">
              Belum ada sub-stase yang dikonfigurasi untuk stase ini.
            </div>
          )}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-primary-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" /> 
            Jadwal Kelompok
          </h2>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => window.print()}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <PrintIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Cetak</span> PDF
            </button>
          </div>
        </div>

        {displayedJadwal.length === 0 ? (
          <div className="p-10 sm:p-16 text-center">
            <div className="flex justify-center mb-3 sm:mb-4 text-slate-300">
              <JadwalIcon className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <p className="text-slate-600 font-medium text-sm sm:text-base">Tidak ada jadwal ditemukan</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isDosen ? 'Tidak ada kelompok bimbingan Anda yang terdaftar pada stase ini.' : 'Belum ada jadwal yang disusun untuk stase ini.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Card List (Screens < md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {displayedJadwal.map((jadwal, index) => (
                <div key={jadwal.id} className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2.5 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {jadwal.namaKelompok?.charAt(0) || 'K'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm truncate">
                            {jadwal.namaKelompok}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/kelompok/${jadwal.idKelompok}`)}
                      className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 text-[11px] font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      Lihat Kelompok
                    </button>
                  </div>

                  {/* Dates */}
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 mb-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="text-slate-400">Periode:</span>
                      <span className="font-medium text-slate-700">
                        {formatDateDisplay(jadwal.tanggalMulai)} — {formatDateDisplay(jadwal.tanggalSelesai)}
                      </span>
                    </div>
                  </div>

                  {/* Dosen Pembimbing */}
                  <div className="text-xs">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Dosen Pembimbing:</span>
                    {jadwal.daftarSubStase && jadwal.daftarSubStase.length > 0 ? (
                      <div className="space-y-1 bg-purple-50/40 rounded-xl p-2 border border-purple-100/60">
                        {jadwal.daftarSubStase.map(sub => {
                          const subDosenList = sub.daftarPembimbing && sub.daftarPembimbing.length > 0
                            ? sub.daftarPembimbing.map(p => p.nama).join(', ')
                            : (sub.namaPembimbing || 'Belum diatur');

                          return (
                            <div key={sub.idSubStase} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1" />
                              <div>
                                <span className="font-semibold text-purple-900">{sub.namaSubStase}: </span>
                                <span className="text-slate-600">{subDosenList}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="font-medium text-slate-700 text-xs">{jadwal.namaPembimbing || 'Belum diatur'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (Hidden on mobile, screens >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 text-white">
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
                            <span className="text-xs font-bold text-purple-700 block mb-1">Dosen Sub-Stase Kodil:</span>
                            {jadwal.daftarSubStase.map(sub => {
                              const subDosenList = sub.daftarPembimbing && sub.daftarPembimbing.length > 0
                                ? sub.daftarPembimbing.map(p => p.nama).join(', ')
                                : (sub.namaPembimbing || 'Belum diatur');

                              return (
                                <div key={sub.idSubStase} className="text-xs text-slate-700 flex items-start gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1" />
                                  <span className="font-semibold">{sub.namaSubStase}:</span>
                                  <span>{subDosenList}</span>
                                </div>
                              );
                            })}
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
          </>
        )}
      </div>

      {/* Modal Kelola Dosen Stase */}
      {showManageDosen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-4 sm:p-6 w-full max-w-lg mx-auto animate-scale-in">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold text-primary-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                Kelola Dosen Stase {stase.nama}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3 sm:mb-4">
              Pilih Dosen mana saja yang mengajar atau bertugas pada stase <strong>{stase.nama}</strong>.
            </p>

            <div className="mb-4 sm:mb-5 border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col h-[260px] sm:h-[280px]">
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {pembimbingList.map(p => {
                  const isKoordinator = stase?.idKoordinator === p.id;
                  const isChecked = isKoordinator || selectedDosenIds.includes(p.id);

                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl transition-colors border ${
                        isKoordinator
                          ? 'bg-purple-50/80 border-purple-200 cursor-default'
                          : isChecked
                          ? 'bg-emerald-50/60 border-emerald-200 cursor-pointer'
                          : 'bg-white border-slate-100 hover:border-slate-200 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isKoordinator}
                        onChange={() => handleToggleDosen(p.id)}
                        className={`w-4 h-4 rounded shrink-0 ${
                          isKoordinator
                            ? 'text-purple-600 border-purple-300 focus:ring-purple-500'
                            : 'text-emerald-600 border-slate-300 focus:ring-emerald-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{p.nama}</p>
                          {isKoordinator && (
                            <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 rounded-full inline-flex items-center gap-1">
                              <KoordinatorIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" /> Koordinator
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-mono">NIP: {p.nip}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="p-2.5 sm:p-3 border-t border-slate-200 bg-white text-xs font-semibold text-slate-600 text-center flex items-center justify-center gap-1">
                <span className="text-emerald-600 font-bold">
                  {new Set([...selectedDosenIds, ...(stase?.idKoordinator ? [stase.idKoordinator] : [])]).size}
                </span>
                <span>Dosen dipilih untuk stase ini</span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button onClick={() => setShowManageDosen(false)} className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs sm:text-sm">Batal</button>
              <button
                onClick={handleSaveManageDosen}
                disabled={actionLoading}
                className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-xl shadow-md text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><SaveIcon className="w-4 h-4" /> Simpan Penugasan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Sub-Stase */}
      {showAddSubStase && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-4 sm:p-6 w-full max-w-md mx-auto animate-scale-in">
            <h3 className="text-base sm:text-lg font-bold text-primary-900 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
              Tambah Sub-Stase Baru
            </h3>
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Nama Sub-Stase <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Patologi Klinik"
                  value={subNama}
                  onChange={(e) => setSubNama(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Urutan Rotasi</label>
                <input
                  type="number"
                  placeholder="1, 2, 3..."
                  value={subUrutan}
                  onChange={(e) => setSubUrutan(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Dosen Penanggung Jawab Default (Multi-Select)</label>
                <div className="border-2 border-slate-200 rounded-xl max-h-36 sm:max-h-40 overflow-y-auto p-2 bg-slate-50 space-y-1">
                  {(stase.daftarPembimbing || []).map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-purple-50 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={subSelectedDosenIds.includes(p.id)}
                        onChange={() => toggleSubDosenId(p.id)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="font-semibold text-slate-700">{p.nama}</span>
                    </label>
                  ))}
                  {(!stase.daftarPembimbing || stase.daftarPembimbing.length === 0) && (
                    <p className="text-xs text-slate-500 italic p-2 text-center">
                      Belum ada dosen pembimbing pada stase ini. Silakan kelola Dosen Stase terlebih dahulu.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button onClick={() => setShowAddSubStase(false)} className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs sm:text-sm">Batal</button>
              <button
                onClick={handleCreateSubStase}
                disabled={!subNama || actionLoading}
                className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl shadow-md text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><SaveIcon className="w-4 h-4" /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Sub-Stase */}
      {editingSubStase && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-4 sm:p-6 w-full max-w-md mx-auto animate-scale-in">
            <h3 className="text-base sm:text-lg font-bold text-primary-900 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
              Edit Sub-Stase
            </h3>
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Nama Sub-Stase <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={subNama}
                  onChange={(e) => setSubNama(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Urutan Rotasi</label>
                <input
                  type="number"
                  value={subUrutan}
                  onChange={(e) => setSubUrutan(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Dosen Penanggung Jawab Default (Multi-Select)</label>
                <div className="border-2 border-slate-200 rounded-xl max-h-36 sm:max-h-40 overflow-y-auto p-2 bg-slate-50 space-y-1">
                  {(stase.daftarPembimbing || []).map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-amber-50 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={subSelectedDosenIds.includes(p.id)}
                        onChange={() => toggleSubDosenId(p.id)}
                        className="w-4 h-4 text-amber-600 rounded"
                      />
                      <span className="font-semibold text-slate-700">{p.nama}</span>
                    </label>
                  ))}
                  {(!stase.daftarPembimbing || stase.daftarPembimbing.length === 0) && (
                    <p className="text-xs text-slate-500 italic p-2 text-center">
                      Belum ada dosen pembimbing pada stase ini. Silakan kelola Dosen Stase terlebih dahulu.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button onClick={() => setEditingSubStase(null)} className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs sm:text-sm">Batal</button>
              <button
                onClick={handleSaveEditSubStase}
                disabled={!subNama || actionLoading}
                className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl shadow-md text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><SaveIcon className="w-4 h-4" /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Sub-Stase */}
      {deletingSubStase && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-4 sm:p-6 w-full max-w-sm mx-auto animate-scale-in text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 sm:mb-4 text-red-600">
              <InfoIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary-900 mb-1">Hapus Sub-Stase?</h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-2">{deletingSubStase.nama}</p>
            <p className="text-xs text-slate-500 mb-5 sm:mb-6">Sub-stase ini akan dihapus dari stase {stase.nama}.</p>
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button onClick={() => setDeletingSubStase(null)} disabled={actionLoading} className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs sm:text-sm">Batal</button>
              <button
                onClick={handleDeleteSubStase}
                disabled={actionLoading}
                className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl shadow-md text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kelola Koordinator Stase */}
      {showManageKoordinator && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-4 sm:p-6 w-full max-w-md mx-auto animate-scale-in">
            <h3 className="text-base sm:text-lg font-bold text-primary-900 mb-2 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
              Pilih Koordinator Stase {stase.nama}
            </h3>
            <p className="text-xs text-slate-500 mb-3 sm:mb-4">
              Pilih 1 Dosen Pembimbing sebagai Koordinator Stase <strong>{stase.nama}</strong> dari Dosen yang terdaftar.
            </p>

            <div className="mb-5 sm:mb-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Dosen Koordinator Stase</label>
                <select
                  value={selectedKoordinatorId}
                  onChange={(e) => setSelectedKoordinatorId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="">-- Tanpa Koordinator Stase --</option>
                  {pembimbingList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nama} (NIP: {p.nip})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button onClick={() => setShowManageKoordinator(false)} className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs sm:text-sm">Batal</button>
              <button
                onClick={handleSaveKoordinator}
                disabled={actionLoading}
                className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-md text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><SaveIcon className="w-4 h-4" /> Simpan Koordinator</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
