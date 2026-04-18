import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from '../components/Layout';
import { staseApi } from '../services/api';

export default function TambahStasePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', waktu: '', jenis: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      await staseApi.create({
        nama: form.nama,
        waktu: parseInt(form.waktu) || 0,
        jenis: form.jenis,
      });
      setShowSuccess(true);
      setTimeout(() => navigate('/stase'), 1500);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; errors?: Record<string, string>; message?: string };
      if (apiErr?.status === 400 && apiErr?.errors) {
        setErrors(apiErr.errors);
      } else {
        setErrors({ general: apiErr?.message || 'Gagal menyimpan data. Pastikan server backend berjalan.' });
      }
    } finally {
      setIsSubmitting(false);
    }
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

      {/* General Error */}
      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in-down">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-sm text-red-700 flex-1">{errors.general}</p>
          <button onClick={() => setErrors({})} className="text-red-400 hover:text-red-600 text-lg">✕</button>
        </div>
      )}

      <div className="max-w-3xl animate-fade-in-up">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden" id="form-tambah-stase">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-violet-50">
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2"><span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-violet-500 rounded-full" /> Data Stase</h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Nama Stase */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Stase <span className="text-red-500">*</span></label>
              <input
                name="nama"
                value={form.nama}
                onChange={handleChange}
                required
                placeholder="Contoh: KODIL, PDHK, Magang Profesi"
                className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all
                  ${errors.nama ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Waktu */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Waktu (Minggu) <span className="text-red-500">*</span></label>
                <input
                  name="waktu"
                  type="number"
                  min="1"
                  value={form.waktu}
                  onChange={handleChange}
                  required
                  placeholder="Durasi dalam minggu"
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all
                    ${errors.waktu ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.waktu && <p className="text-xs text-red-500 mt-1">{errors.waktu}</p>}
              </div>

              {/* Jenis */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jenis Stase <span className="text-red-500">*</span></label>
                <select
                  name="jenis"
                  value={form.jenis}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer
                    ${errors.jenis ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                >
                  <option value="">Pilih jenis stase</option>
                  <option value="Terpisah">🔶 Terpisah</option>
                  <option value="Bersamaan">🔷 Bersamaan</option>
                </select>
                {errors.jenis && <p className="text-xs text-red-500 mt-1">{errors.jenis}</p>}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-purple-800 mb-2">ℹ️ Keterangan Jenis Stase</h4>
              <div className="space-y-1.5 text-xs text-purple-700">
                <p><span className="font-semibold">🔶 Terpisah:</span> Stase dilaksanakan secara individual oleh masing-masing kelompok dalam waktu yang berbeda.</p>
                <p><span className="font-semibold">🔷 Bersamaan:</span> Stase dilaksanakan bersamaan oleh semua kelompok dalam waktu yang sama.</p>
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
