/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  MahasiswaIcon,
  DosenIcon,
  StaseIcon,
  KelompokIcon,
  JadwalIcon,
  TahunAjaranIcon,
  HistoryIcon,
  MegaphoneIcon,
  BellIcon,
  UsersIcon,
} from '../components/Icons';
import {
  mahasiswaApi,
  pembimbingApi,
  staseApi,
  kelompokApi,
  jadwalApi,
  tahunAjaranApi,
  riwayatKelompokApi,
  type Jadwal,
} from '../services/api';
import { getHolidays } from '../utils/holidays';
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'id': idLocale,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const eventStyleGetter = (event: any) => {
  if (event.type === 'holiday') {
    return {
      style: {
        backgroundColor: '#ef4444',
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        fontWeight: 'bold',
      }
    };
  }

  const hue = (event.idKelompok * 137.5) % 360;
  
  return {
    style: {
      backgroundColor: `hsl(${hue}, 70%, 50%)`,
      color: 'white',
      border: '0px',
      display: 'block',
      fontSize: '12px',
      fontWeight: 'bold',
    }
  };
};

interface Stats {
  mahasiswa: number;
  dosen: number;
  stase: number;
  kelompok: number;
  tahunAjaran: number;
  activeTahunAjaranText: string;
  jadwalTotal: number;
  jadwalBerlangsung: number;
  jadwalAkanDatang: number;
  jadwalSelesai: number;
  riwayatCount: number;
  userKelompokNama?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  category: 'master' | 'penjadwalan' | 'komunikasi' | 'sistem';
  categoryLabel: string;
  path: string;
  description: string;
  gradient: string;
  statValue: (stats: Stats, isMahasiswa?: boolean, isDosen?: boolean) => string | number;
  statLabel: (stats: Stats, isMahasiswa?: boolean, isDosen?: boolean) => string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  adminOnly?: boolean;
}

