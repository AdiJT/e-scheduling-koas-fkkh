import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from '../components/Layout';

export default function TambahDosenPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nip: '', nama: '', email: '', telepon: '', spesialisasi: '', pendidikan: '' });
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
    setTimeout(() => navigate('/dosen'), 1500);
  };

  return (
    <Layout>
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dosen')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-md">👨‍🏫</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Tambah Dosen</h1><p className="text-sm text-slate-500">Isi data dosen pembimbing baru</p></div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-8 text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✅</span></div>
            <h3 className="text-xl font-bold text-primary-900 mb-2">Berhasil!</h3>
            <p className="text-slate-500">Data dosen berhasil ditambahkan</p>
          </div>
        </div>
      )}

      <div className="max-w-3xl animate-fade-in-up">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden" id="form-tambah-dosen">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-green-50">
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2"><span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full" /> Data Dosen</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">NIP <span className="text-red-500">*</span></label>
                <input name="nip" value={form.nip} onChange={handleChange} required placeholder="Contoh: 198501012010"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input name="nama" value={form.nama} onChange={handleChange} required placeholder="Nama lengkap + gelar"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="email@univ.ac.id"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">No. Telepon</label>
                <input name="telepon" value={form.telepon} onChange={handleChange} placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Spesialisasi <span className="text-red-500">*</span></label>
                <select name="spesialisasi" value={form.spesialisasi} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all cursor-pointer">
                  <option value="">Pilih spesialisasi</option>
                  <option value="Bedah Veteriner">Bedah Veteriner</option>
                  <option value="Penyakit Dalam">Penyakit Dalam</option>
                  <option value="Reproduksi">Reproduksi</option>
                  <option value="Parasitologi">Parasitologi</option>
                  <option value="Patologi">Patologi</option>
                  <option value="Radiologi">Radiologi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pendidikan Terakhir</label>
                <select name="pendidikan" value={form.pendidikan} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all cursor-pointer">
                  <option value="">Pilih pendidikan</option>
                  <option value="S2">S2 (Magister)</option>
                  <option value="S3">S3 (Doktor)</option>
                  <option value="Profesor">Profesor</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/dosen')} className="px-6 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all text-sm">Batal</button>
            <button type="submit" disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-md hover:shadow-glow-green transition-all text-sm disabled:opacity-70 flex items-center gap-2" id="btn-submit-dosen">
              {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</> : '💾 Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
