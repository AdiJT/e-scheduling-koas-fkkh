import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { kelompokApi, pembimbingApi, mahasiswaApi, type Kelompok, type Pembimbing, type Mahasiswa } from '../services/api';

export default function DetailKelompokPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const kelompokId = Number(id);

  const [kelompok, setKelompok] = useState<Kelompok | null>(null);
  const [allPembimbing, setAllPembimbing] = useState<Pembimbing[]>([]);
  const [allMahasiswa, setAllMahasiswa] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMahasiswaId, setSelectedMahasiswaId] = useState<number | ''>('');

  // Remove member modal
  const [showRemoveMember, setShowRemoveMember] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<number | null>(null);

  // Pembimbing modal
  const [showPembimbingModal, setShowPembimbingModal] = useState(false);
  const [selectedPembimbingId, setSelectedPembimbingId] = useState<number | ''>('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [kel, pemb, mhs] = await Promise.all([
        kelompokApi.get(kelompokId),
        pembimbingApi.getAll(),
        mahasiswaApi.getAll(),
      ]);
      setKelompok(kel);
      setAllPembimbing(pemb);
      setAllMahasiswa(mhs);
    } catch {
      setError('Gagal memuat data kelompok.');
    } finally {
      setLoading(false);
    }
  }, [kelompokId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pembimbingNama = kelompok?.idPembimbing
    ? allPembimbing.find(p => p.id === kelompok.idPembimbing)?.nama || 'Unknown'
    : null;

  const pembimbingNip = kelompok?.idPembimbing
    ? allPembimbing.find(p => p.id === kelompok.idPembimbing)?.nip || ''
    : '';

  // Available mahasiswa (not in any kelompok)
  const availableMahasiswa = allMahasiswa.filter(m => !m.idKelompok);

  // === ADD MEMBER ===
  const handleAddMember = async () => {
    if (!selectedMahasiswaId || !kelompok) return;
    try {
      setActionLoading(true);
      await kelompokApi.tambahAnggota(kelompokId, Number(selectedMahasiswaId));
      await fetchData();
      setShowAddMember(false);
      setSelectedMahasiswaId('');
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string>; message?: string };
      setError(apiErr?.errors?.idMahasiswa || apiErr?.message || 'Gagal menambah anggota.');
    } finally {
      setActionLoading(false);
    }
  };

  // === REMOVE MEMBER ===
  const confirmRemoveMember = async () => {
    if (!removeMemberId) return;
    try {
      setActionLoading(true);
      await kelompokApi.hapusAnggota(kelompokId, removeMemberId);
      await fetchData();
      setShowRemoveMember(false);
      setRemoveMemberId(null);
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string>; message?: string };
      setError(apiErr?.errors?.idMahasiswa || apiErr?.message || 'Gagal menghapus anggota.');
    } finally {
      setActionLoading(false);
    }
  };

  // === SET/CHANGE PEMBIMBING ===
  const handleSetPembimbing = async () => {
    if (!selectedPembimbingId || !kelompok) return;
    try {
      setActionLoading(true);
      if (kelompok.idPembimbing) {
        await kelompokApi.gantiPembimbing(kelompokId, Number(selectedPembimbingId));
      } else {
        await kelompokApi.pilihPembimbing(kelompokId, Number(selectedPembimbingId));
      }
      await fetchData();
      setShowPembimbingModal(false);
      setSelectedPembimbingId('');
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string>; message?: string };
      setError(apiErr?.errors?.idPembimbing || apiErr?.message || 'Gagal mengatur pembimbing.');
    } finally {
      setActionLoading(false);
    }
  };

  const removingMember = kelompok?.daftarMahasiswa.find(m => m.id === removeMemberId);

  if (loading) {
    return (
      <Layout>
        <div className="p-16 text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Memuat detail kelompok...</p>
        </div>
      </Layout>
    );
  }

  if (!kelompok) {
    return (
      <Layout>
        <div className="p-16 text-center">
          <span className="text-5xl block mb-4">❌</span>
          <p className="text-slate-600 font-medium">Kelompok tidak ditemukan</p>
          <button onClick={() => navigate('/kelompok')} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm">Kembali</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 animate-fade-in-down">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate('/kelompok')} className="p-2 rounded-xl text-slate-400 hover:text-primary-900 hover:bg-white hover:shadow-soft transition-all duration-200">←</button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-2xl shadow-md">👥</div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Detail {kelompok.nama}</h1>
            <p className="text-sm text-slate-500">Kelola pembimbing dan anggota kelompok</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in-down">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg">✕</button>
        </div>
      )}

      {/* Pembimbing Section */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden mb-6 animate-fade-in-up">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-green-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full" /> Dosen Pembimbing
          </h2>
          <button
            onClick={() => { setShowPembimbingModal(true); setSelectedPembimbingId(''); }}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            {kelompok.idPembimbing ? '🔄 Ganti Pembimbing' : '+ Pilih Pembimbing'}
          </button>
        </div>
        {kelompok.idPembimbing ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">NIP</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nama Dosen</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-green-50/30 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-mono text-slate-600">{pembimbingNip}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {pembimbingNama?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-primary-900">{pembimbingNama}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <span className="text-4xl block mb-3">👨‍🏫</span>
            <p className="text-slate-500 text-sm">Belum ada pembimbing yang ditentukan</p>
          </div>
        )}
      </div>

      {/* Anggota Section */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" /> Anggota Kelompok
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{kelompok.daftarMahasiswa.length}</span>
          </h2>
          <button
            onClick={() => { setShowAddMember(true); setSelectedMahasiswaId(''); }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            + Tambah Anggota
          </button>
        </div>

        {kelompok.daftarMahasiswa.length === 0 ? (
          <div className="p-10 text-center">
            <span className="text-4xl block mb-3">👨‍🎓</span>
            <p className="text-slate-500 text-sm">Belum ada anggota dalam kelompok ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" id="table-anggota">
              <thead>
                <tr className="bg-gradient-to-r from-primary-900 to-blue-800 text-white">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">No</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">NIM</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nama Mahasiswa</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kelompok.daftarMahasiswa.map((mhs, index) => (
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
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => { setRemoveMemberId(mhs.id); setShowRemoveMember(true); }}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all duration-200 text-sm opacity-0 group-hover:opacity-100"
                          title="Keluarkan dari kelompok"
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
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" /> Tambah Anggota
            </h3>
            {availableMahasiswa.length === 0 ? (
              <p className="text-sm text-slate-500 mb-4">Tidak ada mahasiswa yang tersedia. Semua mahasiswa sudah terdaftar di kelompok.</p>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pilih Mahasiswa</label>
                <select
                  value={selectedMahasiswaId}
                  onChange={(e) => setSelectedMahasiswaId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">-- Pilih mahasiswa --</option>
                  {availableMahasiswa.map(m => (
                    <option key={m.id} value={m.id}>{m.nim} - {m.nama}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowAddMember(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm">Batal</button>
              <button
                onClick={handleAddMember}
                disabled={!selectedMahasiswaId || actionLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '+'} Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {showRemoveMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4 animate-scale-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><span className="text-3xl">⚠️</span></div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">Keluarkan Anggota?</h3>
              {removingMember && <p className="text-sm text-slate-600 font-medium mb-1">{removingMember.nama} ({removingMember.nim})</p>}
              <p className="text-sm text-slate-500">Mahasiswa akan dikeluarkan dari kelompok ini</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRemoveMember(false)} disabled={actionLoading} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm">Batal</button>
              <button onClick={confirmRemoveMember} disabled={actionLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-70 flex items-center justify-center gap-2">
                {actionLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menghapus...</> : 'Ya, Keluarkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pembimbing Modal */}
      {showPembimbingModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full" />
              {kelompok.idPembimbing ? 'Ganti Pembimbing' : 'Pilih Pembimbing'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pilih Dosen Pembimbing</label>
              <select
                value={selectedPembimbingId}
                onChange={(e) => setSelectedPembimbingId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">-- Pilih pembimbing --</option>
                {allPembimbing.filter(p => p.id !== kelompok.idPembimbing).map(p => (
                  <option key={p.id} value={p.id}>{p.nip} - {p.nama}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPembimbingModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm">Batal</button>
              <button
                onClick={handleSetPembimbing}
                disabled={!selectedPembimbingId || actionLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl shadow-md text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✓'} Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
