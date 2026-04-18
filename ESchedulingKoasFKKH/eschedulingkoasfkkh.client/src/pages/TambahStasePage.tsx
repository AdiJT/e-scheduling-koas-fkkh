import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from '../components/Layout';

export default function TambahStasePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', durasi: '', lokasi: '', kapasitas: '', dosen: '' });
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
    setTimeout(() => navigate('/stase'), 1500);
  };

  return (
    <Layout>
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/stase')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-2xl shadow-md">🏥</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Tambah Stase</h1><p className="text-sm text-slate-500">Tambahkan stase/rotasi klinik baru</p></div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-8 text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✅</span></div>
            <h3 className="text-xl font-bold text-primary-900 mb-2">Berhasil!</h3>
            <p className="text-slate-500">Data stase berhasil ditambahkan</p>
          </div>
        </div>
      )}

      <div className="max-w-3xl animate-fade-in-up">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden" id="form-tambah-stase">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-violet-50">
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2"><span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-violet-500 rounded-full" /> Data Stase</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Stase <span className="text-red-500">*</span></label>
                <input name="nama" value={form.nama} onChange={handleChange} required placeholder="Contoh: Bedah Veteriner"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Durasi <span className="text-red-500">*</span></label>
                <select name="durasi" value={form.durasi} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer">
                  <option value="">Pilih durasi</option>
                  <option value="2 Minggu">2 Minggu</option><option value="3 Minggu">3 Minggu</option><option value="4 Minggu">4 Minggu</option><option value="6 Minggu">6 Minggu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kapasitas <span className="text-red-500">*</span></label>
                <input name="kapasitas" type="number" value={form.kapasitas} onChange={handleChange} required placeholder="Jumlah mahasiswa"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lokasi <span className="text-red-500">*</span></label>
                <input name="lokasi" value={form.lokasi} onChange={handleChange} required placeholder="Lokasi stase"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dosen Pembimbing</label>
                <select name="dosen" value={form.dosen} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer">
                  <option value="">Pilih dosen</option>
                  <option value="Dr. Siti Aminah">Dr. Siti Aminah</option>
                  <option value="drh. Budi Hartono">drh. Budi Hartono</option>
                  <option value="Dr. Rina Wulandari">Dr. Rina Wulandari</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/stase')} className="px-6 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all text-sm">Batal</button>
            <button type="submit" disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-glow-purple transition-all text-sm disabled:opacity-70 flex items-center gap-2" id="btn-submit-stase">
              {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</> : '💾 Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
