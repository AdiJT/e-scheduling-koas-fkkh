/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { mahasiswaApi, kelompokApi, riwayatKelompokApi, tahunAjaranApi, type MahasiswaDetail, type TahunAjaran, type RiwayatStaseMahasiswa, type KelompokDetailMahasiswa, type JadwalMahasiswa } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDateDisplay } from '../utils/holidays';
import { 
  MahasiswaIcon, 
  KelompokIcon, 
  StaseIcon, 
  JadwalIcon, 
  PrintIcon, 
  DosenIcon, 
  EditIcon, 
  SearchIcon, 
  HistoryIcon, 
  UserIcon, 
  RefreshIcon,
  LockIcon,
  EyeOffIcon,
} from '../components/Icons';
import Tooltip from '../components/Tooltip';

export default function DetailMahasiswaPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mahasiswaId = Number(id);
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'administrator';

  const [mahasiswa, setMahasiswa] = useState<MahasiswaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jadwal' | 'riwayat' | 'kelompok'>('jadwal');

  // Search in history
  const [historySearch, setHistorySearch] = useState('');

  // Selected history teammates modal
  const [selectedHistory, setSelectedHistory] = useState<RiwayatStaseMahasiswa | null>(null);

  // Edit Modal State (Admin only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ nim: '', nama: '', idTahunAjaran: 0 });
  const [tahunAjarans, setTahunAjarans] = useState<TahunAjaran[]>([]);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Reset Password Modal State
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [useDefaultPassword, setUseDefaultPassword] = useState(true);
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, allKelompoks, allRiwayats] = await Promise.all([
        mahasiswaApi.get(mahasiswaId),
        kelompokApi.getAll().catch(() => []),
        riwayatKelompokApi.getAll().catch(() => [])
      ]);

      const today = new Date().toISOString().split('T')[0];

      // 1. Resolve Kelompok Detail
      let resolvedKelompok: KelompokDetailMahasiswa | null = data.kelompokDetail || null;
      if (!resolvedKelompok && (data.idKelompok || allKelompoks.length > 0)) {
        const matchingKelompok = allKelompoks.find((k: any) => 
          k.id === data.idKelompok || k.daftarMahasiswa?.some((m: any) => m.id === mahasiswaId || m.nim === data.nim)
        );

        if (matchingKelompok) {
          const jadwals: JadwalMahasiswa[] = (matchingKelompok.daftarJadwal || []).map((j: any) => {
            const status: 'Sedang Berjalan' | 'Mendatang' | 'Selesai' = j.tanggalSelesai < today 
              ? 'Selesai' 
              : (j.tanggalMulai <= today && today <= j.tanggalSelesai ? 'Sedang Berjalan' : 'Mendatang');
            return {
              id: j.id,
              tanggalMulai: j.tanggalMulai,
              tanggalSelesai: j.tanggalSelesai,
              status,
              idStase: j.idStase,
              namaStase: j.namaStase,
              jumlahHari: j.jumlahHari,
              idPembimbing: j.idPembimbing,
              namaPembimbing: j.namaPembimbing,
              nipPembimbing: j.nipPembimbing,
              daftarSubStase: j.daftarSubStase || []
            };
          }).sort((a: any, b: any) => a.tanggalMulai.localeCompare(b.tanggalMulai));

          resolvedKelompok = {
            id: matchingKelompok.id,
            nama: matchingKelompok.nama,
            idTahunAjaran: matchingKelompok.idTahunAjaran,
            tahunAjaran: matchingKelompok.tahunAjaran,
            daftarAnggota: matchingKelompok.daftarMahasiswa || [],
            daftarJadwal: jadwals
          };
        }
      }

      // 2. Resolve Riwayat Stase
      let resolvedRiwayat: RiwayatStaseMahasiswa[] = (data.riwayatStase && data.riwayatStase.length > 0)
        ? data.riwayatStase
        : [];

      if (resolvedRiwayat.length === 0 && allRiwayats.length > 0) {
        resolvedRiwayat = allRiwayats.filter((r: any) => 
          r.daftarMahasiswa?.some((m: any) => m.nim === data.nim)
        ).map((r: any) => ({
          id: r.id,
          idJadwalAsal: r.idJadwalAsal,
          namaKelompok: r.namaKelompok,
          tahunAjaran: r.tahunAjaran,
          namaStase: r.namaStase,
          tanggalMulai: r.tanggalMulai,
          tanggalSelesai: r.tanggalSelesai,
          namaPembimbing: r.namaPembimbing,
          nipPembimbing: r.nipPembimbing,
          daftarSubStase: r.daftarSubStase || [],
          daftarMahasiswa: r.daftarMahasiswa || [],
          tanggalDiarsipkan: r.tanggalDiarsipkan
        })).sort((a: any, b: any) => b.tanggalMulai.localeCompare(a.tanggalMulai));
      }

      // 3. Resolve Stats
      const totalStaseSelesai = resolvedRiwayat.length;
      let totalStaseSedangBerjalan = 0;
      let totalStaseMendatang = 0;

      if (resolvedKelompok?.daftarJadwal) {
        resolvedKelompok.daftarJadwal.forEach(j => {
          if (j.status === 'Sedang Berjalan') totalStaseSedangBerjalan++;
          else if (j.status === 'Mendatang') totalStaseMendatang++;
        });
      }

      const mergedData: MahasiswaDetail = {
        ...data,
        kelompokDetail: resolvedKelompok,
        riwayatStase: resolvedRiwayat,
        statistik: {
          totalStaseSelesai,
          totalStaseSedangBerjalan,
          totalStaseMendatang
        }
      };

      setMahasiswa(mergedData);
    } catch (err: any) {
      console.error('Failed to fetch mahasiswa details:', err);
      if (err.status === 404) {
        setError('Data mahasiswa tidak ditemukan.');
      } else if (err.status === 403) {
        setError('Anda tidak memiliki akses untuk melihat data mahasiswa ini.');
      } else {
        setError('Gagal memuat detail mahasiswa dari server.');
      }
    } finally {
      setLoading(false);
    }
  }, [mahasiswaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load Tahun Ajaran for Edit Modal if Admin
  const openEditModal = async () => {
    if (!mahasiswa) return;
    setEditForm({
      nim: mahasiswa.nim,
      nama: mahasiswa.nama,
      idTahunAjaran: mahasiswa.idTahunAjaran || 0
    });
    setEditErrors({});
    setShowEditModal(true);

    if (tahunAjarans.length === 0) {
      try {
        const tas = await tahunAjaranApi.getAll();
        setTahunAjarans(tas);
      } catch (err) {
        console.error('Failed to fetch tahun ajaran:', err);
      }
    }
  };

  const saveEdit = async () => {
    if (!mahasiswa) return;
    try {
      setSavingEdit(true);
      setEditErrors({});
      await mahasiswaApi.update(mahasiswa.id, {
        id: mahasiswa.id,
        nim: editForm.nim,
        nama: editForm.nama,
        idTahunAjaran: editForm.idTahunAjaran
      });
      setShowEditModal(false);
      await fetchData();
    } catch (err: any) {
      if (err?.status === 400 && err?.errors) {
        setEditErrors(err.errors);
      } else {
        setError('Gagal memperbarui data mahasiswa.');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useDefaultPassword && customPassword.length < 5) {
      setResetPasswordError('Password baru minimal 5 karakter.');
      return;
    }

    try {
      setResetPasswordLoading(true);
      setResetPasswordError(null);
      const pwdToSet = useDefaultPassword ? undefined : customPassword.trim();
      const res = await mahasiswaApi.resetPassword(mahasiswaId, pwdToSet);
      setResetPasswordSuccess(res.message || 'Password mahasiswa berhasil direset!');
      setTimeout(() => {
        setShowResetPasswordModal(false);
        setResetPasswordSuccess(null);
        setCustomPassword('');
        setUseDefaultPassword(true);
      }, 2000);
    } catch (err: any) {
      setResetPasswordError(err?.errors?.password || err?.message || 'Gagal mereset password.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Filtered History
  const filteredRiwayat = (mahasiswa?.riwayatStase || []).filter(r => {
    const term = historySearch.toLowerCase();
    return (
      r.namaStase.toLowerCase().includes(term) ||
      r.namaKelompok.toLowerCase().includes(term) ||
      r.tahunAjaran.toLowerCase().includes(term) ||
      (r.namaPembimbing && r.namaPembimbing.toLowerCase().includes(term))
    );
  });

  return (
    <Layout>
      {/* Printable Title (visible only on print) */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
          Lembar Riwayat & Jadwal Stase Mahasiswa KOAS
        </h1>
        <p className="text-xs text-slate-500 mt-1">Fakultas Kedokteran Hewan - Sistem Penjadwalan KOAS</p>
      </div>

      {/* Hero Header Card (Hidden on Print) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-900 to-blue-800 rounded-2xl p-6 sm:p-7 text-white shadow-xl mb-6 animate-fade-in-down print:hidden">
        {/* Decorative watermark */}
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none transform rotate-12">
          <MahasiswaIcon className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/mahasiswa')}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all border border-white/10 shadow-sm cursor-pointer flex-shrink-0"
              title="Kembali ke Kelola Mahasiswa"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <MahasiswaIcon className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Detail Mahasiswa
              </h1>
              <p className="text-sm text-blue-100/90 mt-0.5">
                Informasi profil akademik, kelompok rotasi, dan riwayat stase koas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <Tooltip content="Muat ulang data" position="bottom">
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl transition-all border border-white/15 shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </Tooltip>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium rounded-xl border border-white/15 transition-all shadow-sm flex items-center gap-2 text-sm cursor-pointer backdrop-blur-sm"
            >
              <PrintIcon className="w-4 h-4 text-blue-200" />
              <span>Cetak PDF</span>
            </button>

            {isAdmin && mahasiswa && (
              <>
                <button
                  onClick={() => {
                    setShowResetPasswordModal(true);
                    setUseDefaultPassword(true);
                    setCustomPassword('');
                    setResetPasswordError(null);
                    setResetPasswordSuccess(null);
                  }}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold rounded-xl border border-white/15 shadow-sm transition-all duration-200 text-sm flex items-center gap-2 cursor-pointer backdrop-blur-sm"
                  title="Reset password akun mahasiswa ini"
                >
                  <LockIcon className="w-4 h-4 text-amber-300" />
                  <span>Reset Password</span>
                </button>

                <button
                  onClick={openEditModal}
                  className="px-4 py-2.5 bg-white hover:bg-blue-50 active:scale-95 text-primary-900 font-bold rounded-xl shadow-md transition-all duration-200 text-sm flex items-center gap-2 cursor-pointer"
                >
                  <EditIcon className="w-4 h-4 text-primary-800" />
                  <span>Edit Mahasiswa</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 animate-fade-in-down">
          <span className="text-red-500 text-xl">⚠️</span>
          <p className="text-sm font-medium text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg">✕</button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-16 text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Memuat data lengkap mahasiswa...</p>
          <p className="text-xs text-slate-400 mt-1">Mengambil profil, kelompok, dan riwayat stase</p>
        </div>
      ) : !mahasiswa ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <MahasiswaIcon className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Mahasiswa Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Data mahasiswa dengan ID tersebut tidak tersedia di sistem.</p>
          <button
            onClick={() => navigate('/mahasiswa')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all"
          >
            Kembali ke Daftar Mahasiswa
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero Profile Card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                {/* Avatar with Gradient */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20 border-2 border-white">
                  {mahasiswa.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                      NIM: {mahasiswa.nim}
                    </span>
                    {mahasiswa.tahunAjaran ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                        TA {mahasiswa.tahunAjaran.tahun} - {mahasiswa.tahunAjaran.semester}
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500">
                        Belum ditentukan TA
                      </span>
                    )}
                    {mahasiswa.user && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        Akun: {mahasiswa.user.name} ({mahasiswa.user.role})
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-primary-900 tracking-tight">{mahasiswa.nama}</h2>
                  <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Program Studi Pendidikan Profesi Dokter Hewan (KOAS)</span>
                  </p>
                </div>
              </div>

              {/* Current Kelompok Pill */}
              <div className="w-full md:w-auto p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200/80 min-w-[240px]">
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1.5">
                  <KelompokIcon className="w-4 h-4 text-blue-500" />
                  Status Kelompok Saat Ini
                </p>
                {mahasiswa.kelompokDetail ? (
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold text-primary-900">
                        {mahasiswa.kelompokDetail.nama}
                      </span>
                      <button
                        onClick={() => navigate(`/kelompok/${mahasiswa.kelompokDetail?.id}`)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
                      >
                        Buka Kelompok →
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {mahasiswa.kelompokDetail.daftarAnggota.length} Anggota Mahasiswa
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Belum Terdaftar di Kelompok
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Stase Selesai */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100">
                <HistoryIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stase Selesai</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-800">{mahasiswa.statistik?.totalStaseSelesai || 0}</span>
                  <span className="text-xs text-slate-400 font-medium">Telah Diarsip</span>
                </div>
              </div>
            </div>

            {/* Stat 2: Sedang Berjalan */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100 relative">
                <JadwalIcon className="w-6 h-6" />
                {(mahasiswa.statistik?.totalStaseSedangBerjalan || 0) > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sedang Berjalan</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-800">{mahasiswa.statistik?.totalStaseSedangBerjalan || 0}</span>
                  <span className="text-xs text-slate-400 font-medium">Stase Aktif</span>
                </div>
              </div>
            </div>

            {/* Stat 3: Stase Mendatang */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm border border-amber-100">
                <StaseIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stase Mendatang</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-800">{mahasiswa.statistik?.totalStaseMendatang || 0}</span>
                  <span className="text-xs text-slate-400 font-medium">Terjadwal</span>
                </div>
              </div>
            </div>

            {/* Stat 4: Kelompok */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm border border-purple-100">
                <KelompokIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelompok</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-slate-800 truncate max-w-[140px]">
                    {mahasiswa.kelompokDetail?.nama || 'Belum Ada'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Hidden on Print) */}
          <div className="border-b border-slate-200/80 flex items-center gap-2 print:hidden">
            <button
              onClick={() => setActiveTab('jadwal')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'jadwal'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <JadwalIcon className="w-4 h-4" />
              <span>Jadwal Stase Aktif & Terjadwal</span>
              {mahasiswa.kelompokDetail?.daftarJadwal?.length ? (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-bold">
                  {mahasiswa.kelompokDetail.daftarJadwal.length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('riwayat')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'riwayat'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <HistoryIcon className="w-4 h-4" />
              <span>Riwayat Kelompok & Stase Selesai</span>
              {mahasiswa.riwayatStase?.length ? (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-bold">
                  {mahasiswa.riwayatStase.length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('kelompok')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'kelompok'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <KelompokIcon className="w-4 h-4" />
              <span>Rekan Satu Kelompok</span>
              {mahasiswa.kelompokDetail?.daftarAnggota?.length ? (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 font-bold">
                  {mahasiswa.kelompokDetail.daftarAnggota.length}
                </span>
              ) : null}
            </button>
          </div>

          {/* TAB 1: Jadwal Stase Aktif & Terjadwal */}
          {(activeTab === 'jadwal' || typeof window === 'undefined') && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                <div>
                  <h3 className="text-base font-bold text-primary-900 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-blue-600 rounded-full" />
                    Jadwal Stase Kelompok Aktif
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar seluruh stase yang sedang atau akan dijalani bersama {mahasiswa.kelompokDetail ? mahasiswa.kelompokDetail.nama : 'kelompok'}
                  </p>
                </div>
                {mahasiswa.kelompokDetail && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 self-start sm:self-auto">
                    {mahasiswa.kelompokDetail.nama}
                  </span>
                )}
              </div>

              {!mahasiswa.kelompokDetail ? (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <KelompokIcon className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-800">Mahasiswa Belum Masuk Kelompok</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    Mahasiswa ini belum terdaftar pada kelompok KOAS aktif manapun. Silakan tambahkan mahasiswa ke kelompok melalui menu Kelola Kelompok.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => navigate('/kelompok')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Buka Kelola Kelompok
                    </button>
                  )}
                </div>
              ) : !mahasiswa.kelompokDetail.daftarJadwal || mahasiswa.kelompokDetail.daftarJadwal.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                    <JadwalIcon className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-800">Belum Ada Jadwal Stase</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Kelompok {mahasiswa.kelompokDetail.nama} belum memiliki jadwal stase yang disusun.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="bg-gradient-to-r from-primary-900 to-blue-800 text-white">
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider w-12">No</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Nama Stase</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Periode Tanggal</th>
                        <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Dosen Pembimbing</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Sub-Stase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mahasiswa.kelompokDetail.daftarJadwal.map((jadwal, index) => {
                        const isCurrent = jadwal.status === 'Sedang Berjalan';
                        const isUpcoming = jadwal.status === 'Mendatang';
                        return (
                          <tr
                            key={jadwal.id}
                            className={`hover:bg-blue-50/40 transition-colors ${
                              isCurrent ? 'bg-emerald-50/30' : ''
                            }`}
                          >
                            <td className="px-5 py-4 text-xs font-medium text-slate-500">{index + 1}</td>

                            {/* Stase */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${
                                  isCurrent ? 'bg-emerald-600' : isUpcoming ? 'bg-blue-600' : 'bg-slate-500'
                                }`}>
                                  <StaseIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-primary-900 block">
                                    {jadwal.namaStase || 'Stase Belum Ditentukan'}
                                  </span>
                                  {jadwal.jumlahHari ? (
                                    <span className="text-xs text-slate-400">Durasi: {jadwal.jumlahHari} hari</span>
                                  ) : null}
                                </div>
                              </div>
                            </td>

                            {/* Periode Tanggal */}
                            <td className="px-5 py-4">
                              <div className="text-xs font-medium text-slate-800">
                                {formatDateDisplay(jadwal.tanggalMulai)} - {formatDateDisplay(jadwal.tanggalSelesai)}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-4 text-center">
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  Sedang Berjalan
                                </span>
                              ) : isUpcoming ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                  Mendatang
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Selesai
                                </span>
                              )}
                            </td>

                            {/* Dosen Pembimbing */}
                            <td className="px-5 py-4">
                              {jadwal.namaPembimbing ? (
                                <div>
                                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                    <DosenIcon className="w-3.5 h-3.5 text-blue-600" />
                                    {jadwal.namaPembimbing}
                                  </span>
                                  {jadwal.nipPembimbing && (
                                    <span className="text-[11px] font-mono text-slate-400 block ml-5">
                                      NIP: {jadwal.nipPembimbing}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-amber-600 italic">Belum ditentukan</span>
                              )}
                            </td>

                            {/* Sub-Stase */}
                            <td className="px-5 py-4">
                              {jadwal.daftarSubStase && jadwal.daftarSubStase.length > 0 ? (
                                <div className="space-y-1">
                                  {jadwal.daftarSubStase.map((sub, sIdx) => (
                                    <div key={sIdx} className="text-xs text-slate-700 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                      <span className="font-medium">{sub.namaSubStase}:</span>
                                      <span className="text-slate-500">{sub.namaPembimbing || 'Belum ada pembimbing'}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
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
          )}

          {/* TAB 2: Riwayat Kelompok & Stase (Completed History) */}
          {(activeTab === 'riwayat' || typeof window === 'undefined') && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/50 to-teal-50/30">
                <div>
                  <h3 className="text-base font-bold text-primary-900 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-emerald-600 rounded-full" />
                    Riwayat Stase Selesai & Kelompok Lampau
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Arsip lengkap seluruh stase yang telah diselesaikan oleh mahasiswa ini
                  </p>
                </div>

                {/* History Search */}
                <div className="relative w-full sm:w-64 print:hidden">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari stase, kelompok, dosen..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 shadow-sm"
                  />
                </div>
              </div>

              {!mahasiswa.riwayatStase || mahasiswa.riwayatStase.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <HistoryIcon className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-800">Belum Ada Riwayat Stase</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Mahasiswa ini belum memiliki riwayat stase yang telah selesai atau diarsipkan oleh sistem.
                  </p>
                </div>
              ) : filteredRiwayat.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm font-medium text-slate-600">Tidak ada riwayat yang cocok dengan pencarian "{historySearch}"</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider w-12">No</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Nama Stase</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Kelompok & Tahun Ajaran</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Periode Selesai</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Dosen Pembimbing Terakhir</th>
                        <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider print:hidden">Rekan Tim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRiwayat.map((riwayat, index) => (
                        <tr key={riwayat.id} className="hover:bg-emerald-50/20 transition-colors">
                          <td className="px-5 py-4 text-xs font-medium text-slate-500">{index + 1}</td>

                          {/* Stase */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-sm">
                                ✓
                              </div>
                              <div>
                                <span className="text-sm font-bold text-primary-900 block">{riwayat.namaStase}</span>
                                {riwayat.daftarSubStase && riwayat.daftarSubStase.length > 0 && (
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Sub-Stase: {riwayat.daftarSubStase.map(s => s.namaSubStase).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Kelompok */}
                          <td className="px-5 py-4">
                            <div>
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-1">
                                {riwayat.namaKelompok}
                              </span>
                              <span className="text-xs text-slate-500 block">
                                TA {riwayat.tahunAjaran}
                              </span>
                            </div>
                          </td>

                          {/* Periode */}
                          <td className="px-5 py-4">
                            <div className="text-xs font-medium text-slate-800">
                              {formatDateDisplay(riwayat.tanggalMulai)} - {formatDateDisplay(riwayat.tanggalSelesai)}
                            </div>
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                              <span>✓</span> Stase Selesai
                            </span>
                          </td>

                          {/* Pembimbing */}
                          <td className="px-5 py-4">
                            {riwayat.namaPembimbing ? (
                              <div>
                                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                  <DosenIcon className="w-3.5 h-3.5 text-blue-600" />
                                  {riwayat.namaPembimbing}
                                </span>
                                {riwayat.nipPembimbing && (
                                  <span className="text-[11px] font-mono text-slate-400 block ml-5">
                                    NIP: {riwayat.nipPembimbing}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Tidak tercatat</span>
                            )}
                          </td>

                          {/* Rekan Tim (Modal Trigger) */}
                          <td className="px-5 py-4 text-center print:hidden">
                            <button
                              onClick={() => setSelectedHistory(riwayat)}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <MahasiswaIcon className="w-3.5 h-3.5" />
                              <span>{riwayat.daftarMahasiswa?.length || 0} Rekan</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Rekan Satu Kelompok Aktif */}
          {(activeTab === 'kelompok' || typeof window === 'undefined') && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-primary-900 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-purple-600 rounded-full" />
                    Anggota Kelompok Aktif: {mahasiswa.kelompokDetail ? mahasiswa.kelompokDetail.nama : 'Belum Ada'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar mahasiswa yang bersama-sama berada dalam kelompok ini
                  </p>
                </div>

                {mahasiswa.kelompokDetail && (
                  <button
                    onClick={() => navigate(`/kelompok/${mahasiswa.kelompokDetail?.id}`)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl hover:shadow-md transition-all self-start sm:self-auto cursor-pointer"
                  >
                    Buka Halaman Detail Kelompok
                  </button>
                )}
              </div>

              {!mahasiswa.kelompokDetail || mahasiswa.kelompokDetail.daftarAnggota.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <KelompokIcon className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-800">Tidak Ada Anggota Kelompok</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Mahasiswa saat ini belum tergabung dalam kelompok manapun.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {mahasiswa.kelompokDetail.daftarAnggota.map(anggota => {
                    const isSelf = anggota.id === mahasiswa.id;
                    return (
                      <div
                        key={anggota.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelf
                            ? 'bg-blue-50/40 border-blue-200 ring-2 ring-blue-500/20'
                            : 'bg-slate-50/50 border-slate-200/80 hover:bg-white hover:shadow-soft'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                            isSelf
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                              : 'bg-gradient-to-br from-slate-400 to-slate-500'
                          }`}>
                            {anggota.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-sm font-bold text-primary-900 truncate">{anggota.nama}</h5>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">{anggota.nim}</p>
                          </div>

                          {!isSelf && (
                            <Tooltip content="Lihat Detail Mahasiswa" position="left">
                              <button
                                onClick={() => navigate(`/mahasiswa/${anggota.id}`)}
                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Teammates from Riwayat */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <MahasiswaIcon className="w-5 h-5" />
                  Rekan Satu Kelompok
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Stase {selectedHistory.namaStase} • {selectedHistory.namaKelompok} ({selectedHistory.tahunAjaran})
                </p>
              </div>
              <button
                onClick={() => setSelectedHistory(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Daftar Mahasiswa yang Mengikuti Stase Ini:
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {selectedHistory.daftarMahasiswa && selectedHistory.daftarMahasiswa.length > 0 ? (
                  selectedHistory.daftarMahasiswa.map((mhs, idx) => {
                    const isCurrentStudent = mhs.nim === mahasiswa?.nim;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          isCurrentStudent
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isCurrentStudent
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {mhs.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              {mhs.nama}
                              {isCurrentStudent && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-600 text-white rounded font-bold">
                                  Mahasiswa Ini
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400">NIM: {mhs.nim}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada rincian mahasiswa tersimpan.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedHistory(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Mahasiswa (Admin) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <EditIcon className="w-5 h-5" />
                  Edit Data Mahasiswa
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">Perbarui informasi nama, NIM, atau tahun ajaran</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* NIM */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIM</label>
                <input
                  type="text"
                  value={editForm.nim}
                  onChange={(e) => setEditForm({ ...editForm, nim: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-mono"
                  placeholder="Masukkan NIM..."
                />
                {editErrors.nim && <p className="text-xs text-red-500 mt-1">{editErrors.nim}</p>}
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Mahasiswa</label>
                <input
                  type="text"
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                  placeholder="Masukkan nama lengkap..."
                />
                {editErrors.nama && <p className="text-xs text-red-500 mt-1">{editErrors.nama}</p>}
              </div>

              {/* Tahun Ajaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                <select
                  value={editForm.idTahunAjaran}
                  onChange={(e) => setEditForm({ ...editForm, idTahunAjaran: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                >
                  <option value={0}>Pilih Tahun Ajaran...</option>
                  {tahunAjarans.map(ta => (
                    <option key={ta.id} value={ta.id}>
                      {ta.tahun} - {ta.semester}
                    </option>
                  ))}
                </select>
                {editErrors.idTahunAjaran && <p className="text-xs text-red-500 mt-1">{editErrors.idTahunAjaran}</p>}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={savingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Reset Password Mahasiswa */}
      {/* ======================================================== */}
      {showResetPasswordModal && mahasiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <LockIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Reset Password Mahasiswa</h3>
                  <p className="text-xs text-amber-100">Atur ulang kata sandi akun login</p>
                </div>
              </div>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              {/* Account Info Pill */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Mahasiswa:</span>
                  <span className="font-bold text-slate-800">{mahasiswa.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">NIM (Username):</span>
                  <span className="font-mono font-bold text-amber-900">{mahasiswa.nim}</span>
                </div>
              </div>

              {resetPasswordError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {resetPasswordError}
                </div>
              )}

              {resetPasswordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{resetPasswordSuccess}</span>
                </div>
              )}

              {/* Password Mode Options */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Metode Reset Password
                </label>

                {/* Option 1: Default NIM */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    useDefaultPassword
                      ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="pwdChoice"
                    checked={useDefaultPassword}
                    onChange={() => setUseDefaultPassword(true)}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">
                      Gunakan Password Default Sistem
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                      Password baru: <strong>12345</strong>
                    </span>
                  </div>
                </label>

                {/* Option 2: Custom Password */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    !useDefaultPassword
                      ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="pwdChoice"
                    checked={!useDefaultPassword}
                    onChange={() => setUseDefaultPassword(false)}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">
                      Tentukan Password Baru Manual
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Masukkan password khusus pilihan administrator.
                    </span>
                  </div>
                </label>
              </div>

              {/* Custom Password Input */}
              {!useDefaultPassword && (
                <div className="pt-1 animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Baru <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCustomPassword ? 'text' : 'password'}
                      required={!useDefaultPassword}
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="Minimal 5 karakter..."
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomPassword(!showCustomPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCustomPassword ? <EyeOffIcon className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Minimal 5 karakter.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordLoading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {resetPasswordLoading ? 'Memproses...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