const allMenuItems: MenuItem[] = [
  {
    id: 'tahun-ajaran',
    label: 'Tahun Ajaran',
    category: 'master',
    categoryLabel: 'Data Master',
    path: '/tahun-ajaran',
    description: 'Atur kalender & semester akademik',
    gradient: 'from-sky-500 to-indigo-600',
    statValue: (stats) => stats.tahunAjaran,
    statLabel: (stats) => stats.activeTahunAjaranText ? `T.A. (${stats.activeTahunAjaranText})` : 'Periode',
    icon: TahunAjaranIcon,
  },
  {
    id: 'stase',
    label: 'Stase KOAS',
    category: 'master',
    categoryLabel: 'Data Master',
    path: '/stase',
    description: 'Kelola rotasi klinik & koordinator stase',
    gradient: 'from-purple-500 to-purple-600',
    statValue: (stats) => stats.stase,
    statLabel: () => 'Departemen Klinik',
    icon: StaseIcon,
  },
  {
    id: 'dosen',
    label: 'Dosen Pembimbing',
    category: 'master',
    categoryLabel: 'Data Master',
    path: '/dosen',
    description: 'Data dokter spesialis & dosen pembimbing',
    gradient: 'from-emerald-500 to-green-600',
    statValue: (stats) => stats.dosen,
    statLabel: () => 'Dokter Spesialis',
    icon: DosenIcon,
  },
  {
    id: 'mahasiswa',
    label: 'Mahasiswa KOAS',
    category: 'master',
    categoryLabel: 'Data Master',
    path: '/mahasiswa',
    description: 'Data dokter muda & mahasiswa KOAS',
    gradient: 'from-blue-500 to-blue-600',
    statValue: (stats) => stats.mahasiswa,
    statLabel: () => 'Mahasiswa Terdaftar',
    icon: MahasiswaIcon,
  },
  {
    id: 'kelompok',
    label: 'Kelompok KOAS',
    category: 'penjadwalan',
    categoryLabel: 'Penjadwalan',
    path: '/kelompok',
    description: 'Pembagian & struktur anggota kelompok',
    gradient: 'from-amber-500 to-orange-600',
    statValue: (stats, isMahasiswa) => isMahasiswa ? (stats.userKelompokNama ? `Kelompok ${stats.userKelompokNama}` : '-') : stats.kelompok,
    statLabel: (_, isMahasiswa) => isMahasiswa ? 'Kelompok Anda' : 'Kelompok Aktif',
    icon: KelompokIcon,
  },
  {
    id: 'jadwal',
    label: 'Kelola Jadwal',
    category: 'penjadwalan',
    categoryLabel: 'Penjadwalan',
    path: '/jadwal',
    description: 'Generate & kelola matriks jadwal rotasi',
    gradient: 'from-rose-500 to-red-600',
    statValue: (stats) => stats.jadwalTotal,
    statLabel: (stats) => stats.jadwalBerlangsung > 0 ? `Jadwal (${stats.jadwalBerlangsung} Berlangsung)` : 'Total Jadwal',
    icon: JadwalIcon,
  },
  {
    id: 'riwayat-kelompok',
    label: 'Riwayat Kelompok',
    category: 'penjadwalan',
    categoryLabel: 'Penjadwalan',
    path: '/riwayat-kelompok',
    description: 'Arsip & histori rotasi stase selesai',
    gradient: 'from-teal-500 to-emerald-600',
    statValue: (stats) => stats.riwayatCount,
    statLabel: () => 'Stase Selesai',
    icon: HistoryIcon,
  },
  {
    id: 'broadcast',
    label: 'Broadcast Pesan',
    category: 'komunikasi',
    categoryLabel: 'Komunikasi',
    path: '/broadcast',
    description: 'Kirim pengumuman siaran mahasiswa/dosen',
    gradient: 'from-pink-500 to-rose-600',
    statValue: () => 'Siaran',
    statLabel: () => 'Pesan Massal',
    icon: MegaphoneIcon,
  },
  {
    id: 'notifikasi',
    label: 'Pusat Notifikasi',
    category: 'komunikasi',
    categoryLabel: 'Komunikasi',
    path: '/notifikasi',
    description: 'Pemberitahuan aktivitas & jadwal kegiatan',
    gradient: 'from-violet-500 to-purple-600',
    statValue: () => 'Pusat',
    statLabel: () => 'Pemberitahuan',
    icon: BellIcon,
  },
  {
    id: 'manajemen-pengguna',
    label: 'Manajemen Pengguna',
    category: 'sistem',
    categoryLabel: 'Pengaturan',
    path: '/manajemen-pengguna',
    description: 'Kelola akun user & hak akses sistem',
    gradient: 'from-slate-700 to-slate-900',
    statValue: () => 'Akses',
    statLabel: () => 'Kontrol User',
    icon: UsersIcon,
    adminOnly: true,
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role?.toLowerCase();
  const isMahasiswa = role === 'mahasiswa';
  const isDosen = role === 'dosen';
  const isAdmin = role === 'admin' || role === 'administrator';

  const [stats, setStats] = useState<Stats>({
    mahasiswa: 0,
    dosen: 0,
    stase: 0,
    kelompok: 0,
    tahunAjaran: 0,
    activeTahunAjaranText: '',
    jadwalTotal: 0,
    jadwalBerlangsung: 0,
    jadwalAkanDatang: 0,
    jadwalSelesai: 0,
    riwayatCount: 0,
  });

  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [userKelompokId, setUserKelompokId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState<View>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [mhs, pemb, stase, kel, jadwal, taList, riwayatList] = await Promise.all([
        mahasiswaApi.getAll().catch(() => []),
        pembimbingApi.getAll().catch(() => []),
        staseApi.getAll().catch(() => []),
        kelompokApi.getAll().catch(() => []),
        jadwalApi.getAll().catch(() => []),
        tahunAjaranApi.getAll().catch(() => []),
        riwayatKelompokApi.getAll().catch(() => []),
      ]);

      let userKelId: number | null = null;
      let userKelNama = '';
      if (isMahasiswa) {
        const myKel = kel.find((k: any) => 
          k.daftarMahasiswa && k.daftarMahasiswa.some((m: any) => m.nim === user?.username)
        );
        if (myKel) {
          userKelId = myKel.id;
          userKelNama = myKel.nama;
          setUserKelompokId(myKel.id);
        }
      }

      // Live Schedule Calculation
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const relevantJadwal = jadwal.filter((j: any) => {
        if (isMahasiswa) return j.idKelompok === userKelId;
        if (isDosen) return j.idPembimbing === user?.profileId;
        return true;
      });

      let berlangsung = 0;
      let akanDatang = 0;
      let selesai = 0;

      relevantJadwal.forEach((j: any) => {
        const start = new Date(j.tanggalMulai + 'T00:00:00');
        const end = new Date(j.tanggalSelesai + 'T00:00:00');
        if (today > end) selesai++;
        else if (today >= start && today <= end) berlangsung++;
        else akanDatang++;
      });

      const sortedTa = [...taList].sort((a: any, b: any) => b.tahun - a.tahun);
      const latestTa = sortedTa[0];
      const activeTaStr = latestTa ? `${latestTa.tahun} - ${latestTa.semester}` : '';

      setStats({
        mahasiswa: mhs.length,
        dosen: pemb.length,
        stase: stase.length,
        kelompok: kel.length,
        tahunAjaran: taList.length,
        activeTahunAjaranText: activeTaStr,
        jadwalTotal: relevantJadwal.length,
        jadwalBerlangsung: berlangsung,
        jadwalAkanDatang: akanDatang,
        jadwalSelesai: selesai,
        riwayatCount: riwayatList.length,
        userKelompokNama: userKelNama,
      });
      setJadwalList(jadwal);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [isMahasiswa, isDosen, user?.username, user?.profileId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getFirstName = (name: string) => {
    if (!name) return '';
    return name.split(' ')[0];
  };

  // Filter menu items by role and category
  const filteredMenuItems = useMemo(() => {
    return allMenuItems.filter(item => {
      // Role restrictions
      if (item.adminOnly && !isAdmin) return false;
      if (isMahasiswa || isDosen) {
        if (!['stase', 'kelompok', 'jadwal', 'riwayat-kelompok', 'notifikasi'].includes(item.id)) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [isAdmin, isMahasiswa, isDosen, selectedCategory]);

  // Categories list for filter tabs
  const categoryTabs = useMemo(() => {
    if (isMahasiswa || isDosen) {
      return [
        { id: 'all', label: 'Semua Modul' },
        { id: 'master', label: 'Stase' },
        { id: 'penjadwalan', label: 'Penjadwalan & Riwayat' },
        { id: 'komunikasi', label: 'Notifikasi' },
      ];
    }
    const tabs = [
      { id: 'all', label: 'Semua Modul' },
      { id: 'master', label: 'Data Master' },
      { id: 'penjadwalan', label: 'Penjadwalan' },
      { id: 'komunikasi', label: 'Komunikasi' },
    ];
    if (isAdmin) {
      tabs.push({ id: 'sistem', label: 'Pengaturan' });
    }
    return tabs;
  }, [isAdmin, isMahasiswa, isDosen]);

  const upcomingJadwal = [...jadwalList]
    .filter(j => {
      if (isMahasiswa) return j.idKelompok === userKelompokId;
      if (isDosen) return (j as any).idPembimbing === user?.profileId;
      return true;
    })
    .sort((a, b) => new Date(a.tanggalMulai).getTime() - new Date(b.tanggalMulai).getTime())
    .filter(j => new Date(j.tanggalSelesai) >= new Date(new Date().toDateString()))
    .slice(0, 5);

  // === PREPARE CALENDAR EVENTS ===
  const jadwalEvents = jadwalList
    .filter(j => {
      if (isMahasiswa) return j.idKelompok === userKelompokId;
      if (isDosen) return (j as any).idPembimbing === user?.profileId;
      return true;
    })
    .map(j => ({
      id: `jadwal_${j.id}`,
      title: `${j.namaKelompok} - ${j.namaStase}`,
      start: new Date(j.tanggalMulai + 'T00:00:00'),
      end: new Date(j.tanggalSelesai + 'T23:59:59'),
      type: 'jadwal',
      idKelompok: j.idKelompok,
      jadwalId: j.id,
    }));

  const currentYear = calendarDate.getFullYear();
  const holidaysCurrentYear = getHolidays(currentYear);
  const holidaysNextYear = getHolidays(currentYear + 1);
  const allHolidays = [...holidaysCurrentYear, ...holidaysNextYear];
  
  const holidayEvents = allHolidays.map((h, i) => ({
    id: `holiday_${currentYear}_${i}`,
    title: `Libur: ${h.name}`,
    start: new Date(h.date + 'T00:00:00'),
    end: new Date(h.date + 'T23:59:59'),
    type: 'holiday',
    idKelompok: 0,
    jadwalId: 0,
  }));

  const calendarEvents = [...jadwalEvents, ...holidayEvents];

  return (
    <Layout>
      {/* Welcome Section */}
      <div className="mb-7">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                {stats.activeTahunAjaranText ? `T.A. ${stats.activeTahunAjaranText}` : 'E-Scheduling FKKH'}
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Role: {user?.role || 'Pengguna'}
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {stats.jadwalBerlangsung} Stase Berlangsung
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-900 tracking-tight">
              {getGreeting()}, {isDosen ? (user?.fullName || user?.username) : getFirstName(user?.fullName || user?.username || 'Admin')}! 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">Akses modul operasional dan informasi sistem penjadwalan KOAS</p>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-2xl shadow-card border border-slate-100/90 text-slate-600 text-xs sm:text-sm font-medium">
            <JadwalIcon className="w-4 h-4 text-rose-500" />
            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Unified Modul Cards Section (Stat + Action) */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
            Modul & Menu Utama
          </h2>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {categoryTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-primary-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid gap-4 ${isMahasiswa || isDosen ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
          {filteredMenuItems.map((item, index) => (
            <button
              key={item.id}
              id={`menu-${item.id}`}
              onClick={() => navigate(item.path)}
              className="group relative bg-white rounded-2xl p-5 border border-slate-100/90 
                shadow-card hover:shadow-elevated hover:-translate-y-1.5 
                transition-all duration-300 text-left animate-fade-in-up flex flex-col justify-between overflow-hidden cursor-pointer"
              style={{ animationDelay: `${(index + 1) * 40}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-2xl pointer-events-none`} />
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/80 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                    {item.categoryLabel}
                  </span>
                </div>

                {/* Metric Display */}
                <div className="mb-2">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-2xl font-extrabold text-primary-900 tracking-tight group-hover:text-blue-700 transition-colors">
                      {loading ? <span className="inline-block w-8 h-6 bg-slate-200 rounded animate-pulse" /> : item.statValue(stats, isMahasiswa, isDosen)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 truncate max-w-[140px]">
                      {item.statLabel(stats, isMahasiswa, isDosen)}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-primary-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {isMahasiswa || isDosen ? (
                    item.id === 'stase' ? 'Daftar Stase' :
                    item.id === 'kelompok' ? (isMahasiswa ? 'Kelompok Saya' : 'Kelompok Bimbingan') :
                    item.id === 'jadwal' ? 'Jadwal Stase' : item.label
                  ) : item.label}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {isMahasiswa || isDosen ? (
                    item.id === 'stase' ? 'Lihat rotasi departemen klinik KOAS' :
                    item.id === 'kelompok' ? (isMahasiswa ? 'Informasi anggota & pembimbing kelompok' : 'Daftar mahasiswa kelompok bimbingan') :
                    item.id === 'jadwal' ? 'Kalender jadwal kegiatan KOAS' : item.description
                  ) : item.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                <span>Buka Modul</span>
                <span className="text-sm transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar & Schedule Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
              Kalender Jadwal Rotasi
            </h2>
            <button
              onClick={() => navigate('/jadwal')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              Buka Halaman Jadwal →
            </button>
          </div>
          <div className="p-5 flex-1 min-h-[500px] overflow-x-auto pb-6">
            <div className="min-w-[800px] h-full">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                culture="id"
                view={calendarView}
                onView={setCalendarView}
                date={calendarDate}
                onNavigate={setCalendarDate}
                eventPropGetter={eventStyleGetter}
                messages={{
                  next: "Selanjutnya",
                  previous: "Sebelumnya",
                  today: "Hari Ini",
                  month: "Bulan",
                  week: "Minggu",
                  day: "Hari",
                  agenda: "Agenda",
                  date: "Tanggal",
                  time: "Waktu",
                  event: "Kegiatan",
                  noEventsInRange: "Tidak ada jadwal pada periode ini.",
                  showMore: total => `+${total} lebih`
                }}
                onSelectEvent={() => {
                  navigate('/jadwal');
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Info Sidebar */}
        <div className="space-y-5">
          {/* Status Jadwal Rotasi Card */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-primary-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-rose-500 rounded-full" />
                Ringkasan Rotasi Stase
              </h3>
              {stats.activeTahunAjaranText && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {stats.activeTahunAjaranText}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-4 text-center">
              <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-xl p-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1 animate-pulse" />
                <span className="text-lg font-bold text-emerald-700 block leading-tight">{stats.jadwalBerlangsung}</span>
                <span className="text-[10px] font-semibold text-emerald-600">Berlangsung</span>
              </div>
              <div className="bg-blue-50/70 border border-blue-100/80 rounded-xl p-2.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto mb-1" />
                <span className="text-lg font-bold text-blue-700 block leading-tight">{stats.jadwalAkanDatang}</span>
                <span className="text-[10px] font-semibold text-blue-600">Akan Datang</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                <div className="w-2 h-2 rounded-full bg-slate-400 mx-auto mb-1" />
                <span className="text-lg font-bold text-slate-700 block leading-tight">{stats.jadwalSelesai}</span>
                <span className="text-[10px] font-semibold text-slate-600">Selesai</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <HistoryIcon className="w-3.5 h-3.5 text-teal-600" />
                Riwayat Selesai
              </span>
              <button
                onClick={() => navigate('/riwayat-kelompok')}
                className="font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{stats.riwayatCount} Arsip</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Upcoming Schedule Card */}
          <div className="bg-gradient-to-br from-primary-900 via-slate-900 to-indigo-950 rounded-2xl shadow-elevated p-5 text-white">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <JadwalIcon className="w-4 h-4 text-rose-400" />
                Jadwal Mendatang
              </h3>
              <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                {upcomingJadwal.length} Terdekat
              </span>
            </div>
            
            <div className="space-y-2.5">
              {loading ? (
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 animate-pulse">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              ) : upcomingJadwal.length === 0 ? (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                  <p className="text-xs text-slate-400">Tidak ada jadwal mendatang</p>
                </div>
              ) : (
                upcomingJadwal.slice(0, 4).map(j => (
                  <div key={j.id} className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-3 border border-white/10">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-white line-clamp-1">{j.namaStase || 'Stase'}</p>
                      <span className="text-[10px] font-semibold bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded shrink-0">
                        {j.namaKelompok}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-200/70 mt-1 flex items-center gap-1">
                      <span>📅</span>
                      <span>
                        {new Date(j.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' '}-{' '}
                        {new Date(j.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </p>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => navigate('/jadwal')} 
              className="mt-4 w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/10 hover:border-white/20 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Lihat Kalender Lengkap</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
