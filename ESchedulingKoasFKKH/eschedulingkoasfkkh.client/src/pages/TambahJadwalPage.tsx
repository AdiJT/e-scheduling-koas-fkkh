import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from '../components/Layout';

export default function TambahJadwalPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ kelompok: '', stase: '', dosen: '', tanggalMulai: '', tanggalSelesai: '', hari: '', jam: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSubmitting(false);
    setShowSuccess(true);
    setTimeout(() => navigate('/jadwal'), 1500);
  };

  return (
    <Layout>
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/jadwal')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-2xl shadow-md">📅</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Tambah Jadwal</h1><p className="text-sm text-slate-500">Buat jadwal stase secara manual</p></div>
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

      <div className="max-w-3xl animate-fade-in-up">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden" id="form-tambah-jadwal">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-red-50">
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2"><span className="w-1 h-5 bg-gradient-to-b from-rose-500 to-red-500 rounded-full" /> Data Jadwal</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kelompok <span className="text-red-500">*</span></label>
                <select name="kelompok" value={form.kelompok} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all cursor-pointer">
                  <option value="">Pilih kelompok</option>
                  <option value="Kelompok 1">Kelompok 1</option><option value="Kelompok 2">Kelompok 2</option>
                  <option value="Kelompok 3">Kelompok 3</option><option value="Kelompok 4">Kelompok 4</option>
                  <option value="Kelompok 5">Kelompok 5</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stase <span className="text-red-500">*</span></label>
                <select name="stase" value={form.stase} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all cursor-pointer">
                  <option value="">Pilih stase</option>
                  <option value="Bedah Veteriner">Bedah Veteriner</option><option value="Penyakit Dalam">Penyakit Dalam</option>
                  <option value="Reproduksi">Reproduksi</option><option value="Patologi">Patologi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dosen Pembimbing</label>
                <select name="dosen" value={form.dosen} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all cursor-pointer">
                  <option value="">Pilih dosen</option>
                  <option value="Dr. Siti Aminah">Dr. Siti Aminah</option>
                  <option value="drh. Budi Hartono">drh. Budi Hartono</option>
                  <option value="Dr. Rina Wulandari">Dr. Rina Wulandari</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hari <span className="text-red-500">*</span></label>
                <select name="hari" value={form.hari} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all cursor-pointer">
                  <option value="">Pilih hari</option>
                  <option value="Senin-Jumat">Senin - Jumat</option><option value="Senin-Kamis">Senin - Kamis</option>
                  <option value="Selasa-Jumat">Selasa - Jumat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Mulai <span className="text-red-500">*</span></label>
                <input name="tanggalMulai" type="date" value={form.tanggalMulai} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Selesai <span className="text-red-500">*</span></label>
                <input name="tanggalSelesai" type="date" value={form.tanggalSelesai} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jam</label>
                <input name="jam" value={form.jam} onChange={handleChange} placeholder="Contoh: 08:00-12:00"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all" />
              </div>
            </div>
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
    </Layout>
  );
}
