/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { pembimbingApi, staseApi, kelompokApi, riwayatKelompokApi, type PembimbingDetail, type RiwayatBimbinganDosen, type JadwalBimbinganDosen } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDateDisplay } from '../utils/holidays';
import { 
  DosenIcon, 
  KelompokIcon, 
  StaseIcon, 
  JadwalIcon, 
  PrintIcon, 
  EditIcon, 
  SearchIcon, 
  HistoryIcon, 
  UserIcon,
  RefreshIcon,
  MahasiswaIcon,
  KoordinatorIcon,
  LockIcon,
  EyeOffIcon,
} from '../components/Icons';
import Tooltip from '../components/Tooltip';

export default function DetailDosenPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dosenId = Number(id);
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'administrator';

  const [dosen, setDosen] = useState<PembimbingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jadwal' | 'riwayat' | 'stase'>('jadwal');

  // Search in history
  const [historySearch, setHistorySearch] = useState('');

  // Selected students modal for history
  const [selectedHistory, setSelectedHistory] = useState<RiwayatBimbinganDosen | null>(null);

  // Selected students modal for active schedule
  const [selectedActiveJadwal, setSelectedActiveJadwal] = useState<JadwalBimbinganDosen | null>(null);

  // Edit Modal State (Admin only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ nip: '', nama: '' });
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
      const [data, allStases, allKelompoks, allRiwayats] = await Promise.all([
        pembimbingApi.get(dosenId),
        staseApi.getAll().catch(() => []),
        kelompokApi.getAll().catch(() => []),
        riwayatKelompokApi.getAll().catch(() => [])
      ]);

      const today = new Date().toISOString().split('T')[0];

      // 1. Resolve Stase Diampu
      const staseDiampuList = (data.daftarStaseDetail && data.daftarStaseDetail.length > 0)
        ? data.daftarStaseDetail
        : allStases.filter(s => 
            s.daftarPembimbing?.some((p: any) => p.id === dosenId || p.nip === data.nip) ||
            (data.daftarStase && data.daftarStase.includes(s.nama))
          ).map(s => ({ id: s.id, nama: s.nama, jumlahHari: s.waktu || 0 }));

      // 2. Resolve Koordinator Stase
      const staseKoordinatorList = (data.koordinatorStaseDetail && data.koordinatorStaseDetail.length > 0)
        ? data.koordinatorStaseDetail
        : allStases.filter(s => 
            s.idKoordinator === dosenId ||
            s.nipKoordinator === data.nip ||
            (s.namaKoordinator && s.namaKoordinator.toLowerCase() === data.nama.toLowerCase()) ||
            (data.koordinatorStase && data.koordinatorStase.includes(s.nama))
          ).map(s => ({ id: s.id, nama: s.nama, jumlahHari: s.waktu || 0 }));

      // 3. Resolve Jadwal Bimbingan (strictly for stases taught by this lecturer or specifically assigned)
      let jadwalList: JadwalBimbinganDosen[] = (data.jadwalBimbingan && data.jadwalBimbingan.length > 0)
        ? data.jadwalBimbingan
        : [];

      if (jadwalList.length === 0 && allKelompoks.length > 0) {
        const staseDiampuNames = new Set((staseDiampuList || []).map(s => s.nama.toLowerCase()));
        const staseKoordinatorNames = new Set((staseKoordinatorList || []).map(s => s.nama.toLowerCase()));

        allKelompoks.forEach(kel => {
          (kel.daftarJadwal || []).forEach(j => {
            const isMain = Boolean(
              (j.idPembimbing && j.idPembimbing === dosenId) ||
              (j.nipPembimbing && data.nip && j.nipPembimbing === data.nip) ||
              (j.namaPembimbing && data.nama && j.namaPembimbing.toLowerCase() === data.nama.toLowerCase())
            );
            const matchingSub = (j.daftarSubStase || []).find((sub: any) => 
              (sub.idPembimbing && sub.idPembimbing === dosenId) ||
              (sub.nipPembimbing && data.nip && sub.nipPembimbing === data.nip) ||
              (sub.namaPembimbing && data.nama && sub.namaPembimbing.toLowerCase() === data.nama.toLowerCase())
            );
            const staseName = j.namaStase?.toLowerCase() || '';
            const isStasePengampu = Boolean(staseName && (staseDiampuNames.has(staseName) || staseKoordinatorNames.has(staseName)));

            // CUKUP TAMPILKAN JADWAL YANG MEMANG DOSEN TERSEBUT ADALAH PENGAMPUNYA
            if (isMain || matchingSub || isStasePengampu) {
              const status = j.tanggalSelesai < today ? 'Selesai' : (j.tanggalMulai <= today && today <= j.tanggalSelesai ? 'Sedang Berjalan' : 'Mendatang');
              let peran: string = 'Dosen Pengampu';
              if (isMain) peran = 'Pembimbing Utama';
              else if (matchingSub) peran = 'Pembimbing Sub-Stase';
              else if (staseKoordinatorNames.has(staseName)) peran = 'Koordinator Stase';

              jadwalList.push({
                id: j.id,
                idKelompok: kel.id,
                namaKelompok: kel.nama,
                tahunAjaran: kel.tahunAjaran,
                idStase: j.idStase ?? undefined,
                namaStase: j.namaStase ?? undefined,
                jumlahHari: (allStases.find(s => s.id === j.idStase)?.waktu) || 0,
                tanggalMulai: j.tanggalMulai,
                tanggalSelesai: j.tanggalSelesai,
                status,
                peran,
                subStaseInfo: matchingSub ? matchingSub.namaSubStase : null,
                daftarMahasiswa: kel.daftarMahasiswa || []
              });
            }
          });
        });
      }

      // 4. Resolve Riwayat Bimbingan (strictly for stases taught by this lecturer or specifically assigned)
      let riwayatList: RiwayatBimbinganDosen[] = (data.riwayatBimbingan && data.riwayatBimbingan.length > 0)
        ? data.riwayatBimbingan
        : [];

      if (riwayatList.length === 0 && allRiwayats.length > 0) {
        const staseDiampuNames = new Set((staseDiampuList || []).map(s => s.nama.toLowerCase()));
        const staseKoordinatorNames = new Set((staseKoordinatorList || []).map(s => s.nama.toLowerCase()));

        allRiwayats.forEach(r => {
          const isMain = Boolean(
            (r.nipPembimbing && data.nip && r.nipPembimbing === data.nip) ||
            (r.namaPembimbing && data.nama && r.namaPembimbing.toLowerCase() === data.nama.toLowerCase())
          );
          const matchingSub = (r.daftarSubStase || []).find((sub: any) => 
            (sub.nipPembimbing && data.nip && sub.nipPembimbing === data.nip) ||
            (sub.namaPembimbing && data.nama && sub.namaPembimbing.toLowerCase() === data.nama.toLowerCase())
          );
          const staseName = r.namaStase?.toLowerCase() || '';
          const isStasePengampu = Boolean(staseName && (staseDiampuNames.has(staseName) || staseKoordinatorNames.has(staseName)));

          // CUKUP TAMPILKAN RIWAYAT YANG MEMANG DOSEN TERSEBUT ADALAH PENGAMPUNYA
          if (isMain || matchingSub || isStasePengampu) {
            let peran: string = 'Dosen Pengampu';
            if (isMain) peran = 'Pembimbing Utama';
            else if (matchingSub) peran = 'Pembimbing Sub-Stase';
            else if (staseKoordinatorNames.has(staseName)) peran = 'Koordinator Stase';

            riwayatList.push({
              id: r.id,
              idJadwalAsal: r.idJadwalAsal,
              namaKelompok: r.namaKelompok,
              tahunAjaran: r.tahunAjaran,
              namaStase: r.namaStase,
              tanggalMulai: r.tanggalMulai,
              tanggalSelesai: r.tanggalSelesai,
              peran,
              subStaseInfo: matchingSub ? matchingSub.namaSubStase : null,
              namaPembimbing: r.namaPembimbing ?? undefined,
              nipPembimbing: r.nipPembimbing ?? undefined,
              daftarSubStase: (r.daftarSubStase || []).map(sub => ({
                namaSubStase: sub.namaSubStase,
                namaPembimbing: sub.namaPembimbing ?? undefined,
                nipPembimbing: sub.nipPembimbing ?? undefined
              })),
              daftarMahasiswa: r.daftarMahasiswa || [],
              tanggalDiarsipkan: r.tanggalDiarsipkan
            });
          }
        });
      }

      const totalBimbinganAktif = jadwalList.filter(j => j.status === 'Sedang Berjalan').length;
      const totalBimbinganMendatang = jadwalList.filter(j => j.status === 'Mendatang').length;
      const totalBimbinganSelesai = riwayatList.length;

      const mergedData: PembimbingDetail = {
        ...data,
        daftarStaseDetail: staseDiampuList,
        koordinatorStaseDetail: staseKoordinatorList,
        jadwalBimbingan: jadwalList.sort((a, b) => a.tanggalMulai.localeCompare(b.tanggalMulai)),
        riwayatBimbingan: riwayatList.sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai)),
        statistik: {
          totalStaseDiampu: staseDiampuList.length,
          totalKoordinatorStase: staseKoordinatorList.length,
          totalBimbinganAktif,
          totalBimbinganMendatang,
          totalBimbinganSelesai
        }
      };

      setDosen(mergedData);
    } catch (err: any) {
      console.error('Failed to fetch dosen details:', err);
      if (err.status === 404) {
        setError('Data dosen tidak ditemukan.');
      } else if (err.status === 403) {
        setError('Anda tidak memiliki akses untuk melihat data dosen ini.');
      } else {
        setError('Gagal memuat detail dosen dari server.');
      }
    } finally {
      setLoading(false);
    }
  }, [dosenId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Edit Modal
  const openEditModal = () => {
    if (!dosen) return;
    setEditForm({
      nip: dosen.nip,
      nama: dosen.nama
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!dosen) return;
    try {
      setSavingEdit(true);
      setEditErrors({});
      await pembimbingApi.update(dosen.id, {
        id: dosen.id,
        nip: editForm.nip,
        nama: editForm.nama
      });
      setShowEditModal(false);
      await fetchData();
    } catch (err: any) {
      if (err?.status === 400 && err?.errors) {
        setEditErrors(err.errors);
      } else {
        setError('Gagal memperbarui data dosen.');
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
      const res = await pembimbingApi.resetPassword(dosenId, pwdToSet);
      setResetPasswordSuccess(res.message || 'Password dosen berhasil direset!');
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
  const filteredRiwayat = (dosen?.riwayatBimbingan || []).filter(r => {
    const term = historySearch.toLowerCase();
    return (
      r.namaStase.toLowerCase().includes(term) ||
      r.namaKelompok.toLowerCase().includes(term) ||
      r.tahunAjaran.toLowerCase().includes(term) ||
      r.peran.toLowerCase().includes(term) ||
      (r.subStaseInfo && r.subStaseInfo.toLowerCase().includes(term))
    );
  });

  return (
    <Layout>
      {/* Printable Title (visible only on print) */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
          Lembar Portofolio & Rekapitulasi Bimbingan Dosen KOAS
        </h1>
        <p className="text-xs text-slate-500 mt-1">Fakultas Kedokteran Hewan - Sistem Penjadwalan KOAS</p>
      </div>

      {/* Hero Header Card (Hidden on Print) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl p-4 sm:p-6 text-white shadow-xl mb-4 sm:mb-6 animate-fade-in-down print:hidden">
        {/* Decorative watermark */}
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none transform rotate-12">
          <DosenIcon className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/dosen')}
              className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all border border-white/10 shadow-sm cursor-pointer shrink-0"
              title="Kembali ke Kelola Dosen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md shrink-0">
              <DosenIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Detail Dosen Pembimbing
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                Informasi profil akademik, stase pengampuan, dan riwayat bimbingan mahasiswa koas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto pt-1 sm:pt-0">
            <div className="flex items-center gap-2 col-span-2 sm:col-auto">
              <Tooltip content="Muat ulang data" position="bottom">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl transition-all border border-white/15 shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </Tooltip>
              <button
                onClick={() => window.print()}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium rounded-xl border border-white/15 transition-all shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm cursor-pointer backdrop-blur-sm"
              >
                <PrintIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
                <span>Cetak PDF</span>
              </button>
            </div>

            {isAdmin && dosen && (
              <>
                <button
                  onClick={() => {
                    setShowResetPasswordModal(true);
                    setUseDefaultPassword(true);
                    setCustomPassword('');
                    setResetPasswordError(null);
                    setResetPasswordSuccess(null);
                  }}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold rounded-xl border border-white/15 shadow-sm transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer backdrop-blur-sm"
                  title="Reset password akun dosen ini"
                >
                  <LockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                  <span>Reset Password</span>
                </button>

                <button
                  onClick={openEditModal}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white hover:bg-emerald-50 active:scale-95 text-emerald-800 font-bold rounded-xl shadow-md transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                >
                  <EditIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                  <span>Edit Dosen</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 animate-fade-in-down">
          <span className="text-red-500 text-xl">⚠️</span>
          <p className="text-xs sm:text-sm font-medium text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg">✕</button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-10 sm:p-16 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3 sm:mb-4" />
          <p className="text-slate-600 font-medium text-sm sm:text-base">Memuat data lengkap dosen...</p>
          <p className="text-xs text-slate-400 mt-1">Mengambil profil, stase pengampuan, dan riwayat bimbingan</p>
        </div>
      ) : !dosen ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-10 sm:p-16 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <DosenIcon className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Dosen Tidak Ditemukan</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5 sm:mb-6">Data dosen dengan ID tersebut tidak tersedia di sistem.</p>
          <button
            onClick={() => navigate('/dosen')}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            Kembali ke Daftar Dosen
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Hero Profile Card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 sm:p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 relative z-10">
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                {/* Avatar with Gradient */}
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-green-600 flex items-center justify-center text-white text-xl sm:text-3xl font-bold shadow-lg shadow-emerald-500/20 border-2 border-white shrink-0">
                  {dosen.nama.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                    <span className="font-mono text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                      NIP: {dosen.nip}
                    </span>
                    {dosen.koordinatorStase && dosen.koordinatorStase.length > 0 && (
                      <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <span className="text-amber-500">★</span> Koordinator {dosen.koordinatorStase.join(', ')}
                      </span>
                    )}
                    {dosen.user && (
                      <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        Akun: {dosen.user.name} ({dosen.user.role})
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-primary-900 tracking-tight truncate">{dosen.nama}</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Dosen Pembimbing Klinik Fakultas Kedokteran Hewan</span>
                  </p>
                </div>
              </div>

              {/* Stase Diampu Summary */}
              <div className="w-full md:w-auto p-3 sm:p-4 rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-slate-200/80 min-w-full sm:min-w-[240px]">
                <p className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1.5">
                  <StaseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                  Stase Pengampuan
                </p>
                {dosen.daftarStase && dosen.daftarStase.length > 0 ? (
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1">
                    {dosen.daftarStase.map(stase => (
                      <span
                        key={stase}
                        className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200/70"
                      >
                        {stase}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-0.5">Belum terdaftar pada stase manapun</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats KPI Cards - 2x2 Grid on Mobile, 4 Cols on Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Stat 1: Stase Diampu */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:shadow-md transition-shadow">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Stase Diampu</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-2xl font-bold text-slate-800">{dosen.statistik?.totalStaseDiampu || 0}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Stase</span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100 shrink-0 self-start sm:self-center">
                <StaseIcon className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>

            {/* Stat 2: Bimbingan Aktif */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:shadow-md transition-shadow">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Bimbingan Aktif</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-2xl font-bold text-slate-800">{dosen.statistik?.totalBimbinganAktif || 0}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Kelompok</span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100 relative shrink-0 self-start sm:self-center">
                <JadwalIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                {(dosen.statistik?.totalBimbinganAktif || 0) > 0 && (
                  <span className="absolute top-1 right-1 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-emerald-500 rounded-full animate-ping" />
                )}
              </div>
            </div>

            {/* Stat 3: Bimbingan Mendatang */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:shadow-md transition-shadow">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Mendatang</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-2xl font-bold text-slate-800">{dosen.statistik?.totalBimbinganMendatang || 0}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Terjadwal</span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm border border-amber-100 shrink-0 self-start sm:self-center">
                <KelompokIcon className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>

            {/* Stat 4: Bimbingan Selesai (Arsip) */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:shadow-md transition-shadow">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Total Selesai</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-2xl font-bold text-slate-800">{dosen.statistik?.totalBimbinganSelesai || 0}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Arsip</span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm border border-purple-100 shrink-0 self-start sm:self-center">
                <HistoryIcon className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Hidden on Print) */}
          <div className="border-b border-slate-200/80 flex items-center gap-1 sm:gap-2 print:hidden overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('jadwal')}
              className={`pb-2.5 sm:pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'jadwal'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <JadwalIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Jadwal Aktif & Mendatang</span>
              {dosen.jadwalBimbingan?.length ? (
                <span className="ml-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs bg-emerald-100 text-emerald-700 font-bold">
                  {dosen.jadwalBimbingan.length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('riwayat')}
              className={`pb-2.5 sm:pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'riwayat'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <HistoryIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Riwayat Bimbingan (Arsip)</span>
              {dosen.riwayatBimbingan?.length ? (
                <span className="ml-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs bg-purple-100 text-purple-700 font-bold">
                  {dosen.riwayatBimbingan.length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('stase')}
              className={`pb-2.5 sm:pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'stase'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <StaseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Stase Diampu & Koordinator</span>
              {dosen.daftarStaseDetail?.length ? (
                <span className="ml-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs bg-blue-100 text-blue-700 font-bold">
                  {dosen.daftarStaseDetail.length}
                </span>
              ) : null}
            </button>
          </div>

          {/* TAB 1: Jadwal Bimbingan Aktif & Terjadwal */}
          {(activeTab === 'jadwal' || typeof window === 'undefined') && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-gradient-to-r from-emerald-50/50 to-teal-50/30">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-primary-900 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-emerald-600 rounded-full" />
                    Jadwal Bimbingan Kelompok Aktif & Mendatang
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    Kelompok mahasiswa yang saat ini sedang atau akan dibimbing oleh dosen ini
                  </p>
                </div>
              </div>

              {!dosen.jadwalBimbingan || dosen.jadwalBimbingan.length === 0 ? (
                <div className="p-10 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <JadwalIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-slate-800">Tidak Ada Jadwal Bimbingan Aktif</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Saat ini belum ada jadwal bimbingan kelompok aktif atau mendatang untuk dosen ini.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile View: Card List (Screens < md) */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {dosen.jadwalBimbingan.map((jadwal, index) => {
                      const isCurrent = jadwal.status === 'Sedang Berjalan';
                      const isUpcoming = jadwal.status === 'Mendatang';
                      return (
                        <div
                          key={jadwal.id}
                          className={`p-3.5 sm:p-4 hover:bg-emerald-50/30 transition-colors ${
                            isCurrent ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          {/* Top Row: Kelompok + Status */}
                          <div className="flex items-start justify-between gap-2.5 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                                  isCurrent ? 'bg-emerald-600' : isUpcoming ? 'bg-blue-600' : 'bg-slate-500'
                                }`}
                              >
                                <StaseIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    #{index + 1}
                                  </span>
                                  <span className="font-bold text-slate-900 text-sm truncate">
                                    {jadwal.namaKelompok}
                                  </span>
                                </div>
                                {jadwal.tahunAjaran && (
                                  <span className="text-[11px] text-slate-400 font-mono block">
                                    TA {jadwal.tahunAjaran}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status badge */}
                            <div className="shrink-0">
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Sedang Berjalan
                                </span>
                              ) : isUpcoming ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                  Mendatang
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Selesai
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle Row: Stase & Periode */}
                          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 mb-2.5 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[11px]">Stase:</span>
                              <span className="font-bold text-slate-800 text-[11px]">
                                {jadwal.namaStase || 'Stase'}{' '}
                                {jadwal.jumlahHari ? `(${jadwal.jumlahHari} hari)` : ''}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[11px]">Periode:</span>
                              <span className="font-medium text-slate-700 text-[11px]">
                                {formatDateDisplay(jadwal.tanggalMulai)} — {formatDateDisplay(jadwal.tanggalSelesai)}
                              </span>
                            </div>
                          </div>

                          {/* Bottom Row: Peran + Button Mahasiswa */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <div>
                              {jadwal.peran === 'Pembimbing Utama' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  Pembimbing Utama
                                </span>
                              ) : jadwal.peran === 'Koordinator Stase' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  ★ Koordinator
                                </span>
                              ) : jadwal.peran === 'Pembimbing Sub-Stase' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 truncate max-w-[150px]">
                                  Sub: {jadwal.subStaseInfo || jadwal.namaStase}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Pengampu
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => setSelectedActiveJadwal(jadwal)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                            >
                              <MahasiswaIcon className="w-3.5 h-3.5" />
                              <span>{jadwal.daftarMahasiswa?.length || 0} Mahasiswa</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View (Hidden on mobile, screens >= md) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-max">
                      <thead>
                        <tr className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
                          <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider w-12">No</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Kelompok & Tahun Ajaran</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Stase</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Periode Tanggal</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Peran Bimbingan</th>
                          <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">Status</th>
                          <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider print:hidden">Mahasiswa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dosen.jadwalBimbingan.map((jadwal, index) => {
                          const isCurrent = jadwal.status === 'Sedang Berjalan';
                          const isUpcoming = jadwal.status === 'Mendatang';
                          return (
                            <tr
                              key={jadwal.id}
                              className={`hover:bg-emerald-50/40 transition-colors ${
                                isCurrent ? 'bg-emerald-50/30' : ''
                              }`}
                            >
                              <td className="px-5 py-4 text-xs font-medium text-slate-500">{index + 1}</td>

                              {/* Kelompok */}
                              <td className="px-5 py-4">
                                <div>
                                  <span className="text-sm font-bold text-primary-900 block">
                                    {jadwal.namaKelompok}
                                  </span>
                                  {jadwal.tahunAjaran && (
                                    <span className="text-xs text-slate-400 block">
                                      TA {jadwal.tahunAjaran}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Stase */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${
                                    isCurrent ? 'bg-emerald-600' : isUpcoming ? 'bg-blue-600' : 'bg-slate-500'
                                  }`}>
                                    <StaseIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-800 block">
                                      {jadwal.namaStase || 'Stase'}
                                    </span>
                                    {jadwal.jumlahHari && (
                                      <span className="text-[11px] text-slate-400">
                                        {jadwal.jumlahHari} hari
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Periode */}
                              <td className="px-5 py-4">
                                <div className="text-xs font-medium text-slate-800">
                                  {formatDateDisplay(jadwal.tanggalMulai)} - {formatDateDisplay(jadwal.tanggalSelesai)}
                                </div>
                              </td>

                              {/* Peran */}
                              <td className="px-5 py-4">
                                {jadwal.peran === 'Pembimbing Utama' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Pembimbing Utama
                                  </span>
                                ) : jadwal.peran === 'Koordinator Stase' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    ★ Koordinator
                                  </span>
                                ) : jadwal.peran === 'Pembimbing Sub-Stase' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    Sub-Stase: {jadwal.subStaseInfo || jadwal.namaStase}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Pengampu Stase
                                  </span>
                                )}
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

                              {/* Mahasiswa Bimbingan */}
                              <td className="px-5 py-4 text-center print:hidden">
                                <button
                                  onClick={() => setSelectedActiveJadwal(jadwal)}
                                  className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <MahasiswaIcon className="w-3.5 h-3.5" />
                                  <span>{jadwal.daftarMahasiswa?.length || 0} Mahasiswa</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Riwayat Bimbingan Selesai (Arsip) */}
          {(activeTab === 'riwayat' || typeof window === 'undefined') && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-50/50 to-indigo-50/30">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-primary-900 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-purple-600 rounded-full" />
                    Riwayat Bimbingan Kelompok yang Telah Selesai
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    Arsip lengkap bimbingan stase yang telah diselesaikan oleh dosen ini
                  </p>
                </div>

                {/* History Search */}
                <div className="relative w-full sm:w-64 print:hidden">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari stase, kelompok, TA..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 shadow-sm"
                  />
                </div>
              </div>

              {!dosen.riwayatBimbingan || dosen.riwayatBimbingan.length === 0 ? (
                <div className="p-10 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <HistoryIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-slate-800">Belum Ada Riwayat Bimbingan</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Dosen ini belum memiliki riwayat bimbingan kelompok yang selesai diarsipkan di sistem.
                  </p>
                </div>
              ) : filteredRiwayat.length === 0 ? (
                <div className="p-10 sm:p-12 text-center">
                  <p className="text-xs sm:text-sm font-medium text-slate-600">Tidak ada riwayat bimbingan yang cocok dengan pencarian "{historySearch}"</p>
                </div>
              ) : (
                <>
                  {/* Mobile View: Card List (Screens < md) */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {filteredRiwayat.map((riwayat, index) => (
                      <div key={riwayat.id} className="p-3.5 sm:p-4 hover:bg-purple-50/20 transition-colors">
                        <div className="flex items-start justify-between gap-2.5 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                              ✓
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                                  #{index + 1}
                                </span>
                                <span className="font-bold text-slate-900 text-sm truncate">
                                  {riwayat.namaStase}
                                </span>
                              </div>
                              {riwayat.subStaseInfo && (
                                <span className="text-[11px] text-purple-600 font-semibold block mt-0.5">
                                  Sub-Stase: {riwayat.subStaseInfo}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            {riwayat.namaKelompok}
                          </span>
                        </div>

                        <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 mb-2.5 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Tahun Ajaran:</span>
                            <span className="font-semibold text-slate-700">TA {riwayat.tahunAjaran}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Periode:</span>
                            <span className="font-medium text-slate-700">
                              {formatDateDisplay(riwayat.tanggalMulai)} — {formatDateDisplay(riwayat.tanggalSelesai)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            riwayat.peran === 'Pembimbing Utama'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : riwayat.peran === 'Koordinator Stase'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : riwayat.peran === 'Pembimbing Sub-Stase'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {riwayat.peran === 'Koordinator Stase' ? '★ Koordinator' : (riwayat.peran || 'Dosen Pengampu')}
                          </span>

                          <button
                            onClick={() => setSelectedHistory(riwayat)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                          >
                            <MahasiswaIcon className="w-3.5 h-3.5" />
                            <span>{riwayat.daftarMahasiswa?.length || 0} Mahasiswa</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (Hidden on mobile, screens >= md) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-max">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white">
                          <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider w-12">No</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Nama Stase</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Kelompok & Tahun Ajaran</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Periode Selesai</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Peran Bimbingan</th>
                          <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider print:hidden">Mahasiswa Bimbingan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRiwayat.map((riwayat, index) => (
                          <tr key={riwayat.id} className="hover:bg-purple-50/20 transition-colors">
                            <td className="px-5 py-4 text-xs font-medium text-slate-500">{index + 1}</td>

                            {/* Stase */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shadow-sm">
                                  ✓
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-primary-900 block">{riwayat.namaStase}</span>
                                  {riwayat.subStaseInfo && (
                                    <span className="text-[11px] text-purple-600 font-semibold block mt-0.5">
                                      Sub-Stase: {riwayat.subStaseInfo}
                                    </span>
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
                              <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1 mt-0.5">
                                <span>✓</span> Selesai Dibimbing
                              </span>
                            </td>

                            {/* Peran */}
                            <td className="px-5 py-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                riwayat.peran === 'Pembimbing Utama'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : riwayat.peran === 'Koordinator Stase'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : riwayat.peran === 'Pembimbing Sub-Stase'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {riwayat.peran === 'Koordinator Stase' ? '★ Koordinator' : (riwayat.peran || 'Dosen Pengampu')}
                              </span>
                            </td>

                            {/* Mahasiswa Bimbingan Modal Trigger */}
                            <td className="px-5 py-4 text-center print:hidden">
                              <button
                                onClick={() => setSelectedHistory(riwayat)}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-purple-50 text-purple-700 hover:text-purple-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <MahasiswaIcon className="w-3.5 h-3.5" />
                                <span>{riwayat.daftarMahasiswa?.length || 0} Mahasiswa</span>
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
          )}

          {/* TAB 3: Stase Diampu & Koordinator */}
          {(activeTab === 'stase' || typeof window === 'undefined') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Koordinator Stase Card */}
              <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 sm:p-6">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3.5 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                    <KoordinatorIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-primary-900">Koordinator Stase</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500">Stase yang dikoordinatori oleh dosen ini</p>
                  </div>
                </div>

                {!dosen.koordinatorStaseDetail || dosen.koordinatorStaseDetail.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center text-slate-400">
                    <p className="text-xs">Dosen ini saat ini tidak menjadi koordinator pada stase manapun.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 sm:space-y-3">
                    {dosen.koordinatorStaseDetail.map(stase => (
                      <div
                        key={stase.id}
                        className="p-3 sm:p-4 rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-50/40 to-orange-50/20 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <span className="text-amber-500 text-base sm:text-lg shrink-0">★</span>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-primary-900 truncate">{stase.nama}</h4>
                            <p className="text-[11px] sm:text-xs text-slate-500">Durasi: {stase.jumlahHari} hari kerja</p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/stase/${stase.id}`)}
                          className="text-xs text-amber-700 hover:text-amber-900 font-semibold hover:underline cursor-pointer shrink-0"
                        >
                          Lihat Stase →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stase Diampu Card */}
              <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 sm:p-6">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3.5 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                    <StaseIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-primary-900">Stase yang Diampu</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500">Daftar stase tempat dosen ini terdaftar mengajar</p>
                  </div>
                </div>

                {!dosen.daftarStaseDetail || dosen.daftarStaseDetail.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center text-slate-400">
                    <p className="text-xs">Belum ada stase yang terdaftar untuk dosen ini.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 sm:space-y-3">
                    {dosen.daftarStaseDetail.map(stase => (
                      <div
                        key={stase.id}
                        className="p-3 sm:p-4 rounded-xl border border-emerald-200/70 bg-emerald-50/30 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                            <StaseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-primary-900 truncate">{stase.nama}</h4>
                            <p className="text-[11px] sm:text-xs text-slate-500">Durasi: {stase.jumlahHari} hari kerja</p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/stase/${stase.id}`)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold hover:underline cursor-pointer shrink-0"
                        >
                          Lihat Stase →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Mahasiswa Bimbingan dari Riwayat */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 truncate">
                  <MahasiswaIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  Mahasiswa Bimbingan
                </h3>
                <p className="text-[11px] sm:text-xs text-purple-100 mt-0.5 truncate">
                  Stase {selectedHistory.namaStase} • {selectedHistory.namaKelompok} ({selectedHistory.tahunAjaran})
                </p>
              </div>
              <button
                onClick={() => setSelectedHistory(null)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs sm:text-sm transition-all shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 sm:mb-3">
                Daftar Mahasiswa yang Dibimbing:
              </p>
              <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                {selectedHistory.daftarMahasiswa && selectedHistory.daftarMahasiswa.length > 0 ? (
                  selectedHistory.daftarMahasiswa.map((mhs, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border bg-slate-50 border-slate-200/80"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {mhs.nama.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{mhs.nama}</p>
                          <p className="text-[11px] font-mono text-slate-400">NIM: {mhs.nim}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada rincian mahasiswa tersimpan.</p>
                )}
              </div>

              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedHistory(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Mahasiswa Bimbingan dari Jadwal Aktif */}
      {selectedActiveJadwal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 truncate">
                  <MahasiswaIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  Mahasiswa Bimbingan Aktif
                </h3>
                <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5 truncate">
                  {selectedActiveJadwal.namaKelompok} • Stase {selectedActiveJadwal.namaStase}
                </p>
              </div>
              <button
                onClick={() => setSelectedActiveJadwal(null)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs sm:text-sm transition-all shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 sm:mb-3">
                Daftar Mahasiswa Anggota Kelompok:
              </p>
              <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                {selectedActiveJadwal.daftarMahasiswa && selectedActiveJadwal.daftarMahasiswa.length > 0 ? (
                  selectedActiveJadwal.daftarMahasiswa.map((mhs) => (
                    <div
                      key={mhs.id}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border bg-emerald-50/40 border-emerald-200 gap-2"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                          {mhs.nama.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{mhs.nama}</p>
                          <p className="text-[11px] font-mono text-slate-400">NIM: {mhs.nim}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedActiveJadwal(null);
                          navigate(`/mahasiswa/${mhs.id}`);
                        }}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold hover:underline cursor-pointer shrink-0"
                      >
                        Detail →
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada anggota dalam kelompok ini.</p>
                )}
              </div>

              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedActiveJadwal(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Dosen (Admin) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-up">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-green-700 text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 truncate">
                  <EditIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  Edit Data Dosen
                </h3>
                <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5 truncate">Perbarui informasi NIP atau nama dosen</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs sm:text-sm transition-all shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
              {/* NIP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIP</label>
                <input
                  type="text"
                  value={editForm.nip}
                  onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })}
                  className="w-full px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all font-mono"
                  placeholder="Masukkan NIP..."
                />
                {editErrors.nip && <p className="text-xs text-red-500 mt-1">{editErrors.nip}</p>}
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className="w-full px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                  placeholder="Contoh: Drg. Nama Dosen, Sp.KG"
                />
                {editErrors.nama && <p className="text-xs text-red-500 mt-1">{editErrors.nama}</p>}
              </div>

              <div className="pt-3 sm:pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={savingEdit}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Reset Password Dosen */}
      {/* ======================================================== */}
      {showResetPasswordModal && dosen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                  <LockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-white truncate">Reset Password Dosen</h3>
                  <p className="text-[11px] sm:text-xs text-amber-100 truncate">Atur ulang kata sandi akun dosen pembimbing</p>
                </div>
              </div>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleResetPassword} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
              {/* Account Info Pill */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Dosen:</span>
                  <span className="font-bold text-slate-800 truncate ml-2">{dosen.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">NIP (Username):</span>
                  <span className="font-mono font-bold text-amber-900">{dosen.nip}</span>
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

                {/* Option 1: Default NIP */}
                <label
                  className={`flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    useDefaultPassword
                      ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="pwdChoiceDosen"
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
                  className={`flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    !useDefaultPassword
                      ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="pwdChoiceDosen"
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
                      className="w-full pl-3.5 pr-10 py-2 sm:py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white transition"
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
              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordLoading}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
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
