/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  SettingsIcon,
  QuestionCircleIcon,
  PhoneIcon,
  TahunAjaranIcon,
  SearchIcon,
  RefreshIcon,
  EditIcon,
  DeleteIcon,
  SaveIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  InfoIcon,
} from '../components/Icons';
import {
  pengaturanSistemApi,
  type FaqItemDto,
  type KontakSettingInput,
  type HariLiburDto,
} from '../services/api';
import { formatDateDisplay, setDynamicHolidays } from '../utils/holidays';

type ActiveTab = 'faq' | 'kontak' | 'kalender';

function formatWhatsAppUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export default function PengaturanSistemPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (() => {
    const t = searchParams.get('tab');
    if (t === 'kontak' || t === 'kalender' || t === 'faq') return t;
    return 'faq';
  })();

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'kontak' || t === 'kalender' || t === 'faq') {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
    setSuccessMessage('');
    setPageError('');
  };

  // Global feedback
  const [successMessage, setSuccessMessage] = useState('');
  const [pageError, setPageError] = useState('');

  // =========================================================
  // FAQ STATE
  // =========================================================
  const [faqList, setFaqList] = useState<FaqItemDto[]>([]);
  const [loadingFaq, setLoadingFaq] = useState(true);
  const [faqSearch, setFaqSearch] = useState('');
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItemDto | null>(null);
  const [faqForm, setFaqForm] = useState({
    pertanyaan: '',
    jawaban: '',
    urutan: 1,
    isAktif: true,
  });
  const [faqErrors, setFaqErrors] = useState<Record<string, string>>({});
  const [savingFaq, setSavingFaq] = useState(false);

  // =========================================================
  // KONTAK STATE
  // =========================================================
  const [kontakForm, setKontakForm] = useState<KontakSettingInput>({
    judul: 'Kontak Administrator',
    subJudul: 'Layanan Bantuan Sistem E-Scheduling KOAS FKKH UNDANA',
    lokasi: 'Gedung Dekanat FKKH Universitas Nusa Cendana',
    email: 'fkkh@undana.ac.id',
    telepon: '',
    whatsApp: '',
    jamPelayanan: 'Senin - Jumat, 08:00 - 16:00 WITA',
    catatan: '',
  });
  const [loadingKontak, setLoadingKontak] = useState(true);
  const [savingKontak, setSavingKontak] = useState(false);
  const [kontakErrors, setKontakErrors] = useState<Record<string, string>>({});

  // =========================================================
  // KALENDER / HARI LIBUR STATE
  // =========================================================
  const [hariLiburList, setHariLiburList] = useState<HariLiburDto[]>([]);
  const [loadingLibur, setLoadingLibur] = useState(true);
  const [liburSearch, setLiburSearch] = useState('');
  const [filterTahun, setFilterTahun] = useState<string>(String(new Date().getFullYear()));
  const [filterSumber, setFilterSumber] = useState<'all' | 'API' | 'Manual'>('all');
  const [syncYears, setSyncYears] = useState<number[]>([2026, 2027]);
  const [syncYear, setSyncYear] = useState<number>(new Date().getFullYear());
  const [syncingLibur, setSyncingLibur] = useState(false);
  const [showLiburModal, setShowLiburModal] = useState(false);
  const [editingLibur, setEditingLibur] = useState<HariLiburDto | null>(null);
  const [isRentangLibur, setIsRentangLibur] = useState(false);
  const [liburForm, setLiburForm] = useState({
    tanggalMulai: '',
    tanggalSelesai: '',
    nama: '',
    keterangan: '',
    tipe: 'Kampus',
  });
  const [liburErrors, setLiburErrors] = useState<Record<string, string>>({});
  const [savingLibur, setSavingLibur] = useState(false);

  // =========================================================
  // DELETE MODAL STATE (SHARED FOR FAQ & HARI LIBUR)
  // =========================================================
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'faq' | 'libur';
    id: number;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFaq = useCallback(async () => {
    try {
      setLoadingFaq(true);
      const data = await pengaturanSistemApi.getFaqAdmin();
      setFaqList(data);
    } catch (err: any) {
      setPageError(err?.message || 'Gagal memuat daftar FAQ.');
    } finally {
      setLoadingFaq(false);
    }
  }, []);

  const fetchKontak = useCallback(async () => {
    try {
      setLoadingKontak(true);
      const data = await pengaturanSistemApi.getKontak();
      setKontakForm({
        judul: data.judul || 'Kontak Administrator',
        subJudul: data.subJudul || 'Layanan Bantuan Sistem E-Scheduling KOAS FKKH UNDANA',
        lokasi: data.lokasi || '',
        email: data.email || '',
        telepon: data.telepon || '',
        whatsApp: data.whatsApp || '',
        jamPelayanan: data.jamPelayanan || '',
        catatan: data.catatan || '',
      });
    } catch (err: any) {
      setPageError(err?.message || 'Gagal memuat pengaturan kontak.');
    } finally {
      setLoadingKontak(false);
    }
  }, []);

  const fetchHariLibur = useCallback(async () => {
    try {
      setLoadingLibur(true);
      const data = await pengaturanSistemApi.getHariLibur();
      setHariLiburList(data);
      setDynamicHolidays(data);
    } catch (err: any) {
      setPageError(err?.message || 'Gagal memuat data hari libur.');
    } finally {
      setLoadingLibur(false);
    }
  }, []);

  const fetchSyncYears = useCallback(async () => {
    try {
      const res = await pengaturanSistemApi.getHariLiburTahunTersedia();
      if (Array.isArray(res.years) && res.years.length > 0) {
        setSyncYears(res.years);
        const nowYear = new Date().getFullYear();
        setSyncYear(res.years.includes(nowYear) ? nowYear : res.years[res.years.length - 1]);
      }
    } catch {
      // Gunakan fallback tahun default jika gagal mengambil daftar tahun API
    }
  }, []);

  useEffect(() => {
    fetchFaq();
    fetchKontak();
    fetchHariLibur();
    fetchSyncYears();
  }, [fetchFaq, fetchKontak, fetchHariLibur, fetchSyncYears]);

  // =========================================================
  // FAQ HANDLERS
  // =========================================================
  const openCreateFaq = () => {
    const nextUrutan = faqList.length > 0 ? Math.max(...faqList.map(x => x.urutan)) + 1 : 1;
    setEditingFaq(null);
    setFaqForm({
      pertanyaan: '',
      jawaban: '',
      urutan: nextUrutan,
      isAktif: true,
    });
    setFaqErrors({});
    setShowFaqModal(true);
  };

  const openEditFaq = (item: FaqItemDto) => {
    setEditingFaq(item);
    setFaqForm({
      pertanyaan: item.pertanyaan,
      jawaban: item.jawaban,
      urutan: item.urutan,
      isAktif: item.isAktif,
    });
    setFaqErrors({});
    setShowFaqModal(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!faqForm.pertanyaan.trim()) errs.pertanyaan = 'Pertanyaan FAQ wajib diisi.';
    if (!faqForm.jawaban.trim()) errs.jawaban = 'Jawaban FAQ wajib diisi.';
    if (Object.keys(errs).length > 0) {
      setFaqErrors(errs);
      return;
    }

    try {
      setSavingFaq(true);
      setPageError('');
      const payload = {
        pertanyaan: faqForm.pertanyaan.trim(),
        jawaban: faqForm.jawaban.trim(),
        urutan: Number(faqForm.urutan) > 0 ? Number(faqForm.urutan) : 1,
        isAktif: faqForm.isAktif,
      };

      if (editingFaq) {
        await pengaturanSistemApi.updateFaq(editingFaq.id, payload);
        setSuccessMessage('Item FAQ berhasil diperbarui.');
      } else {
        await pengaturanSistemApi.createFaq(payload);
        setSuccessMessage('Item FAQ baru berhasil ditambahkan.');
      }

      setShowFaqModal(false);
      await fetchFaq();
    } catch (err: any) {
      if (err?.errors) setFaqErrors(err.errors);
      else setFaqErrors({ general: err?.message || 'Gagal menyimpan item FAQ.' });
    } finally {
      setSavingFaq(false);
    }
  };

  const handleToggleFaqStatus = async (item: FaqItemDto) => {
    try {
      setPageError('');
      await pengaturanSistemApi.updateFaq(item.id, {
        pertanyaan: item.pertanyaan,
        jawaban: item.jawaban,
        urutan: item.urutan,
        isAktif: !item.isAktif,
      });
      setSuccessMessage(`FAQ #${item.urutan} ${!item.isAktif ? 'diaktifkan' : 'disembunyikan'} dari halaman login.`);
      await fetchFaq();
    } catch (err: any) {
      setPageError(err?.message || 'Gagal mengubah status FAQ.');
    }
  };

  const handleMoveFaqOrder = async (index: number, direction: -1 | 1) => {
    const sorted = [...faqList].sort((a, b) => a.urutan - b.urutan || a.id - b.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const swapWith = sorted[targetIndex];
    const currentOrder = current.urutan === swapWith.urutan ? index + 1 : current.urutan;
    const swapOrder = current.urutan === swapWith.urutan ? targetIndex + 1 : swapWith.urutan;

    try {
      setPageError('');
      await Promise.all([
        pengaturanSistemApi.updateFaq(current.id, {
          pertanyaan: current.pertanyaan,
          jawaban: current.jawaban,
          urutan: swapOrder,
          isAktif: current.isAktif,
        }),
        pengaturanSistemApi.updateFaq(swapWith.id, {
          pertanyaan: swapWith.pertanyaan,
          jawaban: swapWith.jawaban,
          urutan: currentOrder,
          isAktif: swapWith.isAktif,
        }),
      ]);
      await fetchFaq();
    } catch (err: any) {
      setPageError(err?.message || 'Gagal mengubah urutan FAQ.');
    }
  };

  // =========================================================
  // KONTAK HANDLERS
  // =========================================================
  const handleSaveKontak = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!kontakForm.judul.trim()) errs.judul = 'Judul kontak wajib diisi.';
    if (!kontakForm.subJudul.trim()) errs.subJudul = 'Sub judul kontak wajib diisi.';
    if (!kontakForm.lokasi.trim()) errs.lokasi = 'Lokasi sekretariat wajib diisi.';
    if (!kontakForm.email.trim()) errs.email = 'Email akademik wajib diisi.';
    if (!kontakForm.jamPelayanan.trim()) errs.jamPelayanan = 'Jam pelayanan wajib diisi.';

    if (Object.keys(errs).length > 0) {
      setKontakErrors(errs);
      return;
    }

    try {
      setSavingKontak(true);
      setKontakErrors({});
      setPageError('');
      setSuccessMessage('');

      const updated = await pengaturanSistemApi.updateKontak({
        judul: kontakForm.judul.trim(),
        subJudul: kontakForm.subJudul.trim(),
        lokasi: kontakForm.lokasi.trim(),
        email: kontakForm.email.trim(),
        telepon: kontakForm.telepon?.trim() || null,
        whatsApp: kontakForm.whatsApp?.trim() || null,
        jamPelayanan: kontakForm.jamPelayanan.trim(),
        catatan: kontakForm.catatan?.trim() || null,
      });

      setKontakForm({
        judul: updated.judul,
        subJudul: updated.subJudul,
        lokasi: updated.lokasi,
        email: updated.email,
        telepon: updated.telepon || '',
        whatsApp: updated.whatsApp || '',
        jamPelayanan: updated.jamPelayanan,
        catatan: updated.catatan || '',
      });
      setSuccessMessage('Pengaturan kontak berhasil disimpan dan terhubung ke halaman Login & Dashboard.');
    } catch (err: any) {
      if (err?.errors) setKontakErrors(err.errors);
      else setPageError(err?.message || 'Gagal menyimpan pengaturan kontak.');
    } finally {
      setSavingKontak(false);
    }
  };

  // =========================================================
  // HARI LIBUR HANDLERS
  // =========================================================
  const openCreateLibur = () => {
    const defaultYear = filterTahun !== 'all' ? Number(filterTahun) : new Date().getFullYear();
    const todayStr = new Date().toISOString().slice(0, 10);
    const initialDate = todayStr.startsWith(String(defaultYear)) ? todayStr : `${defaultYear}-01-01`;

    setEditingLibur(null);
    setIsRentangLibur(false);
    setLiburForm({
      tanggalMulai: initialDate,
      tanggalSelesai: initialDate,
      nama: '',
      keterangan: '',
      tipe: 'Kampus',
    });
    setLiburErrors({});
    setShowLiburModal(true);
  };

  const openEditLibur = (item: HariLiburDto) => {
    setEditingLibur(item);
    setIsRentangLibur(item.tanggalSelesai !== item.tanggalMulai);
    setLiburForm({
      tanggalMulai: item.tanggalMulai,
      tanggalSelesai: item.tanggalSelesai,
      nama: item.nama,
      keterangan: item.keterangan || '',
      tipe: item.tipe || 'Kampus',
    });
    setLiburErrors({});
    setShowLiburModal(true);
  };

  const handleSaveLibur = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!liburForm.tanggalMulai) errs.tanggalMulai = 'Tanggal mulai wajib diisi.';
    const finalEnd = isRentangLibur ? (liburForm.tanggalSelesai || liburForm.tanggalMulai) : liburForm.tanggalMulai;
    if (isRentangLibur && liburForm.tanggalMulai && finalEnd < liburForm.tanggalMulai) {
      errs.tanggalSelesai = 'Tanggal selesai harus sama atau setelah tanggal mulai.';
    }
    if (!liburForm.nama.trim()) errs.nama = 'Nama hari libur wajib diisi.';

    if (Object.keys(errs).length > 0) {
      setLiburErrors(errs);
      return;
    }

    try {
      setSavingLibur(true);
      setPageError('');
      const payload = {
        tanggalMulai: liburForm.tanggalMulai,
        tanggalSelesai: finalEnd,
        nama: liburForm.nama.trim(),
        keterangan: liburForm.keterangan.trim() || null,
        tipe: liburForm.tipe || 'Kampus',
      };

      if (editingLibur) {
        await pengaturanSistemApi.updateHariLibur(editingLibur.id, payload);
        setSuccessMessage(`Hari libur "${payload.nama}" berhasil diperbarui (tersimpan sebagai Manual).`);
      } else {
        await pengaturanSistemApi.createHariLibur(payload);
        setSuccessMessage(`Hari libur "${payload.nama}" berhasil ditambahkan ke kalender.`);
      }

      setShowLiburModal(false);
      await fetchHariLibur();
    } catch (err: any) {
      if (err?.errors) setLiburErrors(err.errors);
      else setLiburErrors({ general: err?.message || 'Gagal menyimpan hari libur.' });
    } finally {
      setSavingLibur(false);
    }
  };

  const handleSinkronLibur = async () => {
    try {
      setSyncingLibur(true);
      setPageError('');
      setSuccessMessage('');
      const res = await pengaturanSistemApi.sinkronHariLibur(syncYear);
      const parts = [
        `${res.jumlahNasional} Nasional`,
        `${res.jumlahCutiBersama} Cuti Bersama`,
      ];
      if (res.jumlahDigantiKeApi > 0) {
        parts.push(`${res.jumlahDigantiKeApi} entri manual 1 hari diperbarui ke API`);
      }
      if (res.jumlahDilewati > 0) {
        parts.push(`${res.jumlahDilewati} dilewati karena tercakup rentang libur manual`);
      }
      setSuccessMessage(
        `Sinkronisasi hari libur tahun ${res.tahun} selesai: ${res.jumlahDisinkron} tersimpan (${parts.join(', ')}).`
      );
      if (filterTahun !== 'all' && filterTahun !== String(res.tahun)) {
        setFilterTahun(String(res.tahun));
      }
      await fetchHariLibur();
    } catch (err: any) {
      setPageError(err?.message || `Gagal menyinkronkan hari libur tahun ${syncYear}.`);
    } finally {
      setSyncingLibur(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setPageError('');
      if (deleteTarget.type === 'faq') {
        await pengaturanSistemApi.deleteFaq(deleteTarget.id);
        setSuccessMessage('Item FAQ berhasil dihapus.');
        await fetchFaq();
      } else {
        await pengaturanSistemApi.deleteHariLibur(deleteTarget.id);
        setSuccessMessage('Hari libur berhasil dihapus dari kalender.');
        await fetchHariLibur();
      }
      setDeleteTarget(null);
    } catch (err: any) {
      setPageError(err?.message || 'Gagal menghapus data.');
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // DERIVED DATA
  // =========================================================
  const sortedFaq = useMemo(
    () => [...faqList].sort((a, b) => a.urutan - b.urutan || a.id - b.id),
    [faqList]
  );

  const filteredFaq = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    if (!q) return sortedFaq;
    return sortedFaq.filter(
      x => x.pertanyaan.toLowerCase().includes(q) || x.jawaban.toLowerCase().includes(q)
    );
  }, [sortedFaq, faqSearch]);

  const activeFaqCount = useMemo(() => faqList.filter(x => x.isAktif).length, [faqList]);

  const availableYears = useMemo(() => {
    const nowYear = new Date().getFullYear();
    const set = new Set<number>([nowYear, nowYear + 1, 2026, ...syncYears]);
    for (const h of hariLiburList) {
      const yStart = Number(h.tanggalMulai.slice(0, 4));
      const yEnd = Number(h.tanggalSelesai.slice(0, 4));
      if (!Number.isNaN(yStart)) set.add(yStart);
      if (!Number.isNaN(yEnd)) set.add(yEnd);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [hariLiburList, syncYears]);

  const filteredLibur = useMemo(() => {
    const q = liburSearch.trim().toLowerCase();
    return hariLiburList.filter(h => {
      const matchYear =
        filterTahun === 'all' ||
        (h.tanggalMulai <= `${filterTahun}-12-31` && h.tanggalSelesai >= `${filterTahun}-01-01`);
      const matchSumber =
        filterSumber === 'all' ||
        (h.sumber || 'Manual').toLowerCase() === filterSumber.toLowerCase();
      const matchSearch =
        !q ||
        h.nama.toLowerCase().includes(q) ||
        (h.tipe && h.tipe.toLowerCase().includes(q)) ||
        (h.keterangan && h.keterangan.toLowerCase().includes(q));
      return matchYear && matchSumber && matchSearch;
    });
  }, [hariLiburList, filterTahun, filterSumber, liburSearch]);

  const previewWaUrl = formatWhatsAppUrl(kontakForm.whatsApp);

  const modalLiburDayCount = useMemo(() => {
    if (!liburForm.tanggalMulai) return 0;
    const endStr = isRentangLibur ? (liburForm.tanggalSelesai || liburForm.tanggalMulai) : liburForm.tanggalMulai;
    const start = new Date(liburForm.tanggalMulai + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [liburForm.tanggalMulai, liburForm.tanggalSelesai, isRentangLibur]);

  return (
    <Layout>
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-slate-800 via-primary-900 to-indigo-900 rounded-2xl p-6 text-white mb-6 shadow-elevated relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <SettingsIcon className="w-32 h-32" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors backdrop-blur-xs cursor-pointer"
              title="Kembali ke Dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner border border-white/20 shrink-0">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Pengaturan Sistem</h1>
              <p className="text-slate-200 text-xs sm:text-sm mt-0.5">
                Kelola FAQ halaman login, informasi kontak bantuan, dan hari libur kalender
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-medium flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {pageError && (
        <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium flex items-center justify-between gap-3 animate-fade-in">
          <span>{pageError}</span>
          <button onClick={() => setPageError('')} className="text-rose-700 hover:text-rose-900 text-xs font-bold cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 p-2 mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleSelectTab('faq')}
          className={`flex-1 min-w-[180px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'faq'
              ? 'bg-gradient-to-r from-primary-900 to-blue-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <QuestionCircleIcon className="w-4 h-4 shrink-0" />
          <span>Pengaturan FAQ</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeTab === 'faq' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {faqList.length}
          </span>
        </button>

        <button
          onClick={() => handleSelectTab('kontak')}
          className={`flex-1 min-w-[180px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'kontak'
              ? 'bg-gradient-to-r from-primary-900 to-blue-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <PhoneIcon className="w-4 h-4 shrink-0" />
          <span>Pengaturan Kontak</span>
        </button>

        <button
          onClick={() => handleSelectTab('kalender')}
          className={`flex-1 min-w-[180px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'kalender'
              ? 'bg-gradient-to-r from-primary-900 to-blue-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TahunAjaranIcon className="w-4 h-4 shrink-0" />
          <span>Pengaturan Kalender</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeTab === 'kalender' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {hariLiburList.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PENGATURAN FAQ                                     */}
      {/* ========================================================= */}
      {activeTab === 'faq' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {activeFaqCount} FAQ Aktif di Halaman Login
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Total {faqList.length} Item
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 flex-1 md:justify-end">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={e => setFaqSearch(e.target.value)}
                  placeholder="Cari pertanyaan atau jawaban..."
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                onClick={fetchFaq}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Muat Ulang FAQ"
              >
                <RefreshIcon className={`w-4 h-4 ${loadingFaq ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={openCreateFaq}
                className="px-4 py-2.5 bg-gradient-to-r from-primary-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span>
                <span>Tambah FAQ</span>
              </button>
            </div>
          </div>

          {loadingFaq ? (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center text-sm text-slate-500">
              Memuat daftar FAQ...
            </div>
          ) : filteredFaq.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-10 text-center">
              <QuestionCircleIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                {faqSearch ? 'Tidak ada FAQ yang sesuai pencarian.' : 'Belum ada item FAQ.'}
              </p>
              {!faqSearch && (
                <button
                  onClick={openCreateFaq}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
                >
                  + Tambah FAQ Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaq.map((item) => {
                const sortedIdx = sortedFaq.findIndex(x => x.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl shadow-card border p-4 sm:p-5 transition-all ${
                      item.isAktif ? 'border-slate-100/90' : 'border-amber-200/80 bg-amber-50/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-xs flex items-center justify-center shrink-0">
                          #{item.urutan}
                        </span>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-primary-900">
                              {item.pertanyaan}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.isAktif
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {item.isAktif ? 'Aktif' : 'Disembunyikan'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                            {item.jawaban}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                        {!faqSearch && (
                          <>
                            <button
                              onClick={() => handleMoveFaqOrder(sortedIdx, -1)}
                              disabled={sortedIdx <= 0}
                              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold cursor-pointer"
                              title="Naikkan Urutan"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleMoveFaqOrder(sortedIdx, 1)}
                              disabled={sortedIdx < 0 || sortedIdx >= sortedFaq.length - 1}
                              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold cursor-pointer"
                              title="Turunkan Urutan"
                            >
                              ↓
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleToggleFaqStatus(item)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                            item.isAktif
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {item.isAktif ? 'Sembunyikan' : 'Tampilkan'}
                        </button>

                        <button
                          onClick={() => openEditFaq(item)}
                          className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 transition-colors cursor-pointer"
                          title="Edit FAQ"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteTarget({ type: 'faq', id: item.id, label: item.pertanyaan })}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                          title="Hapus FAQ"
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PENGATURAN KONTAK                                  */}
      {/* ========================================================= */}
      {activeTab === 'kontak' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
          <form
            onSubmit={handleSaveKontak}
            className="lg:col-span-3 bg-white rounded-2xl shadow-card border border-slate-100/90 p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-primary-900">Informasi Kontak Administrator</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perubahan otomatis diperbarui pada modal Kontak di Halaman Login dan panel Kontak di Dashboard.
                </p>
              </div>
              {loadingKontak && <RefreshIcon className="w-4 h-4 text-slate-400 animate-spin" />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Judul Kartu Kontak *</label>
                <input
                  type="text"
                  value={kontakForm.judul}
                  onChange={e => setKontakForm({ ...kontakForm, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Kontak Administrator"
                />
                {kontakErrors.judul && <p className="text-xs text-rose-600 mt-1">{kontakErrors.judul}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jam Pelayanan *</label>
                <input
                  type="text"
                  value={kontakForm.jamPelayanan}
                  onChange={e => setKontakForm({ ...kontakForm, jamPelayanan: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Senin - Jumat, 08:00 - 16:00 WITA"
                />
                {kontakErrors.jamPelayanan && <p className="text-xs text-rose-600 mt-1">{kontakErrors.jamPelayanan}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Sub Judul / Deskripsi Singkat *</label>
              <input
                type="text"
                value={kontakForm.subJudul}
                onChange={e => setKontakForm({ ...kontakForm, subJudul: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Layanan Bantuan Sistem E-Scheduling KOAS FKKH UNDANA"
              />
              {kontakErrors.subJudul && <p className="text-xs text-rose-600 mt-1">{kontakErrors.subJudul}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Lokasi Sekretariat *</label>
              <input
                type="text"
                value={kontakForm.lokasi}
                onChange={e => setKontakForm({ ...kontakForm, lokasi: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Gedung Dekanat FKKH Universitas Nusa Cendana"
              />
              {kontakErrors.lokasi && <p className="text-xs text-rose-600 mt-1">{kontakErrors.lokasi}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Akademik *</label>
                <input
                  type="email"
                  value={kontakForm.email}
                  onChange={e => setKontakForm({ ...kontakForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="fkkh@undana.ac.id"
                />
                {kontakErrors.email && <p className="text-xs text-rose-600 mt-1">{kontakErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nomor Telepon (Opsional)</label>
                <input
                  type="text"
                  value={kontakForm.telepon || ''}
                  onChange={e => setKontakForm({ ...kontakForm, telepon: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="(0380) ..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">WhatsApp (Opsional)</label>
                <input
                  type="text"
                  value={kontakForm.whatsApp || ''}
                  onChange={e => setKontakForm({ ...kontakForm, whatsApp: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="081234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Tambahan (Opsional)</label>
              <textarea
                rows={2}
                value={kontakForm.catatan || ''}
                onChange={e => setKontakForm({ ...kontakForm, catatan: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Contoh: Sertakan NIM dan nama kelompok saat menghubungi admin."
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingKontak}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <SaveIcon className="w-4 h-4" />
                <span>{savingKontak ? 'Menyimpan...' : 'Simpan Perubahan Kontak'}</span>
              </button>
            </div>
          </form>

          {/* Live Preview */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-100/90 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pratinjau Tampilan</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Login & Dashboard
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div>
                  <h3 className="text-base font-bold text-primary-900">
                    {kontakForm.judul || 'Kontak Administrator'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {kontakForm.subJudul || 'Layanan Bantuan Sistem E-Scheduling KOAS FKKH UNDANA'}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-200/80 text-xs">
                  <div className="flex items-start gap-2.5">
                    <MapPinIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Lokasi Sekretariat</span>
                      <span className="font-medium text-slate-700">{kontakForm.lokasi || '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MailIcon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Akademik</span>
                      <span className="font-mono font-semibold text-blue-600">{kontakForm.email || '-'}</span>
                    </div>
                  </div>

                  {kontakForm.telepon?.trim() && (
                    <div className="flex items-start gap-2.5">
                      <PhoneIcon className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Telepon</span>
                        <span className="font-medium text-slate-700">{kontakForm.telepon}</span>
                      </div>
                    </div>
                  )}

                  {kontakForm.whatsApp?.trim() && (
                    <div className="flex items-start gap-2.5">
                      <PhoneIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp</span>
                        {previewWaUrl ? (
                          <a
                            href={previewWaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-emerald-700 hover:underline"
                          >
                            {kontakForm.whatsApp}
                          </a>
                        ) : (
                          <span className="font-medium text-slate-700">{kontakForm.whatsApp}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5">
                    <ClockIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Jam Pelayanan</span>
                      <span className="font-medium text-slate-700">{kontakForm.jamPelayanan || '-'}</span>
                    </div>
                  </div>
                </div>

                {kontakForm.catatan?.trim() && (
                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-[11px] text-blue-800">
                    {kontakForm.catatan}
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
              Tips: Kosongkan Telepon atau WhatsApp bila tidak ingin menampilkannya ke pengguna.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PENGATURAN KALENDER (HARI LIBUR)                   */}
      {/* ========================================================= */}
      {activeTab === 'kalender' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-blue-900">
            <InfoIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Terintegrasi Otomatis dengan Kalender & Penjadwalan</p>
              <p className="text-blue-800/90 mt-0.5">
                Hari libur yang ditambahkan atau diubah di sini akan langsung tampil pada kalender di <strong>Dashboard</strong> &amp; <strong>Jadwal</strong>, serta otomatis dilewati saat menghitung tanggal selesai rotasi KOAS maupun generate jadwal otomatis.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 sm:flex-initial sm:w-60">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={liburSearch}
                  onChange={e => setLiburSearch(e.target.value)}
                  placeholder="Cari nama hari libur..."
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <select
                value={filterTahun}
                onChange={e => setFilterTahun(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Semua Tahun</option>
                {availableYears.map(y => (
                  <option key={y} value={String(y)}>
                    Tahun {y}
                  </option>
                ))}
              </select>

              <select
                value={filterSumber}
                onChange={e => setFilterSumber(e.target.value as 'all' | 'API' | 'Manual')}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Semua Sumber</option>
                <option value="API">API Nasional</option>
                <option value="Manual">Manual / Kampus</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchHariLibur}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
                title="Muat Ulang Hari Libur"
              >
                <RefreshIcon className={`w-4 h-4 ${loadingLibur ? 'animate-spin' : ''}`} />
              </button>

              <select
                value={syncYear}
                onChange={e => setSyncYear(Number(e.target.value))}
                disabled={syncingLibur}
                aria-label="Pilih tahun sinkronisasi hari libur"
                className="pl-3.5 pr-9 py-2.5 min-w-[92px] bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:opacity-60"
              >
                {syncYears.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button
                id="btn-sinkron-hari-libur"
                type="button"
                onClick={handleSinkronLibur}
                disabled={syncingLibur}
                className="px-4 py-2.5 bg-gradient-to-r from-primary-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 active:scale-95 disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                title="Tarik & sinkronkan hari libur nasional & cuti bersama dari Tanggal Merah API"
              >
                <RefreshIcon className={`w-4 h-4 shrink-0 ${syncingLibur ? 'animate-spin' : ''}`} />
                <span>{syncingLibur ? 'Menyinkronkan...' : 'Sinkron API'}</span>
              </button>

              <button
                onClick={openCreateLibur}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span>+</span>
                <span>Tambah Hari Libur</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-900 to-slate-800 text-white text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold w-14">No</th>
                    <th className="py-3.5 px-4 font-bold">Tanggal Libur</th>
                    <th className="py-3.5 px-4 font-bold w-28">Durasi</th>
                    <th className="py-3.5 px-4 font-bold">Nama Hari Libur</th>
                    <th className="py-3.5 px-4 font-bold text-right w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {loadingLibur ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        Memuat daftar hari libur kalender...
                      </td>
                    </tr>
                  ) : filteredLibur.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        Tidak ada data hari libur pada filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredLibur.map((item, idx) => {
                      const isRange = item.tanggalSelesai !== item.tanggalMulai;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-500">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                            {isRange
                              ? `${formatDateDisplay(item.tanggalMulai)} – ${formatDateDisplay(item.tanggalSelesai)}`
                              : formatDateDisplay(item.tanggalMulai)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {item.jumlahHari} hari
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="font-bold text-primary-900">{item.nama}</p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  item.tipe === 'Nasional'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : item.tipe === 'Cuti Bersama'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}
                              >
                                {item.tipe || 'Kampus'}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  item.sumber === 'API'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {item.sumber || 'Manual'}
                              </span>
                            </div>
                            {item.keterangan && (
                              <p className="text-xs text-slate-500 mt-0.5">{item.keterangan}</p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openEditLibur(item)}
                                className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 transition-colors cursor-pointer"
                                title="Edit Hari Libur"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'libur', id: item.id, label: item.nama })}
                                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                                title="Hapus Hari Libur"
                              >
                                <DeleteIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TAMBAH / EDIT FAQ                                   */}
      {/* ========================================================= */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <h3 className="text-lg font-bold text-primary-900 mb-1">
              {editingFaq ? 'Edit Item FAQ' : 'Tambah Item FAQ Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Konten ini akan muncul di Tab FAQ pada modal Panduan Pengguna di halaman Login.
            </p>

            {faqErrors.general && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {faqErrors.general}
              </div>
            )}

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pertanyaan *</label>
                <input
                  type="text"
                  value={faqForm.pertanyaan}
                  onChange={e => setFaqForm({ ...faqForm, pertanyaan: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Contoh: Bagaimana cara melihat jadwal stase saya?"
                />
                {faqErrors.pertanyaan && <p className="text-xs text-rose-600 mt-1">{faqErrors.pertanyaan}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jawaban *</label>
                <textarea
                  rows={4}
                  value={faqForm.jawaban}
                  onChange={e => setFaqForm({ ...faqForm, jawaban: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Tuliskan penjelasan lengkap dan jelas..."
                />
                {faqErrors.jawaban && <p className="text-xs text-rose-600 mt-1">{faqErrors.jawaban}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nomor Urut Tampil</label>
                  <input
                    type="number"
                    min={1}
                    value={faqForm.urutan}
                    onChange={e => setFaqForm({ ...faqForm, urutan: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <label className="flex items-center gap-2.5 pt-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={faqForm.isAktif}
                    onChange={e => setFaqForm({ ...faqForm, isAktif: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Tampilkan di Halaman Login</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingFaq}
                  className="px-5 py-2 bg-gradient-to-r from-primary-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md disabled:opacity-60 cursor-pointer"
                >
                  {savingFaq ? 'Menyimpan...' : 'Simpan FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TAMBAH / EDIT HARI LIBUR                            */}
      {/* ========================================================= */}
      {showLiburModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <h3 className="text-lg font-bold text-primary-900 mb-1">
              {editingLibur ? 'Edit Hari Libur Kalender' : 'Tambah Hari Libur Kalender'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Atur tanggal libur tunggal atau rentang libur panjang agar kalender dan perhitungan jadwal tetap akurat.
            </p>

            {liburErrors.general && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {liburErrors.general}
              </div>
            )}

            {editingLibur?.sumber === 'API' && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                Data ini berasal dari Tanggal Merah API. Jika disimpan setelah diedit, sumbernya otomatis berubah menjadi <strong>Manual</strong> agar tidak tertimpa saat sinkron ulang.
              </div>
            )}

            <form onSubmit={handleSaveLibur} className="space-y-4">
              <label className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRentangLibur}
                  onChange={e => {
                    const checked = e.target.checked;
                    setIsRentangLibur(checked);
                    if (!checked) {
                      setLiburForm(prev => ({ ...prev, tanggalSelesai: prev.tanggalMulai }));
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-slate-700">Libur rentang beberapa hari (multi-hari)</span>
              </label>

              <div className={`grid gap-4 ${isRentangLibur ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRentangLibur ? 'Tanggal Mulai *' : 'Tanggal Libur *'}
                  </label>
                  <input
                    type="date"
                    value={liburForm.tanggalMulai}
                    onChange={e => {
                      const val = e.target.value;
                      setLiburForm(prev => ({
                        ...prev,
                        tanggalMulai: val,
                        tanggalSelesai: !isRentangLibur || prev.tanggalSelesai < val ? val : prev.tanggalSelesai,
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {liburErrors.tanggalMulai && <p className="text-xs text-rose-600 mt-1">{liburErrors.tanggalMulai}</p>}
                </div>

                {isRentangLibur && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Selesai *</label>
                    <input
                      type="date"
                      min={liburForm.tanggalMulai}
                      value={liburForm.tanggalSelesai}
                      onChange={e => setLiburForm({ ...liburForm, tanggalSelesai: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    {liburErrors.tanggalSelesai && <p className="text-xs text-rose-600 mt-1">{liburErrors.tanggalSelesai}</p>}
                  </div>
                )}
              </div>

              {modalLiburDayCount > 0 && (
                <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2 inline-block">
                  Durasi terpilih: {modalLiburDayCount} hari
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Hari Libur *</label>
                <input
                  type="text"
                  value={liburForm.nama}
                  onChange={e => setLiburForm({ ...liburForm, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Contoh: Libur Natal & Tahun Baru"
                />
                {liburErrors.nama && <p className="text-xs text-rose-600 mt-1">{liburErrors.nama}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipe Hari Libur</label>
                <select
                  value={liburForm.tipe}
                  onChange={e => setLiburForm({ ...liburForm, tipe: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="Kampus">Kampus / Akademik (FKKH / UNDANA)</option>
                  <option value="Nasional">Libur Nasional</option>
                  <option value="Cuti Bersama">Cuti Bersama</option>
                </select>
                {liburErrors.tipe && <p className="text-xs text-rose-600 mt-1">{liburErrors.tipe}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Keterangan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={liburForm.keterangan}
                  onChange={e => setLiburForm({ ...liburForm, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Contoh: Berdasarkan SKB 3 Menteri / Kalender Akademik UNDANA"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLiburModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingLibur}
                  className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md disabled:opacity-60 cursor-pointer"
                >
                  {savingLibur ? 'Menyimpan...' : 'Simpan Hari Libur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL KONFIRMASI HAPUS                                    */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <DeleteIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Hapus {deleteTarget.type === 'faq' ? 'Item FAQ' : 'Hari Libur'}?
            </h3>
            <p className="text-xs text-slate-500 mb-5 line-clamp-3">
              &ldquo;{deleteTarget.label}&rdquo; akan dihapus secara permanen.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-60 cursor-pointer"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
