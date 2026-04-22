/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { staseApi, jadwalApi, type Stase, type Jadwal } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDateDisplay } from '../utils/holidays';

export default function DetailStasePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const staseId = Number(id);
  const { user } = useAuth();
  const isDosen = user?.role?.toLowerCase() === 'dosen';

  const [stase, setStase] = useState<Stase | null>(null);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [staseData, allJadwal] = await Promise.all([
        staseApi.get(staseId),
        jadwalApi.getAll()
      ]);
      
      setStase(staseData);
      
      // Filter schedules for this stase
      const filteredJadwal = allJadwal.filter((j) => j.idStase === staseId);
      setJadwalList(filteredJadwal);
    } catch (err: any) {
      console.error("Failed to fetch stase details:", err);
      if (err.status === 404) {
        setError('Stase tidak ditemukan.');
      } else {
        setError('Gagal memuat detail stase.');
      }
    } finally {
      setLoading(false);
    }
  }, [staseId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Role-based filtering for Dosen: only show groups they supervise
  const displayedJadwal = jadwalList.filter((j) => {
    if (isDosen) {
      return j.idPembimbing === user?.profileId;
    }
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div className="p-16 text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Memuat detail stase...</p>
        </div>
      </Layout>
    );
  }

  if (error || !stase) {
    return (
      <Layout>
        <div className="p-16 text-center">
          <span className="text-5xl block mb-4">{error?.includes('tidak ditemukan') ? '❌' : '⚠️'}</span>
          <p className="text-slate-600 font-medium">{error || 'Stase tidak ditemukan'}</p>
          <button onClick={() => navigate('/stase')} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-xl text-sm">Kembali ke Daftar Stase</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all duration-200">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-2xl shadow-md">🏥</div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Detail Stase: {stase.nama}</h1>
            <p className="text-sm text-slate-500">Informasi lengkap dan jadwal kelompok pada stase ini</p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 animate-fade-in-up">
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">⏱️</div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Durasi</p>
            <p className="text-lg font-bold text-primary-900">{stase.waktu} Minggu</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">⚙️</div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Jenis</p>
            <p className="text-lg font-bold text-primary-900">{stase.jenis}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">👥</div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Kelompok</p>
            <p className="text-lg font-bold text-primary-900">{displayedJadwal.length} Terjadwal</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" /> 
            Jadwal Lengkap
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
            >
              🖨️ Cetak PDF
            </button>
          </div>
        </div>

        {displayedJadwal.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-5xl block mb-4">📅</span>
            <p className="text-slate-600 font-medium">Tidak ada jadwal ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">
              {isDosen ? 'Tidak ada kelompok bimbingan Anda yang terdaftar pada stase ini.' : 'Belum ada jadwal yang disusun untuk stase ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">No</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Kelompok</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Tanggal Mulai</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Tanggal Selesai</th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedJadwal.map((jadwal, index) => (
                  <tr key={jadwal.id} className="hover:bg-purple-50/20 transition-colors group">
                    <td className="px-5 py-4 text-sm text-slate-500">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                          {jadwal.namaKelompok?.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-primary-900">{jadwal.namaKelompok}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDateDisplay(jadwal.tanggalMulai)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDateDisplay(jadwal.tanggalSelesai)}
                    </td>
                    <td className="px-5 py-4 text-center print:hidden">
                      <button
                        onClick={() => navigate(`/kelompok/${jadwal.idKelompok}`)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Lihat Kelompok
                      </button>
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
