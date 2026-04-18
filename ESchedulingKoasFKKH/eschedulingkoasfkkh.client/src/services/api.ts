// ============================================================
// API Service - Centralized API communication layer
// All requests go through /api/* which Vite proxies to backend
// ============================================================

const BASE_URL = '/api';

interface ApiError {
    errors?: Record<string, string>;
    message?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        if (response.status === 400) {
            const errorData: ApiError = await response.json().catch(() => ({}));
            throw { status: 400, errors: errorData.errors || {}, message: 'Validasi gagal' };
        }
        if (response.status === 404) {
            throw { status: 404, message: 'Data tidak ditemukan' };
        }
        throw { status: response.status, message: `Server error: ${response.status}` };
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

// ============================================================
// MAHASISWA API
// ============================================================
export interface Mahasiswa {
    id: number;
    nim: string;
    nama: string;
    idKelompok: number | null;
}

export interface CreateMahasiswa {
    nim: string;
    nama: string;
}

export interface UpdateMahasiswa {
    id: number;
    nim: string;
    nama: string;
}

export const mahasiswaApi = {
    getAll: async (): Promise<Mahasiswa[]> => {
        const res = await fetch(`${BASE_URL}/mahasiswa`);
        return handleResponse<Mahasiswa[]>(res);
    },

    get: async (id: number): Promise<Mahasiswa> => {
        const res = await fetch(`${BASE_URL}/mahasiswa/${id}`);
        return handleResponse<Mahasiswa>(res);
    },

    create: async (data: CreateMahasiswa): Promise<Mahasiswa> => {
        const res = await fetch(`${BASE_URL}/mahasiswa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<Mahasiswa>(res);
    },

    update: async (id: number, data: UpdateMahasiswa): Promise<void> => {
        const res = await fetch(`${BASE_URL}/mahasiswa/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<void>(res);
    },

    delete: async (id: number): Promise<void> => {
        const res = await fetch(`${BASE_URL}/mahasiswa/${id}`, {
            method: 'DELETE',
        });
        return handleResponse<void>(res);
    },
};

// ============================================================
// PEMBIMBING API
// ============================================================
export interface Pembimbing {
    id: number;
    nip: string;
    nama: string;
    daftarKelompok: number[];
}

export interface CreatePembimbing {
    nip: string;
    nama: string;
}

export interface UpdatePembimbing {
    id: number;
    nip: string;
    nama: string;
}

export const pembimbingApi = {
    getAll: async (): Promise<Pembimbing[]> => {
        const res = await fetch(`${BASE_URL}/pembimbing`);
        return handleResponse<Pembimbing[]>(res);
    },

    get: async (id: number): Promise<Pembimbing> => {
        const res = await fetch(`${BASE_URL}/pembimbing/${id}`);
        return handleResponse<Pembimbing>(res);
    },

    create: async (data: CreatePembimbing): Promise<Pembimbing> => {
        const res = await fetch(`${BASE_URL}/pembimbing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<Pembimbing>(res);
    },

    update: async (id: number, data: UpdatePembimbing): Promise<void> => {
        const res = await fetch(`${BASE_URL}/pembimbing/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<void>(res);
    },

    delete: async (id: number): Promise<void> => {
        const res = await fetch(`${BASE_URL}/pembimbing/${id}`, {
            method: 'DELETE',
        });
        return handleResponse<void>(res);
    },
};

// ============================================================
// STASE API
// ============================================================
export interface Stase {
    id: number;
    nama: string;
    waktu: number;
    jenis: string; // "Terpisah" or "Bersamaan"
    daftarJadwal: {
        id: number;
        tanggalMulai: string;
        tanggalSelesai: string;
        idKelompok: number | null;
        namaKelompok: string | null;
    }[];
}

export interface CreateStase {
    nama: string;
    waktu: number;
    jenis: string;
}

export interface UpdateStase {
    id: number;
    nama: string;
    waktu: number;
    jenis: string;
}

export const staseApi = {
    getAll: async (): Promise<Stase[]> => {
        const res = await fetch(`${BASE_URL}/stase`);
        return handleResponse<Stase[]>(res);
    },

    get: async (id: number): Promise<Stase> => {
        const res = await fetch(`${BASE_URL}/stase/${id}`);
        return handleResponse<Stase>(res);
    },

    create: async (data: CreateStase): Promise<Stase> => {
        const res = await fetch(`${BASE_URL}/stase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<Stase>(res);
    },

    update: async (id: number, data: UpdateStase): Promise<void> => {
        const res = await fetch(`${BASE_URL}/stase/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<void>(res);
    },

    delete: async (id: number): Promise<void> => {
        const res = await fetch(`${BASE_URL}/stase/${id}`, {
            method: 'DELETE',
        });
        return handleResponse<void>(res);
    },
};

// ============================================================
// KELOMPOK API
// ============================================================
export interface Kelompok {
    id: number;
    nama: string;
    idPembimbing: number | null;
    daftarMahasiswa: { id: number; nim: string; nama: string }[];
    daftarJadwal: { id: number; tanggalMulai: string; tanggalSelesai: string; idStase: number | null; namaStase: string | null }[];
}

export interface CreateKelompok {
    nama: string;
}

export interface UpdateKelompok {
    id: number;
    nama: string;
}

export const kelompokApi = {
    getAll: async (): Promise<Kelompok[]> => {
        const res = await fetch(`${BASE_URL}/kelompok`);
        return handleResponse<Kelompok[]>(res);
    },

    get: async (id: number): Promise<Kelompok> => {
        const res = await fetch(`${BASE_URL}/kelompok/${id}`);
        return handleResponse<Kelompok>(res);
    },

    create: async (data: CreateKelompok): Promise<Kelompok> => {
        const res = await fetch(`${BASE_URL}/kelompok`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<Kelompok>(res);
    },

    update: async (id: number, data: UpdateKelompok): Promise<void> => {
        const res = await fetch(`${BASE_URL}/kelompok/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<void>(res);
    },

    delete: async (id: number): Promise<void> => {
        const res = await fetch(`${BASE_URL}/kelompok/${id}`, {
            method: 'DELETE',
        });
        return handleResponse<void>(res);
    },

    tambahAnggota: async (kelompokId: number, idMahasiswa: number): Promise<void> => {
        const res = await fetch(`${BASE_URL}/kelompok/${kelompokId}/tambah-anggota`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idMahasiswa }),
        });
        return handleResponse<void>(res);
    },

    hapusAnggota: async (kelompokId: number, idMahasiswa: number): Promise<void> => {
        const res = await fetch(`${BASE_URL}/kelompok/${kelompokId}/hapus-anggota`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idMahasiswa }),
        });
        return handleResponse<void>(res);
    },

    pilihPembimbing: async (kelompokId: number, idPembimbing: number): Promise<void> => {
        const res = await fetch(`${BASE_URL}/kelompok/${kelompokId}/pilih-pembimbing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idPembimbing }),
        });
        return handleResponse<void>(res);
    },

    gantiPembimbing: async (kelompokId: number, idPembimbing: number): Promise<void> => {
        const res = await fetch(`${BASE_URL}/kelompok/${kelompokId}/ganti-pembimbing`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idPembimbing }),
        });
        return handleResponse<void>(res);
    },
};

// ============================================================
// JADWAL API
// ============================================================
export interface Jadwal {
    id: number;
    tanggalMulai: string;
    tanggalSelesai: string;
    idKelompok: number | null;
    namaKelompok: string | null;
    idStase: number | null;
    namaStase: string | null;
}

export const jadwalApi = {
    getAll: async (): Promise<Jadwal[]> => {
        const res = await fetch(`${BASE_URL}/jadwal`);
        return handleResponse<Jadwal[]>(res);
    },

    get: async (id: number): Promise<Jadwal> => {
        const res = await fetch(`${BASE_URL}/jadwal/${id}`);
        return handleResponse<Jadwal>(res);
    },
};
