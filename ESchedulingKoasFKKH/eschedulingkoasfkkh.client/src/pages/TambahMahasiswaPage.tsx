import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from '../components/Layout';

export default function TambahMahasiswaPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nim: '', nama: '', email: '', telepon: '', angkatan: '', alamat: '', jenisKelamin: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSubmitting(false);
    setShowSuccess(true);
    setTimeout(() => navigate('/mahasiswa'), 1500);
  };

  return (
    <Layout>
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/mahasiswa')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl shadow-md">👨‍🎓</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Tambah Mahasiswa</h1><p className="text-sm text-slate-500">Isi data mahasiswa baru</p></div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-8 text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✅</span></div>
            <h3 className="text-xl font-bold text-primary-900 mb-2">Berhasil!</h3>
            <p className="text-slate-500">Data mahasiswa berhasil ditambahkan</p>
          </div>
        </div>
      )}

      <div className="max-w-3xl animate-fade-in-up">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden" id="form-tambah-mahasiswa">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50">
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2"><span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" /> Data Mahasiswa</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">NIM <span className="text-red-500">*</span></label>
                <input name="nim" value={form.nim} onChange={handleChange} required placeholder="Contoh: 2023001"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input name="nama" value={form.nama} onChange={handleChange} required placeholder="Nama lengkap mahasiswa"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">No. Telepon</label>
                <input name="telepon" value={form.telepon} onChange={handleChange} placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Angkatan <span className="text-red-500">*</span></label>
                <select name="angkatan" value={form.angkatan} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer">
                  <option value="">Pilih angkatan</option>
                  <option value="2023">2023</option><option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jenis Kelamin <span className="text-red-500">*</span></label>
                <select name="jenisKelamin" value={form.jenisKelamin} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer">
                  <option value="">Pilih jenis kelamin</option>
                  <option value="L">Laki-laki</option><option value="P">Perempuan</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat</label>
              <textarea name="alamat" value={form.alamat} onChange={handleChange} rows={3} placeholder="Alamat lengkap mahasiswa"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none" />
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/mahasiswa')} className="px-6 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all text-sm">Batal</button>
            <button type="submit" disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-glow-blue transition-all text-sm disabled:opacity-70 flex items-center gap-2" id="btn-submit-mahasiswa">
              {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</> : '💾 Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
