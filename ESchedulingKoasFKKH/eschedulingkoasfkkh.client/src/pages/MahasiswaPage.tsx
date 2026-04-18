import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

interface Mahasiswa {
  id: number;
  nim: string;
  nama: string;
  angkatan: string;
  status: 'Aktif' | 'Tidak Aktif';
}

// Sample data
const sampleData: Mahasiswa[] = [
  { id: 1, nim: '2023001', nama: 'Ahmad Fauzi Rahman', angkatan: '2023', status: 'Aktif' },
  { id: 2, nim: '2023002', nama: 'Siti Nurhaliza', angkatan: '2023', status: 'Aktif' },
  { id: 3, nim: '2023003', nama: 'Budi Santoso', angkatan: '2023', status: 'Aktif' },
  { id: 4, nim: '2022001', nama: 'Dewi Lestari', angkatan: '2022', status: 'Aktif' },
  { id: 5, nim: '2022002', nama: 'Rizki Pratama', angkatan: '2022', status: 'Tidak Aktif' },
  { id: 6, nim: '2023004', nama: 'Nurul Hidayah', angkatan: '2023', status: 'Aktif' },
];

export default function MahasiswaPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData(sampleData);
      setLoading(false);
    }, 600);
  }, []);

  const filteredData = data.filter(mhs => {
    const matchSearch = mhs.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mhs.nim.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || mhs.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = (id: number) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedId) {
      setData(data.filter(m => m.id !== selectedId));
    }
    setShowDeleteModal(false);
    setSelectedId(null);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all duration-200"
          >
            ←
          </button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl shadow-md">
            👨‍🎓
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Kelola Mahasiswa</h1>
            <p className="text-sm text-slate-500">Tambah, edit, atau hapus data mahasiswa KOAS</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-4 mb-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Cari mahasiswa berdasarkan nama atau NIM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400
                focus:outline-none focus:border-blue-400 focus:bg-white focus:shadow-sm transition-all duration-200"
              id="search-mahasiswa"
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 
              focus:outline-none focus:border-blue-400 transition-all duration-200 cursor-pointer"
            id="filter-status"
          >
            <option value="all">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>

          {/* Add Button */}
          <button
            onClick={() => navigate('/mahasiswa/tambah')}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
              text-white font-semibold rounded-xl shadow-md hover:shadow-glow-blue 
              transition-all duration-300 active:scale-95 text-sm flex items-center gap-2 whitespace-nowrap"
            id="btn-tambah-mahasiswa"
          >
            <span>+</span> Tambah Mahasiswa
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Memuat data mahasiswa...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-5xl block mb-4">📋</span>
            <p className="text-slate-600 font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan menambah mahasiswa baru'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header Info */}
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="text-primary-900 font-bold">{filteredData.length}</span> dari <span className="text-primary-900 font-bold">{data.length}</span> mahasiswa
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" id="table-mahasiswa">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-900 to-blue-800 text-white">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">No</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">NIM</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Nama Mahasiswa</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Angkatan</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((mhs, index) => (
                    <tr key={mhs.id} className="hover:bg-blue-50/30 transition-colors duration-150 group">
                      <td className="px-5 py-3.5 text-sm text-slate-500">{index + 1}</td>
                      <td className="px-5 py-3.5 text-sm font-mono text-slate-600">{mhs.nim}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {mhs.nama.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-primary-900">{mhs.nama}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{mhs.angkatan}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          mhs.status === 'Aktif'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {mhs.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 transition-all duration-200 text-sm"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(mhs.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200 text-sm"
                            title="Hapus"
                          >
                            🗑️
                          </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4 animate-scale-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">Hapus Mahasiswa?</h3>
              <p className="text-sm text-slate-500">Data yang dihapus tidak dapat dikembalikan</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200 text-sm"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-md hover:shadow-glow-red transition-all duration-200 text-sm"
                id="btn-confirm-delete"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}