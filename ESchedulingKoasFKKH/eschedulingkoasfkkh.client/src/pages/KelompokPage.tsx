import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface Kelompok {
  id: number;
  nama: string;
  jumlahAnggota: number;
  stase: string;
  periode: string;
  status: 'Aktif' | 'Selesai';
}

const sampleData: Kelompok[] = [
  { id: 1, nama: 'Kelompok 1', jumlahAnggota: 6, stase: 'Bedah Veteriner', periode: 'April 2026', status: 'Aktif' },
  { id: 2, nama: 'Kelompok 2', jumlahAnggota: 5, stase: 'Penyakit Dalam', periode: 'April 2026', status: 'Aktif' },
  { id: 3, nama: 'Kelompok 3', jumlahAnggota: 7, stase: 'Reproduksi', periode: 'April 2026', status: 'Aktif' },
  { id: 4, nama: 'Kelompok 4', jumlahAnggota: 6, stase: 'Patologi', periode: 'Maret 2026', status: 'Selesai' },
  { id: 5, nama: 'Kelompok 5', jumlahAnggota: 8, stase: 'Parasitologi', periode: 'April 2026', status: 'Aktif' },
];

const colors = [
  'from-blue-500 to-blue-600', 'from-emerald-500 to-green-600', 'from-purple-500 to-purple-600',
  'from-orange-500 to-orange-600', 'from-rose-500 to-red-600', 'from-cyan-500 to-cyan-600',
];

export default function KelompokPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Kelompok[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => { setTimeout(() => { setData(sampleData); setLoading(false); }, 600); }, []);

  const filteredData = data.filter(k =>
    k.nama.toLowerCase().includes(searchTerm.toLowerCase()) || k.stase.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmDelete = () => {
    if (selectedId) setData(data.filter(k => k.id !== selectedId));
    setShowDeleteModal(false); setSelectedId(null);
  };

  return (
    <Layout>
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-2xl shadow-md">👥</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Kelola Kelompok</h1><p className="text-sm text-slate-500">Buat dan kelola kelompok mahasiswa</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 mb-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input type="text" placeholder="Cari kelompok..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-all" id="search-kelompok" />
          </div>
          <button onClick={() => navigate('/kelompok/tambah')} className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-md hover:shadow-glow-orange transition-all text-sm flex items-center gap-2" id="btn-tambah-kelompok">
            + Buat Kelompok
          </button>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <div className="bg-white rounded-2xl shadow-card p-16 text-center"><div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-500 text-sm">Memuat data...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((kel, i) => (
              <div key={kel.id} className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`h-2 bg-gradient-to-r ${colors[i % colors.length]}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:scale-110 transition-transform`}>
                      {kel.nama.replace('Kelompok ', 'K')}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${kel.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{kel.status}</span>
                  </div>
                  <h3 className="text-lg font-bold text-primary-900 mb-1">{kel.nama}</h3>
                  <div className="space-y-1.5 mb-4 text-xs text-slate-500">
                    <p>🏥 Stase: {kel.stase}</p>
                    <p>👥 {kel.jumlahAnggota} Anggota</p>
                    <p>📅 {kel.periode}</p>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-xl transition-all">👁️ Detail</button>
                    <button className="flex-1 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-xl transition-all">✏️ Edit</button>
                    <button onClick={() => { setSelectedId(kel.id); setShowDeleteModal(true); }} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-all">🗑️ Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4 animate-scale-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><span className="text-3xl">⚠️</span></div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Kelompok?</h3>
              <p className="text-sm text-slate-500">Data yang dihapus tidak dapat dikembalikan</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm">Batal</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl shadow-md text-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
