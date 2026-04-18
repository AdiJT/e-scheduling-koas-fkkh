import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { mahasiswaApi, pembimbingApi, staseApi, kelompokApi, jadwalApi, type Jadwal } from '../services/api';
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
interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  description: string;
  gradient: string;
  shadowColor: string;
}

const menuItems: MenuItem[] = [
  { id: 'mahasiswa', label: 'Kelola Mahasiswa', icon: '👨‍🎓', path: '/mahasiswa', description: 'Kelola data mahasiswa KOAS', gradient: 'from-blue-500 to-blue-600', shadowColor: 'shadow-glow-blue' },
  { id: 'dosen', label: 'Kelola Dosen', icon: '👨‍🏫', path: '/dosen', description: 'Kelola data dosen pembimbing', gradient: 'from-emerald-500 to-green-600', shadowColor: 'shadow-glow-green' },
  { id: 'stase', label: 'Kelola Stase', icon: '🏥', path: '/stase', description: 'Kelola rotasi klinik', gradient: 'from-purple-500 to-purple-600', shadowColor: 'shadow-glow-purple' },
  { id: 'kelompok', label: 'Kelola Kelompok', icon: '👥', path: '/kelompok', description: 'Kelola kelompok mahasiswa', gradient: 'from-orange-500 to-orange-600', shadowColor: 'shadow-glow-orange' },
  { id: 'jadwal', label: 'Kelola Jadwal', icon: '📅', path: '/jadwal', description: 'Generate & kelola jadwal', gradient: 'from-rose-500 to-red-600', shadowColor: 'shadow-glow-red' },
];

interface Stats {
  mahasiswa: number;
  dosen: number;
  stase: number;
  kelompok: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ mahasiswa: 0, dosen: 0, stase: 0, kelompok: 0 });
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState<View>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [mhs, pemb, stase, kel, jadwal] = await Promise.all([
        mahasiswaApi.getAll(),
        pembimbingApi.getAll(),
        staseApi.getAll(),
        kelompokApi.getAll(),
        jadwalApi.getAll(),
      ]);
      setStats({
        mahasiswa: mhs.length,
        dosen: pemb.length,
        stase: stase.length,
        kelompok: kel.length,
      });
      setJadwalList(jadwal);
    } catch {
      // Silently fail — stats will show 0
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const statCards = [
    { label: 'Total Mahasiswa', value: stats.mahasiswa, icon: '👨‍🎓', gradient: 'from-blue-500 to-blue-600' },
    { label: 'Total Dosen', value: stats.dosen, icon: '👨‍🏫', gradient: 'from-emerald-500 to-green-600' },
    { label: 'Total Stase', value: stats.stase, icon: '🏥', gradient: 'from-purple-500 to-purple-600' },
    { label: 'Kelompok', value: stats.kelompok, icon: '👥', gradient: 'from-orange-500 to-orange-600' },
  ];

  const upcomingJadwal = [...jadwalList]
    .sort((a, b) => new Date(a.tanggalMulai).getTime() - new Date(b.tanggalMulai).getTime())
    .filter(j => new Date(j.tanggalMulai) >= new Date(new Date().toDateString()))
    .slice(0, 3);

  // === PREPARE CALENDAR EVENTS ===
  const jadwalEvents = jadwalList.map(j => ({
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-900 mb-1">
              {getGreeting()}, {user?.username || 'Admin'}! 👋
            </h1>
            <p className="text-slate-500">Berikut ringkasan sistem E-Scheduling KOAS hari ini</p>
          </div>
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-soft border border-slate-100">
            <span className="text-lg">📅</span>
            <span className="text-sm font-medium text-slate-600">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-5 shadow-card border border-slate-100/80 hover:shadow-elevated transition-all duration-300 group animate-fade-in-up cursor-default"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-primary-900 mb-1">
              {loading ? <span className="inline-block w-10 h-8 bg-slate-200 rounded animate-pulse" /> : stat.value}
            </p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
          Menu Utama
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              id={`menu-${item.id}`}
              onClick={() => navigate(item.path)}
              className={`group relative bg-white rounded-2xl p-5 border border-slate-100/80 
                shadow-card hover:shadow-elevated hover:-translate-y-1 
                transition-all duration-300 text-left animate-fade-in-up overflow-hidden`}
              style={{ animationDelay: `${(index + 4) * 80}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl mb-4 shadow-md group-hover:scale-110 group-hover:${item.shadowColor} transition-all duration-300`}>
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-primary-900 mb-1 group-hover:text-blue-700 transition-colors">{item.label}</h3>
              <p className="text-xs text-slate-400">{item.description}</p>
              <span className="absolute bottom-4 right-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 text-lg">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
              Kalender Jadwal
            </h2>
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

        {/* Quick Info */}
        <div className="space-y-4">
          {/* System Status */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-5">
            <h3 className="text-sm font-bold text-primary-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
              Status Sistem
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Server', status: 'Online', color: 'bg-green-500' },
                { label: 'Database', status: 'Connected', color: 'bg-green-500' },
                { label: 'API', status: 'Active', color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="flex items-center gap-2 text-xs font-medium text-green-600">
                    <span className={`w-2 h-2 rounded-full ${item.color} animate-pulse-slow`} />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="bg-gradient-to-br from-primary-900 to-blue-800 rounded-2xl shadow-dark p-5 text-white">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="text-lg">📋</span>
              Jadwal Mendatang
            </h3>
            <div className="space-y-3">
              {loading ? (
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 animate-pulse">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              ) : upcomingJadwal.length === 0 ? (
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                  <p className="text-sm text-blue-200/80">Tidak ada jadwal mendatang</p>
                </div>
              ) : (
                upcomingJadwal.map(j => (
                  <div key={j.id} className="bg-white/10 rounded-xl p-3 border border-white/10">
                    <p className="text-sm font-medium">{j.namaStase || 'Stase'} - {j.namaKelompok || 'Kelompok'}</p>
                    <p className="text-xs text-blue-200/60 mt-1">
                      {new Date(j.tanggalMulai).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => navigate('/jadwal')} 
              className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-all border border-white/10 hover:border-white/20"
            >
              Lihat Semua Jadwal →
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
