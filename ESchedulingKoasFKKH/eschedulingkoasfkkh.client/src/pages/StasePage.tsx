import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface Stase {
  id: number;
  nama: string;
  durasi: string;
  lokasi: string;
  kapasitas: number;
  dosenPembimbing: string;
  status: 'Aktif' | 'Tidak Aktif';
}

const sampleData: Stase[] = [
  { id: 1, nama: 'Bedah Veteriner', durasi: '4 Minggu', lokasi: 'RS Hewan Univ', kapasitas: 8, dosenPembimbing: 'Dr. Siti Aminah', status: 'Aktif' },
  { id: 2, nama: 'Penyakit Dalam', durasi: '4 Minggu', lokasi: 'RS Hewan Univ', kapasitas: 6, dosenPembimbing: 'drh. Budi Hartono', status: 'Aktif' },
  { id: 3, nama: 'Reproduksi', durasi: '3 Minggu', lokasi: 'Lab Reproduksi', kapasitas: 8, dosenPembimbing: 'Dr. Rina Wulandari', status: 'Aktif' },
  { id: 4, nama: 'Parasitologi', durasi: '3 Minggu', lokasi: 'Lab Parasitologi', kapasitas: 10, dosenPembimbing: 'drh. Andi Prasetyo', status: 'Tidak Aktif' },
  { id: 5, nama: 'Patologi', durasi: '4 Minggu', lokasi: 'Lab Patologi', kapasitas: 8, dosenPembimbing: 'Dr. Hendra Wijaya', status: 'Aktif' },
];

export default function StasePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Stase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => { setTimeout(() => { setData(sampleData); setLoading(false); }, 600); }, []);

  const filteredData = data.filter(s =>
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || s.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmDelete = () => {
    if (selectedId) setData(data.filter(s => s.id !== selectedId));
    setShowDeleteModal(false); setSelectedId(null);
  };

  return (
    <Layout>
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-2xl shadow-md">🏥</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Kelola Stase</h1><p className="text-sm text-slate-500">Kelola data stase/rotasi klinik</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 mb-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input type="text" placeholder="Cari stase..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 transition-all" id="search-stase" />
          </div>
          <button onClick={() => navigate('/stase/tambah')} className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-glow-purple transition-all text-sm flex items-center gap-2" id="btn-tambah-stase">
            + Tambah Stase
          </button>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <div className="bg-white rounded-2xl shadow-card p-16 text-center"><div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-500 text-sm">Memuat data...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((stase, i) => (
              <div key={stase.id} className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-5 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform">🏥</div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stase.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{stase.status}</span>
                </div>
                <h3 className="text-lg font-bold text-primary-900 mb-2">{stase.nama}</h3>
                <div className="space-y-1.5 mb-4 text-xs text-slate-500">
                  <p>📍 {stase.lokasi}</p><p>⏱️ {stase.durasi}</p><p>👨‍🏫 {stase.dosenPembimbing}</p><p>👥 Kapasitas: {stase.kapasitas}</p>
                </div>
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-xl transition-all">✏️ Edit</button>
                  <button onClick={() => { setSelectedId(stase.id); setShowDeleteModal(true); }} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-all">🗑️ Hapus</button>
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
              <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Stase?</h3>
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
