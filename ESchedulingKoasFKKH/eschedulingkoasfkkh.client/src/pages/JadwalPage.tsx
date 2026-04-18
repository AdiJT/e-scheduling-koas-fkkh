import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface Jadwal {
  id: number;
  kelompok: string;
  stase: string;
  dosen: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  hari: string;
  jam: string;
  status: 'Berlangsung' | 'Akan Datang' | 'Selesai';
}

const sampleData: Jadwal[] = [
  { id: 1, kelompok: 'Kelompok 1', stase: 'Bedah Veteriner', dosen: 'Dr. Siti Aminah', tanggalMulai: '2026-04-21', tanggalSelesai: '2026-05-18', hari: 'Senin-Jumat', jam: '08:00-12:00', status: 'Berlangsung' },
  { id: 2, kelompok: 'Kelompok 2', stase: 'Penyakit Dalam', dosen: 'drh. Budi Hartono', tanggalMulai: '2026-04-21', tanggalSelesai: '2026-05-18', hari: 'Senin-Jumat', jam: '13:00-17:00', status: 'Akan Datang' },
  { id: 3, kelompok: 'Kelompok 3', stase: 'Reproduksi', dosen: 'Dr. Rina Wulandari', tanggalMulai: '2026-04-14', tanggalSelesai: '2026-05-04', hari: 'Senin-Kamis', jam: '08:00-12:00', status: 'Berlangsung' },
  { id: 4, kelompok: 'Kelompok 4', stase: 'Patologi', dosen: 'Dr. Hendra Wijaya', tanggalMulai: '2026-03-17', tanggalSelesai: '2026-04-13', hari: 'Senin-Jumat', jam: '08:00-12:00', status: 'Selesai' },
  { id: 5, kelompok: 'Kelompok 5', stase: 'Parasitologi', dosen: 'drh. Andi Prasetyo', tanggalMulai: '2026-05-01', tanggalSelesai: '2026-05-21', hari: 'Selasa-Jumat', jam: '09:00-13:00', status: 'Akan Datang' },
];

export default function JadwalPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => { setTimeout(() => { setData(sampleData); setLoading(false); }, 600); }, []);

  const filteredData = data.filter(j => filterStatus === 'all' || j.status === filterStatus);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsGenerating(false);
    alert('Jadwal berhasil di-generate!');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Berlangsung': return 'bg-green-100 text-green-700 border-green-200';
      case 'Akan Datang': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Selesai': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <Layout>
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-2xl shadow-md">📅</div>
          <div><h1 className="text-2xl font-bold text-primary-900">Kelola Jadwal</h1><p className="text-sm text-slate-500">Generate dan kelola jadwal stase</p></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 animate-fade-in-up">
        <button onClick={handleGenerate} disabled={isGenerating}
          className="p-4 bg-gradient-to-r from-primary-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white rounded-2xl shadow-elevated hover:shadow-glow-blue transition-all flex items-center gap-4 group disabled:opacity-70"
          id="btn-generate-jadwal">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            {isGenerating ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '🤖'}
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">{isGenerating ? 'Generating...' : 'Generate Jadwal Otomatis'}</p>
            <p className="text-xs text-blue-200/60">AI-powered scheduling</p>
          </div>
        </button>
        <button onClick={() => navigate('/jadwal/tambah')}
          className="p-4 bg-white border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-slate-600 hover:text-blue-600 rounded-2xl shadow-soft hover:shadow-card transition-all flex items-center gap-4 group"
          id="btn-tambah-jadwal">
          <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-2xl transition-all">📝</div>
          <div className="text-left">
            <p className="font-bold text-sm">Tambah Jadwal Manual</p>
            <p className="text-xs text-slate-400">Input jadwal secara manual</p>
          </div>
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {['all', 'Berlangsung', 'Akan Datang', 'Selesai'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filterStatus === s ? 'bg-primary-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>
            {s === 'all' ? 'Semua' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        {loading ? (
          <div className="p-16 text-center"><div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-500 text-sm">Memuat jadwal...</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" id="table-jadwal">
              <thead>
                <tr className="bg-gradient-to-r from-rose-600 to-red-700 text-white">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">No</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Kelompok</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Stase</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Dosen</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Periode</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Jadwal</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Status</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((j, i) => (
                  <tr key={j.id} className="hover:bg-red-50/20 transition-colors group">
                    <td className="px-5 py-3.5 text-sm text-slate-500">{i + 1}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-primary-900">{j.kelompok}</td>
                    <td className="px-5 py-3.5"><span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">{j.stase}</span></td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{j.dosen}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{j.tanggalMulai} s/d {j.tanggalSelesai}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{j.hari}, {j.jam}</td>
                    <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(j.status)}`}>{j.status}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 text-sm">✏️</button>
                        <button className="p-2 rounded-lg text-red-500 hover:bg-red-100 text-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
