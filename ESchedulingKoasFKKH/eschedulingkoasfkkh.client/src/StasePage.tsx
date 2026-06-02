import { useEffect, useState } from 'react';

// ─── Tipe data sesuai StaseResponse dari C# Controller ───
interface Stase {
    id: number;
    nama: string;
    waktu: number;
    jenis: string;
}

function StasePage() {
    // State untuk daftar stase
    const [staseList, setStaseList] = useState<Stase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State untuk form input
    const [nama, setNama] = useState('');
    const [waktu, setWaktu] = useState(2);
    const [jenis, setJenis] = useState('Terpisah');

    // State untuk edit mode
    const [editId, setEditId] = useState<number | null>(null);

    // ─── GET: Ambil semua stase saat halaman dimuat ───
    useEffect(() => {
        fetchStase();
    }, []);

    async function fetchStase() {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/stase');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Gagal mengambil data`);
            }

            const data: Stase[] = await response.json();
            setStaseList(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    }

    // ─── POST: Tambah stase baru ───
    async function handleCreate() {
        if (!nama.trim()) {
            alert('Nama stase tidak boleh kosong!');
            return;
        }

        try {
            const response = await fetch('/api/stase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama, waktu, jenis }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.message || 'Gagal menambah stase');
                return;
            }

            // Reset form & refresh daftar
            resetForm();
            await fetchStase();
        } catch (err) {
            alert('Gagal menambah stase: ' + (err instanceof Error ? err.message : ''));
        }
    }

    // ─── PUT: Update stase ───
    async function handleUpdate() {
        if (editId === null) return;
        if (!nama.trim()) {
            alert('Nama stase tidak boleh kosong!');
            return;
        }

        try {
            const response = await fetch(`/api/stase/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama, waktu, jenis }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.message || 'Gagal mengupdate stase');
                return;
            }

            resetForm();
            await fetchStase();
        } catch (err) {
            alert('Gagal mengupdate stase: ' + (err instanceof Error ? err.message : ''));
        }
    }

    // ─── DELETE: Hapus stase ───
    async function handleDelete(id: number) {
        if (!confirm('Yakin ingin menghapus stase ini?')) return;

        try {
            const response = await fetch(`/api/stase/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                alert('Gagal menghapus stase');
                return;
            }

            await fetchStase();
        } catch (err) {
            alert('Gagal menghapus stase: ' + (err instanceof Error ? err.message : ''));
        }
    }

    // ─── Mulai edit: isi form dengan data yang dipilih ───
    function startEdit(stase: Stase) {
        setEditId(stase.id);
        setNama(stase.nama);
        setWaktu(stase.waktu);
        setJenis(stase.jenis);
    }

    // ─── Reset form ke default ───
    function resetForm() {
        setEditId(null);
        setNama('');
        setWaktu(2);
        setJenis('Terpisah');
    }

    // ─── RENDER ───
    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ marginBottom: 8, fontSize: 28 }}>📋 Daftar Stase</h1>
            <p style={{ color: '#666', marginBottom: 24 }}>
                Kelola data stase KOAS FKKH
            </p>

            {/* ── Form Input ── */}
            <div style={{
                display: 'flex', gap: 8, marginBottom: 24, padding: 16,
                background: '#f8f9fa', borderRadius: 8, flexWrap: 'wrap', alignItems: 'flex-end'
            }}>
                <div style={{ flex: 2, minWidth: 150 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                        Nama Stase
                    </label>
                    <input
                        type="text"
                        placeholder="cth: Bedah"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 12px', borderRadius: 6,
                            border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box'
                        }}
                    />
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                        Waktu (minggu)
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={waktu}
                        onChange={(e) => setWaktu(Number(e.target.value))}
                        style={{
                            width: '100%', padding: '8px 12px', borderRadius: 6,
                            border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box'
                        }}
                    />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                        Jenis
                    </label>
                    <select
                        value={jenis}
                        onChange={(e) => setJenis(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 12px', borderRadius: 6,
                            border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box'
                        }}
                    >
                        <option value="Terpisah">Terpisah</option>
                        <option value="Bersamaan">Bersamaan</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {editId === null ? (
                        <button
                            onClick={handleCreate}
                            style={{
                                padding: '8px 20px', borderRadius: 6, border: 'none',
                                background: '#4f46e5', color: 'white', cursor: 'pointer',
                                fontWeight: 600, fontSize: 14
                            }}
                        >
                            + Tambah
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleUpdate}
                                style={{
                                    padding: '8px 16px', borderRadius: 6, border: 'none',
                                    background: '#059669', color: 'white', cursor: 'pointer',
                                    fontWeight: 600, fontSize: 14
                                }}
                            >
                                💾 Simpan
                            </button>
                            <button
                                onClick={resetForm}
                                style={{
                                    padding: '8px 16px', borderRadius: 6, border: '1px solid #ddd',
                                    background: 'white', cursor: 'pointer', fontSize: 14
                                }}
                            >
                                Batal
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Status ── */}
            {loading && <p>⏳ Memuat data...</p>}
            {error && (
                <div style={{
                    padding: 12, background: '#fef2f2', color: '#991b1b',
                    borderRadius: 8, marginBottom: 16
                }}>
                    ❌ {error}
                    <button onClick={fetchStase} style={{ marginLeft: 8 }}>Coba lagi</button>
                </div>
            )}

            {/* ── Tabel Data ── */}
            {!loading && !error && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>ID</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>Nama Stase</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>Waktu</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>Jenis</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staseList.map((stase) => (
                            <tr key={stase.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '10px 12px', color: '#9ca3af' }}>#{stase.id}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{stase.nama}</td>
                                <td style={{ padding: '10px 12px' }}>{stase.waktu} minggu</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <span style={{
                                        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                                        background: stase.jenis === 'Terpisah' ? '#dbeafe' : '#fef3c7',
                                        color: stase.jenis === 'Terpisah' ? '#1d4ed8' : '#92400e',
                                    }}>
                                        {stase.jenis}
                                    </span>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    <button
                                        onClick={() => startEdit(stase)}
                                        style={{
                                            padding: '4px 12px', borderRadius: 4, border: '1px solid #ddd',
                                            background: 'white', cursor: 'pointer', marginRight: 4, fontSize: 13
                                        }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(stase.id)}
                                        style={{
                                            padding: '4px 12px', borderRadius: 4, border: '1px solid #fecaca',
                                            background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 13
                                        }}
                                    >
                                        🗑 Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {staseList.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                                    Belum ada data stase. Tambahkan yang pertama!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {/* ── Info jumlah data ── */}
            {!loading && !error && (
                <p style={{ marginTop: 12, fontSize: 13, color: '#9ca3af' }}>
                    Total: {staseList.length} stase
                </p>
            )}
        </div>
    );
}

export default StasePage;
