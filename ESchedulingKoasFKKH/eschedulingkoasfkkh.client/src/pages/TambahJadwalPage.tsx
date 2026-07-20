/* eslint-disable react-hooks/set-state-in-effect */
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { kelompokApi, staseApi, pembimbingApi, jadwalApi, type Kelompok, type Stase, type Pembimbing } from '../services/api';
import { calculateEndDate, formatDateDisplay } from '../utils/holidays';
import { SaveIcon, JadwalIcon, InfoIcon, DosenIcon } from '../components/Icons';

export default function TambahJadwalPage() {
  const navigate = useNavigate();
  const [kelompokList, setKelompokList] = useState<Kelompok[]>([]);
  const [staseList, setStaseList] = useState<Stase[]>([]);
  const [pembimbingList, setPembimbingList] = useState<Pembimbing[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    tanggalMulai: '',
    idKelompok: '',
    idStase: '',
    idPembimbing: '',
  });

  // Single Dosen per Sub-Stase: Record<idSubStase, string (idPembimbing)>
  const [subStaseDosen, setSubStaseDosen] = useState<Record<number, string>>({});
  const [selectedStase, setSelectedStase] = useState<Stase | null>(null);
  const [endDate, setEndDate] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [kelompokData, staseData, pembimbingData] = await Promise.all([
          kelompokApi.getAll(),
          staseApi.getAll(),
          pembimbingApi.getAll(),
        ]);
        setKelompokList(kelompokData);
        setStaseList(staseData);
        setPembimbingList(pembimbingData);
      } catch (err) {
        console.error("Failed to load initial data for TambahJadwal:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Calculate end date & set sub-stase default pembimbing when stase or start date changes
  useEffect(() => {
    if (form.tanggalMulai && form.idStase) {
      const stase = staseList.find(s => s.id === parseInt(form.idStase));
      if (stase) {
        setSelectedStase(stase);
        const calculated = calculateEndDate(form.tanggalMulai, stase.waktu);
        setEndDate(calculated);

        // Pre-fill initial pembimbing for sub-stases if available
        if (stase.daftarSubStase && stase.daftarSubStase.length > 0) {
          const initialSubs: Record<number, string> = {};
          stase.daftarSubStase.forEach(sub => {
            const firstDefaultId = sub.daftarDefaultPembimbing && sub.daftarDefaultPembimbing.length > 0
              ? sub.daftarDefaultPembimbing[0].id.toString()
              : (sub.idDefaultPembimbing ? sub.idDefaultPembimbing.toString() : '');
            initialSubs[sub.id] = firstDefaultId;
          });
          setSubStaseDosen(initialSubs);
        } else {
          setSubStaseDosen({});
        }
      }
    } else {
      setEndDate('');
      setSelectedStase(null);
      setSubStaseDosen({});
    }
  }, [form.tanggalMulai, form.idStase, staseList]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubStaseDosenChange = (subStaseId: number, idPembimbing: string) => {
    setSubStaseDosen(prev => ({
      ...prev,
      [subStaseId]: idPembimbing
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const daftarSubStasePembimbing = selectedStase?.daftarSubStase && selectedStase.daftarSubStase.length > 0
      ? selectedStase.daftarSubStase.map(sub => ({
          idSubStase: sub.id,
          idPembimbing: subStaseDosen[sub.id] ? parseInt(subStaseDosen[sub.id]) : null
        }))
      : undefined;

    try {
      await jadwalApi.create({
        tanggalMulai: form.tanggalMulai,
        idKelompok: parseInt(form.idKelompok),
        idStase: parseInt(form.idStase),
        idPembimbing: form.idPembimbing ? parseInt(form.idPembimbing) : null,
        daftarSubStasePembimbing
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

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/jadwal')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md">
            <JadwalIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Tambah Jadwal Baru</h1>
            <p className="text-sm text-slate-500">Susun jadwal stase untuk kelompok mahasiswa</p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 animate-fade-in">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-bold text-sm">Jadwal berhasil disimpan!</p>
            <p className="text-xs text-emerald-600">Mengalihkan ke halaman kelola jadwal...</p>
          </div>
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 animate-fade-in">
          <InfoIcon className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm font-medium">{errors.general}</p>
        </div>
      )}

      {loadingData ? (
        <div className="bg-white rounded-2xl shadow-card p-16 text-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Memuat data kelompok, stase, dan dosen...</p>
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
                        {k.nama}
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
                        {s.nama} ({s.waktu} minggu - {s.jenis}) {s.daftarSubStase && s.daftarSubStase.length > 0 ? '✨ Has Sub-Stases' : ''}
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

                {/* Dosen Pembimbing untuk Stase Standar */}
                {selectedStase && (!selectedStase.daftarSubStase || selectedStase.daftarSubStase.length === 0) && (() => {
                  const staseDosenList = selectedStase.daftarPembimbing && selectedStase.daftarPembimbing.length > 0
                    ? pembimbingList.filter(p => selectedStase.daftarPembimbing?.some(sp => sp.id === p.id))
                    : pembimbingList;

                  return (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <DosenIcon className="w-4 h-4 text-emerald-600" />
                          <span>Dosen Pembimbing Stase</span>
                        </span>
                        {selectedStase.daftarPembimbing && selectedStase.daftarPembimbing.length > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {staseDosenList.length} Dosen Terdaftar di Stase Ini
                          </span>
                        )}
                      </label>
                      <select
                        name="idPembimbing"
                        value={form.idPembimbing}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="">Pilih Dosen Pembimbing (opsional)</option>
                        {staseDosenList.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nama} (NIP: {p.nip})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 mt-1">Dosen yang akan membimbing kelompok ini khusus pada stase {selectedStase.nama}</p>
                    </div>
                  );
                })()}

                {/* Dosen Pembimbing untuk Stase KODIL (Sub-Stase) - Single Select Dropdown */}
                {selectedStase?.daftarSubStase && selectedStase.daftarSubStase.length > 0 && (() => {
                  const staseDosenList = selectedStase.daftarPembimbing && selectedStase.daftarPembimbing.length > 0
                    ? pembimbingList.filter(p => selectedStase.daftarPembimbing?.some(sp => sp.id === p.id))
                    : pembimbingList;

                  return (
                    <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">✨</div>
                          <div>
                            <h3 className="text-sm font-bold text-purple-950">Dosen Pembimbing Spesialis Sub-Stase {selectedStase.nama}</h3>
                            <p className="text-xs text-purple-700">Pilih 1 dosen penanggung jawab untuk tiap sub-stase rotasi kelompok ini</p>
                          </div>
                        </div>
                        {selectedStase.daftarPembimbing && selectedStase.daftarPembimbing.length > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            {staseDosenList.length} Dosen Terdaftar
                          </span>
                        )}
                      </div>

                      <div className="space-y-3 pt-2">
                        {selectedStase.daftarSubStase.map(sub => {
                          const subAvailableDosen = sub.daftarDefaultPembimbing && sub.daftarDefaultPembimbing.length > 0
                            ? pembimbingList.filter(p => sub.daftarDefaultPembimbing?.some(dp => dp.id === p.id))
                            : staseDosenList;

                          return (
                            <div key={sub.id} className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">{sub.urutan}</span>
                                <span className="text-sm font-bold text-slate-800">{sub.nama}</span>
                              </div>
                              <select
                                value={subStaseDosen[sub.id] || ''}
                                onChange={(e) => handleSubStaseDosenChange(sub.id, e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-purple-500 focus:bg-white cursor-pointer min-w-[220px]"
                              >
                                <option value="">Pilih Dosen Spesialis</option>
                                {subAvailableDosen.map(p => (
                                  <option key={p.id} value={p.id}>{p.nama}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

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
                  {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</> : <><SaveIcon className="w-5 h-5" /> Simpan Jadwal</>}
                </button>
              </div>
            </form>
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-6">
              <h3 className="text-base font-bold text-primary-900 mb-3 flex items-center gap-2">
                <span className="text-lg">💡</span> Petunjuk Penjadwalan
              </h3>
              <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Durasi Stase:</strong> Tanggal selesai dihitung otomatis berdasarkan jumlah minggu durasi stase.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Sub-Stase Kodil:</strong> Setiap kelompok ditugaskan <strong>1 Dosen Spesialis</strong> untuk masing-masing sub-stase rotasi.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Bentrokan:</strong> Sistem akan memeriksa konflik tanggal dengan jadwal stase terpisah yang sedang berjalan.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
