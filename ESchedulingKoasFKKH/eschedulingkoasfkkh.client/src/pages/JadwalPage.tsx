import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { jadwalApi, type GenerateJadwalResult, type Jadwal } from '../services/api';
import { formatDateDisplay, getHolidays } from '../utils/holidays';
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

// Custom Event styles based on type
const eventStyleGetter = (event: any) => {
  if (event.type === 'holiday') {
    return {
      style: {
        backgroundColor: '#ef4444', // red-500
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        fontWeight: 'bold',
      }
    };
  }

  // Generate a color based on Kelompok ID so each group has a distinct color
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

export default function JadwalPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  
  // Holiday Modal
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<{title: string, start: Date} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateJadwalResult | null>(null);
  
  // View Toggle: 'table' or 'calendar'
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('calendar');
  const [calendarView, setCalendarView] = useState<View>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await jadwalApi.getAll();
      setData(result);
    } catch {
      setError('Gagal memuat data jadwal. Pastikan server backend sedang berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate status based on dates
  const getStatus = (tanggalMulai: string, tanggalSelesai: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(tanggalMulai + 'T00:00:00');
    const end = new Date(tanggalSelesai + 'T00:00:00');
    
    if (today > end) return 'Selesai';
    if (today >= start && today <= end) return 'Berlangsung';
    return 'Akan Datang';
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Berlangsung': return 'bg-green-100 text-green-700 border-green-200';
      case 'Akan Datang': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Selesai': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'Berlangsung': return '🟢';
      case 'Akan Datang': return '🔵';
      case 'Selesai': return '⚪';
      default: return '⚪';
    }
  };

  const dataWithStatus = data.map(j => ({
    ...j,
    status: getStatus(j.tanggalMulai, j.tanggalSelesai),
  }));

  const filteredData = dataWithStatus.filter(j =>
    filterStatus === 'all' || j.status === filterStatus
  );

  // Stats
  const countBerlangsung = dataWithStatus.filter(j => j.status === 'Berlangsung').length;
  const countAkanDatang = dataWithStatus.filter(j => j.status === 'Akan Datang').length;
  const countSelesai = dataWithStatus.filter(j => j.status === 'Selesai').length;

  // === PREPARE CALENDAR EVENTS ===
  // 1. Jadwal Events
  const jadwalEvents = data.map(j => ({
    id: `jadwal_${j.id}`,
    title: `${j.namaKelompok} - ${j.namaStase}`,
    start: new Date(j.tanggalMulai + 'T00:00:00'),
    end: new Date(j.tanggalSelesai + 'T23:59:59'),
    type: 'jadwal',
    idKelompok: j.idKelompok,
    jadwalId: j.id,
  }));

  // 2. Holidays
  // Get holidays for the current year (can extend to previous/next year based on current view date)
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
    idKelompok: 0, // No specific group
    jadwalId: 0,
  }));

  const calendarEvents = [...jadwalEvents, ...holidayEvents];

  // === DETAIL & DELETE ===
  const handleDetail = (id: number) => {
    setDetailId(id);
    setShowDetailModal(true);
  };

  const handleDelete = (id: number) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const result = await jadwalApi.generate();
      setGenerateResult(result);
      await fetchData();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Gagal menjalankan generate jadwal otomatis.');
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      setDeleting(true);
      await jadwalApi.delete(selectedId);
      setData(prev => prev.filter(j => j.id !== selectedId));
    } catch {
      setError('Gagal menghapus jadwal.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  const selectedJadwal = dataWithStatus.find(j => j.id === selectedId);
  const detailJadwal = dataWithStatus.find(j => j.id === detailId);

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6 animate-fade-in-down print:mb-4">
        <div className="flex items-center gap-3 print:hidden">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-2xl shadow-md">📅</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Kelola Jadwal</h1><p className="text-sm text-slate-500">Kelola jadwal stase KOAS</p></div>
        </div>
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold text-black uppercase">Jadwal Stase KOAS</h1>
          <p className="text-sm text-gray-600">Fakultas Kedokteran Hewan</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in-down">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg">✕</button>
        </div>
      )}

      {generateResult && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl animate-fade-in-down">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-lg">OK</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                Generate otomatis selesai. {generateResult.jadwalDibuat} jadwal baru dibuat mulai {formatDateDisplay(generateResult.tanggalMulaiAcuan)}.
              </p>
              <p className="text-xs text-green-700 mt-1">
                Berhasil: {generateResult.kelompokBerhasil.length} kelompok, tanpa perubahan: {generateResult.kelompokTanpaPerubahan.length}, dilewati: {generateResult.kelompokDilewati.length}.
              </p>
            </div>
            <button onClick={() => setGenerateResult(null)} className="text-green-400 hover:text-green-600 text-lg">x</button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-fade-in-up print:hidden">
        <button onClick={() => navigate('/jadwal/tambah')}
          className="p-4 bg-gradient-to-r from-primary-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white rounded-2xl shadow-elevated hover:shadow-glow-blue transition-all flex items-center gap-4 group"
          id="btn-tambah-jadwal">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📝</div>
          <div className="text-left">
            <p className="font-bold text-sm">Tambah Jadwal</p>
            <p className="text-xs text-blue-200/60">Buat jadwal stase baru</p>
          </div>
        </button>
        <button onClick={handleGenerate} disabled={isGenerating}
          className="p-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-2xl shadow-elevated hover:shadow-glow-red transition-all flex items-center gap-4 group disabled:opacity-70"
          id="btn-generate-jadwal">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">AI</div>
          <div className="text-left">
            <p className="font-bold text-sm">{isGenerating ? 'Memproses...' : 'Generate Otomatis'}</p>
            <p className="text-xs text-red-100/80">Susun semua jadwal yang belum ada</p>
          </div>
        </button>
        <button onClick={fetchData}
          className="p-4 bg-white border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-slate-600 hover:text-blue-600 rounded-2xl shadow-soft hover:shadow-card transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-2xl transition-all">🔄</div>
          <div className="text-left">
            <p className="font-bold text-sm">Refresh Data</p>
            <p className="text-xs text-slate-400">Muat ulang data dari server</p>
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 animate-fade-in-up print:hidden">
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-lg shadow-md">📊</div>
            <div><p className="text-xl font-bold text-primary-900">{data.length}</p><p className="text-xs text-slate-500">Total</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center text-lg shadow-md">🟢</div>
            <div><p className="text-xl font-bold text-primary-900">{countBerlangsung}</p><p className="text-xs text-slate-500">Berlangsung</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-lg shadow-md">🔵</div>
            <div><p className="text-xl font-bold text-primary-900">{countAkanDatang}</p><p className="text-xs text-slate-500">Akan Datang</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-lg shadow-md">⚪</div>
            <div><p className="text-xl font-bold text-primary-900">{countSelesai}</p><p className="text-xs text-slate-500">Selesai</p></div>
          </div>
        </div>
      )}

      {/* View Toggles & Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 animate-fade-in-up print:hidden" style={{ animationDelay: '100ms' }}>
        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-max">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'calendar' ? 'bg-white text-primary-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📅 Tampilan Kalender
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'table' ? 'bg-white text-primary-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📋 Tampilan Tabel
          </button>
        </div>

        {/* Status Filter (only for table) */}
        {viewMode === 'table' && (
          <div className="flex gap-2 flex-wrap">
            {['all', 'Berlangsung', 'Akan Datang', 'Selesai'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === s
                    ? 'bg-primary-900 text-white shadow-md'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                }`}>
                {s === 'all' ? 'Semua' : s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-5 animate-fade-in-up h-[700px] overflow-x-auto pb-6">
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
              onSelectEvent={(event) => {
                if (event.type === 'jadwal') {
                  handleDetail(event.jadwalId);
                } else {
                  setSelectedHoliday({ title: event.title, start: event.start });
                  setShowHolidayModal(true);
                }
              }}
            />
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up print:shadow-none print:border-none print:m-0 print:p-0" style={{ animationDelay: '150ms' }}>
          {loading ? (
            <div className="p-16 text-center print:hidden">
              <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Memuat jadwal dari server...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-16 text-center print:hidden">
              <span className="text-5xl block mb-4">📅</span>
              <p className="text-slate-600 font-medium">Tidak ada jadwal ditemukan</p>
              <p className="text-sm text-slate-400 mt-1">Mulai dengan menambah jadwal baru</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between print:hidden">
                <p className="text-xs text-slate-500 font-medium">
                  Menampilkan <span className="text-primary-900 font-bold">{filteredData.length}</span> dari <span className="text-primary-900 font-bold">{data.length}</span> jadwal
                </p>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-md"
                >
                  🖨️ Cetak PDF
                </button>
              </div>
              <div className="overflow-x-auto pb-4">
                <table className="w-full min-w-max" id="table-jadwal">
                  <thead>
                    <tr className="bg-gradient-to-r from-rose-600 to-red-700 text-white">
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase whitespace-nowrap">No</th>
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase whitespace-nowrap">Kelompok</th>
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase whitespace-nowrap">Stase</th>
                      <th className="px-4 md:px-5 py-3.5 text-left text-xs font-semibold uppercase whitespace-nowrap">Periode</th>
                      <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase print:text-black whitespace-nowrap">Status</th>
                      <th className="px-4 md:px-5 py-3.5 text-center text-xs font-semibold uppercase print:hidden whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.map((j, i) => (
                      <tr key={j.id} className="hover:bg-red-50/20 transition-colors group">
                        <td className="px-4 md:px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{i + 1}</td>
                        <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-medium text-primary-900">{j.namaKelompok}</span>
                        </td>
                        <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                            {j.namaStase}
                          </span>
                        </td>
                        <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                          <div className="text-xs text-slate-600">
                            <span className="font-medium">{formatDateDisplay(j.tanggalMulai)}</span>
                            <span className="text-slate-400 mx-1.5">→</span>
                            <span className="font-medium">{formatDateDisplay(j.tanggalSelesai)}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-5 py-3.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(j.status)}`}>
                            {statusIcon(j.status)} {j.status}
                          </span>
                        </td>
                        <td className="px-4 md:px-5 py-3.5 print:hidden whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDetail(j.id)}
                              className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 transition-all duration-200 text-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 print:opacity-100"
                              title="Detail"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleDelete(j.id)}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200 text-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 print:opacity-100"
                              title="Hapus"
                            >
                              🗑️
                            </button>
                          </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4 animate-scale-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Jadwal?</h3>
              {selectedJadwal && (
                <p className="text-sm text-slate-600 font-medium mb-1">
                  {selectedJadwal.namaKelompok} — {selectedJadwal.namaStase}
                </p>
              )}
              <p className="text-sm text-slate-500">Data yang dihapus tidak dapat dikembalikan</p>
            </div>
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
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
              >
                {deleting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menghapus...</>
                ) : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailJadwal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-md mx-4 animate-scale-in">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">ℹ️</div>
                <h3 className="text-lg font-bold text-primary-900">Detail Jadwal</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">✕</button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Kelompok</p>
                <p className="font-semibold text-slate-800 text-lg">{detailJadwal.namaKelompok}</p>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Stase</p>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-semibold border border-purple-100 inline-block">
                  {detailJadwal.namaStase}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Tanggal Mulai</p>
                  <p className="font-medium text-slate-700">{formatDateDisplay(detailJadwal.tanggalMulai)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Tanggal Selesai</p>
                  <p className="font-medium text-slate-700">{formatDateDisplay(detailJadwal.tanggalSelesai)}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${statusColor(detailJadwal.status)}`}>
                  {statusIcon(detailJadwal.status)} {detailJadwal.status}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-all"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleDelete(detailJadwal.id);
                }}
                className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl text-sm transition-all border border-red-200 flex items-center justify-center gap-2"
              >
                🗑️ Hapus Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Holiday Modal */}
      {showHolidayModal && selectedHoliday && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4 animate-scale-in text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌴</span>
            </div>
            <h3 className="text-lg font-bold text-primary-900 mb-1">{selectedHoliday.title}</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">
              {formatDateDisplay(format(selectedHoliday.start, 'yyyy-MM-dd'))}
            </p>
            <button
              onClick={() => setShowHolidayModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
