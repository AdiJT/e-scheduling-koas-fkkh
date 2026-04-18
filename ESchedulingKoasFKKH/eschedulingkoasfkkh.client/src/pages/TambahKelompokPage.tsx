import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { kelompokApi, mahasiswaApi, type Mahasiswa } from '../services/api';

export default function TambahKelompokPage() {
  const navigate = useNavigate();
  const [nama, setNama] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Mahasiswa states
  const [availableMahasiswa, setAvailableMahasiswa] = useState<Mahasiswa[]>([]);
  const [selectedMahasiswaIds, setSelectedMahasiswaIds] = useState<number[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const mhs = await mahasiswaApi.getAll();
        setAvailableMahasiswa(mhs.filter(m => !m.idKelompok));
      } catch {
        setErrors({ general: 'Gagal memuat data mahasiswa.' });
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleCheckboxChange = (id: number) => {
    setSelectedMahasiswaIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedMahasiswaIds.length === availableMahasiswa.length) {
      setSelectedMahasiswaIds([]);
    } else {
      setSelectedMahasiswaIds(availableMahasiswa.map(m => m.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // 1. Create Kelompok
      const newKelompok = await kelompokApi.create({ nama });
      
      // 2. Add selected members if any
      if (selectedMahasiswaIds.length > 0) {
        await Promise.all(
          selectedMahasiswaIds.map(mhsId => kelompokApi.tambahAnggota(newKelompok.id, mhsId))
        );
      }

      setShowSuccess(true);
      setTimeout(() => navigate('/kelompok'), 1500);
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
          <button onClick={() => navigate('/kelompok')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-2xl shadow-md">👥</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Buat Kelompok</h1><p className="text-sm text-slate-500">Buat kelompok dan tambahkan anggota</p></div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-8 text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✅</span></div>
            <h3 className="text-xl font-bold text-primary-900 mb-2">Berhasil!</h3>
            <p className="text-slate-500">Kelompok berhasil dibuat dan anggota ditambahkan</p>
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

      <div className="max-w-4xl animate-fade-in-up">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden" id="form-tambah-kelompok">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2"><span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" /> Data Kelompok</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Kiri: Nama Kelompok */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Kelompok <span className="text-red-500">*</span></label>
              <input
                value={nama}
                onChange={(e) => { setNama(e.target.value); if (errors.nama) setErrors({ ...errors, nama: '' }); }}
                required
                placeholder="Contoh: Kelompok 6"
                className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all
                  ${errors.nama ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
              
              <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-orange-800 mb-2">ℹ️ Informasi</h4>
                <p className="text-xs text-orange-700 leading-relaxed">
                  Pilih mahasiswa yang tersedia pada daftar di samping untuk langsung memasukkan mereka ke dalam kelompok ini. Dosen pembimbing dapat ditentukan nanti di halaman detail kelompok.
                </p>
              </div>
            </div>

            {/* Kanan: Daftar Mahasiswa Checkbox */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Anggota Kelompok</label>
                {!loadingData && availableMahasiswa.length > 0 && (
                  <button type="button" onClick={selectAll} className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                    {selectedMahasiswaIds.length === availableMahasiswa.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </button>
                )}
              </div>
              
              <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col h-[300px]">
                {loadingData ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
                    <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-2" />
                    <span className="text-sm">Memuat data...</span>
                  </div>
                ) : availableMahasiswa.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 text-center">
                    <span className="text-3xl mb-2">🤷‍♂️</span>
                    <span className="text-sm">Tidak ada mahasiswa yang belum memiliki kelompok.</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-2">
                    {availableMahasiswa.map(mhs => (
                      <label key={mhs.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50/50 cursor-pointer transition-colors border border-transparent hover:border-orange-100">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedMahasiswaIds.includes(mhs.id)}
                            onChange={() => handleCheckboxChange(mhs.id)}
                            className="peer w-5 h-5 appearance-none border-2 border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500/20 checked:border-orange-500 checked:bg-orange-500 transition-all cursor-pointer"
                          />
                          <svg className="absolute w-3.5 h-3.5 text-white left-[3px] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 peer-checked:text-orange-700">{mhs.nama}</p>
                          <p className="text-xs text-slate-500 font-mono">{mhs.nim}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {/* Footer Count */}
                <div className="p-3 border-t border-slate-200 bg-white text-xs font-semibold text-slate-600 text-center">
                  <span className="text-orange-600">{selectedMahasiswaIds.length}</span> mahasiswa dipilih
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/kelompok')} className="px-6 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all text-sm">Batal</button>
            <button type="submit" disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-md hover:shadow-glow-orange transition-all text-sm disabled:opacity-70 flex items-center gap-2" id="btn-submit-kelompok">
              {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</> : '💾 Buat Kelompok & Tambah Anggota'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
