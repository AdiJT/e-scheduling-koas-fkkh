/* eslint-disable react-hooks/set-state-in-effect */
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { jadwalApi, kelompokApi, staseApi, type Kelompok, type Stase } from '../services/api';
import { calculateEndDate, formatDateDisplay, getHolidaysInRange } from '../utils/holidays';

export default function TambahJadwalPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ idKelompok: '', idStase: '', tanggalMulai: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data from API for dropdowns
  const [kelompokList, setKelompokList] = useState<Kelompok[]>([]);
  const [staseList, setStaseList] = useState<Stase[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Calculated end date
  const [endDate, setEndDate] = useState<string>('');
  const [selectedStase, setSelectedStase] = useState<Stase | null>(null);

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [kelompoks, stases] = await Promise.all([
          kelompokApi.getAll(),
          staseApi.getAll(),
        ]);
        setKelompokList(kelompoks);
        setStaseList(stases);
      } catch {
        setErrors({ general: 'Gagal memuat data. Pastikan server backend berjalan.' });
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Calculate end date when stase or start date changes
  useEffect(() => {
    if (form.tanggalMulai && form.idStase) {
      const stase = staseList.find(s => s.id === parseInt(form.idStase));
      if (stase) {
        setSelectedStase(stase);
        const calculated = calculateEndDate(form.tanggalMulai, stase.waktu);
        setEndDate(calculated);
      }
    } else {
      setEndDate('');
      setSelectedStase(null);
    }
  }, [form.tanggalMulai, form.idStase, staseList]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      await jadwalApi.create({
        tanggalMulai: form.tanggalMulai,
        idKelompok: parseInt(form.idKelompok),
        idStase: parseInt(form.idStase),
      });
      setShowSuccess(true);
      setTimeout(() => navigate('/jadwal'), 1500);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; errors?: Record<string, string>; message?: string };
      if (apiErr?.errors) {
        setErrors(apiErr.errors);
      } else {
        setErrors({ general: apiErr?.message || 'Gagal menyimpan jadwal.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get holidays in the range for info display
  const holidaysInRange = endDate && form.tanggalMulai
    ? getHolidaysInRange(form.tanggalMulai, endDate)
    : [];

  // Unique holiday names
  const uniqueHolidays = [...new Map(holidaysInRange.map(h => [h.date, h])).values()];

  return (
    <Layout>
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/jadwal')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-2xl shadow-md">📅</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Tambah Jadwal</h1><p className="text-sm text-slate-500">Buat jadwal stase baru</p></div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-8 text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✅</span></div>
            <h3 className="text-xl font-bold text-primary-900 mb-2">Berhasil!</h3>
            <p className="text-slate-500">Jadwal berhasil ditambahkan</p>
          </div>
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in-down">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-sm text-red-700 flex-1">{errors.general}</p>
          <button onClick={() => setErrors({})} className="text-red-400 hover:text-red-600 text-lg">✕</button>
        </div>
      )}

      {loadingData ? (
        <div className="bg-white rounded-2xl shadow-card p-16 text-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Memuat data kelompok dan stase...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden" id="form-tambah-jadwal">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-red-50">
                <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2"><span className="w-1 h-5 bg-gradient-to-b from-rose-500 to-red-500 rounded-full" /> Data Jadwal</h2>
              </div>
              <div className="p-6 space-y-5">
                {/* Kelompok */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kelompok <span className="text-red-500">*</span></label>
                  <select
                    name="idKelompok"
                    value={form.idKelompok}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all cursor-pointer
                      ${errors.idKelompok ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  >
                    <option value="">Pilih kelompok</option>
                    {kelompokList.map(k => (
                      <option key={k.id} value={k.id}>
                        {k.nama} {k.idPembimbing ? '' : '(⚠️ Belum ada pembimbing)'}
                      </option>
                    ))}
                  </select>
                  {errors.idKelompok && <p className="text-xs text-red-500 mt-1">{errors.idKelompok}</p>}
                </div>

                {/* Stase */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stase <span className="text-red-500">*</span></label>
                  <select
                    name="idStase"
                    value={form.idStase}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all cursor-pointer
                      ${errors.idStase ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  >
                    <option value="">Pilih stase</option>
                    {staseList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.waktu} minggu - {s.jenis})
                      </option>
                    ))}
                  </select>
                  {errors.idStase && <p className="text-xs text-red-500 mt-1">{errors.idStase}</p>}
                </div>

                {/* Tanggal Mulai */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Mulai <span className="text-red-500">*</span></label>
                  <input
                    name="tanggalMulai"
                    type="date"
                    value={form.tanggalMulai}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all
                      ${errors.tanggalMulai ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  />
                  {errors.tanggalMulai && <p className="text-xs text-red-500 mt-1">{errors.tanggalMulai}</p>}
                </div>

                {/* Calculated End Date (Read-Only) */}
                {endDate && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 text-lg">📆</span>
                      <h4 className="text-sm font-semibold text-green-800">Tanggal Selesai (Otomatis)</h4>
                    </div>
                    <p className="text-lg font-bold text-green-700">{formatDateDisplay(endDate)}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Dihitung otomatis: {selectedStase?.waktu} minggu × 7 hari = {(selectedStase?.waktu || 0) * 7} hari
                      (tidak termasuk hari libur)
                    </p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button type="button" onClick={() => navigate('/jadwal')} className="px-6 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all text-sm">Batal</button>
                <button type="submit" disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-md hover:shadow-glow-red transition-all text-sm disabled:opacity-70 flex items-center gap-2" id="btn-submit-jadwal">
                  {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</> : '💾 Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>

          {/* Side Panel - Holidays Info */}
          <div className="space-y-4">
            {/* Schedule Preview */}
            {selectedStase && form.tanggalMulai && endDate && (
              <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <h3 className="text-sm font-bold text-primary-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                    Preview Jadwal
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Stase</span>
                    <span className="font-medium text-primary-900">{selectedStase.nama}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Durasi</span>
                    <span className="font-medium text-purple-600">{selectedStase.waktu} minggu</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Jenis</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedStase.jenis === 'Terpisah' ? 'bg-amber-100 text-amber-700' : 'bg-pink-100 text-pink-700'
                    }`}>{selectedStase.jenis}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Mulai</span>
                      <span className="font-medium text-green-600">{formatDateDisplay(form.tanggalMulai)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-slate-500">Selesai</span>
                      <span className="font-medium text-red-600">{formatDateDisplay(endDate)}</span>
                    </div>
                  </div>
                  {uniqueHolidays.length > 0 && (
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs text-orange-600 font-semibold mb-1">
                        ⚠️ {uniqueHolidays.length} hari libur dalam periode ini
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Holiday List */}
            {uniqueHolidays.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
                  <h3 className="text-sm font-bold text-primary-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
                    🗓️ Hari Libur ({uniqueHolidays.length})
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {uniqueHolidays.map((h, i) => (
                    <div key={i} className="px-4 py-2.5 border-b border-slate-50 flex items-center gap-3 text-xs hover:bg-orange-50/50">
                      <span className="text-orange-500">🔴</span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-700">{h.name}</p>
                        <p className="text-slate-400">{formatDateDisplay(h.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Keterangan</h4>
              <div className="space-y-1.5 text-xs text-blue-700">
                <p>• Tanggal selesai dihitung otomatis (<strong>7 hari per minggu</strong>)</p>
                <p>• <strong>Sabtu dan Minggu</strong> tetap dihitung sebagai hari kerja</p>
                <p>• <strong>Hari libur nasional</strong> tidak dihitung sebagai hari kerja</p>
                <p>• Dosen pembimbing otomatis dari kelompok yang dipilih</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
