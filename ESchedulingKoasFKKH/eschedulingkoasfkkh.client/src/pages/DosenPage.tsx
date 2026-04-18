import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface Dosen {
  id: number;
  nip: string;
  nama: string;
  spesialisasi: string;
  email: string;
  status: 'Aktif' | 'Tidak Aktif';
}

const sampleData: Dosen[] = [
  { id: 1, nip: '198501012010', nama: 'Dr. Siti Aminah, drh., M.Vet', spesialisasi: 'Bedah Veteriner', email: 'siti.aminah@univ.ac.id', status: 'Aktif' },
  { id: 2, nip: '198703152011', nama: 'drh. Budi Hartono, M.Si', spesialisasi: 'Penyakit Dalam', email: 'budi.hartono@univ.ac.id', status: 'Aktif' },
  { id: 3, nip: '199001202012', nama: 'Dr. Rina Wulandari, drh., Ph.D', spesialisasi: 'Reproduksi', email: 'rina.w@univ.ac.id', status: 'Aktif' },
  { id: 4, nip: '198805102013', nama: 'drh. Andi Prasetyo, M.Vet', spesialisasi: 'Parasitologi', email: 'andi.p@univ.ac.id', status: 'Tidak Aktif' },
  { id: 5, nip: '198912252014', nama: 'Dr. Hendra Wijaya, drh., M.Si', spesialisasi: 'Patologi', email: 'hendra.w@univ.ac.id', status: 'Aktif' },
];

export default function DosenPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setData(sampleData);
      setLoading(false);
    }, 600);
  }, []);

  const filteredData = data.filter(d =>
    d.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.nip.includes(searchTerm) ||
    d.spesialisasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: number) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedId) setData(data.filter(d => d.id !== selectedId));
    setShowDeleteModal(false);
    setSelectedId(null);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all duration-200">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-md">👨‍🏫</div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Kelola Dosen</h1>
            <p className="text-sm text-slate-500">Tambah, edit, atau hapus data dosen pembimbing</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 mb-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text" placeholder="Cari dosen berdasarkan nama, NIP, atau spesialisasi..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-green-400 focus:bg-white focus:shadow-sm transition-all"
              id="search-dosen"
            />
          </div>
          <button onClick={() => navigate('/dosen/tambah')}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-md hover:shadow-glow-green transition-all duration-300 active:scale-95 text-sm flex items-center gap-2 whitespace-nowrap"
            id="btn-tambah-dosen">
            <span>+</span> Tambah Dosen
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Memuat data dosen...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-5xl block mb-4">👨‍🏫</span>
            <p className="text-slate-600 font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">Mulai dengan menambah dosen baru</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="text-primary-900 font-bold">{filteredData.length}</span> dari <span className="text-primary-900 font-bold">{data.length}</span> dosen
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" id="table-dosen">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">No</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">NIP</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Nama Dosen</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Spesialisasi</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((dsn, index) => (
                    <tr key={dsn.id} className="hover:bg-green-50/30 transition-colors duration-150 group">
                      <td className="px-5 py-3.5 text-sm text-slate-500">{index + 1}</td>
                      <td className="px-5 py-3.5 text-sm font-mono text-slate-600">{dsn.nip}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {dsn.nama.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-primary-900">{dsn.nama}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">{dsn.spesialisasi}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{dsn.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${dsn.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {dsn.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 transition-all text-sm" title="Edit">✏️</button>
                          <button onClick={() => handleDelete(dsn.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all text-sm" title="Hapus">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4 animate-scale-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><span className="text-3xl">⚠️</span></div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Dosen?</h3>
              <p className="text-sm text-slate-500">Data yang dihapus tidak dapat dikembalikan</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm">Batal</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-md hover:shadow-glow-red transition-all text-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
