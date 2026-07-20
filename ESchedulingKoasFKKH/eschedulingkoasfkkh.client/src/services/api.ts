// ============================================================
// API Service - Centralized API communication layer
// All requests go through /api/* which Vite proxies to backend
// ============================================================

const BASE_URL = '/api';

interface ApiError {
    errors?: Record<string, string>;
    message?: string;
    requiresConfirmation?: boolean;
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
        if (response.status === 409) {
            const errorData: ApiError = await response.json().catch(() => ({}));
            throw {
                status: 409,
                errors: errorData.errors || {},
                message: errorData.message || 'Perubahan membutuhkan konfirmasi.',
                requiresConfirmation: errorData.requiresConfirmation || false,
            };
        }
        throw { status: response.status, message: `Server error: ${response.status}` };
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    
    return fetch(url, {
        ...options,
        headers
    });
}

// ============================================================
// TAHUN AJARAN API
// ============================================================
export interface TahunAjaran {
    id: number;
    tahun: number;
    semester: string;
}

export interface CreateTahunAjaran {
    tahun: number;
    semester: string;
}

export interface UpdateTahunAjaran {
    id: number;
    tahun: number;
    semester: string;
}

export const tahunAjaranApi = {
    getAll: async (): Promise<TahunAjaran[]> => {
        const res = await apiFetch(`${BASE_URL}/tahun-ajaran`);
        return handleResponse<TahunAjaran[]>(res);
    },

    get: async (id: number): Promise<TahunAjaran> => {
        const res = await apiFetch(`${BASE_URL}/tahun-ajaran/${id}`);
        return handleResponse<TahunAjaran>(res);
    },

    create: async (data: CreateTahunAjaran): Promise<TahunAjaran> => {
        const res = await apiFetch(`${BASE_URL}/tahun-ajaran`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<TahunAjaran>(res);
    },

    update: async (id: number, data: UpdateTahunAjaran): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/tahun-ajaran/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<void>(res);
    },

    delete: async (id: number, konfirmasiHapus = false): Promise<void> => {
        const query = konfirmasiHapus ? '?konfirmasiHapus=true' : '';
        const res = await apiFetch(`${BASE_URL}/tahun-ajaran/${id}${query}`, {
            method: 'DELETE',
        });
        return handleResponse<void>(res);
    },
};

// ============================================================
// MAHASISWA API
// ============================================================
export interface Mahasiswa {
    id: number;
    nim: string;
    nama: string;
    idKelompok: number | null;
    idTahunAjaran?: number | null;
    tahunAjaran?: {
        id: number;
        tahun: number;
        semester: string;
    } | null;
}

export interface CreateMahasiswa {
    nim: string;
    nama: string;
    idTahunAjaran: number;
}

export interface UpdateMahasiswa {
    id: number;
    nim: string;
    nama: string;
    idTahunAjaran: number;
}

export const mahasiswaApi = {
    getAll: async (): Promise<Mahasiswa[]> => {
        const res = await apiFetch(`${BASE_URL}/mahasiswa`);
        return handleResponse<Mahasiswa[]>(res);
    },

    get: async (id: number): Promise<Mahasiswa> => {
        const res = await apiFetch(`${BASE_URL}/mahasiswa/${id}`);
        return handleResponse<Mahasiswa>(res);
    },

    create: async (data: CreateMahasiswa): Promise<Mahasiswa> => {
        const res = await apiFetch(`${BASE_URL}/mahasiswa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<Mahasiswa>(res);
    },

    update: async (id: number, data: UpdateMahasiswa): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/mahasiswa/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<void>(res);
    },

    delete: async (id: number): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/mahasiswa/${id}`, {
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
        const res = await apiFetch(`${BASE_URL}/pembimbing`);
        return handleResponse<Pembimbing[]>(res);
    },

    get: async (id: number): Promise<Pembimbing> => {
        const res = await apiFetch(`${BASE_URL}/pembimbing/${id}`);
        return handleResponse<Pembimbing>(res);
    },

    create: async (data: CreatePembimbing): Promise<Pembimbing> => {
        const res = await apiFetch(`${BASE_URL}/pembimbing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<Pembimbing>(res);
    },

    update: async (id: number, data: UpdatePembimbing): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/pembimbing/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<void>(res);
    },

    delete: async (id: number): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/pembimbing/${id}`, {
            method: 'DELETE',
        });
        return handleResponse<void>(res);
    },
};

// ============================================================
// STASE API
// ============================================================
export interface SubStase {
    id: number;
    nama: string;
    urutan: number;
    idDefaultPembimbing?: number | null;
    namaDefaultPembimbing?: string | null;
    nipDefaultPembimbing?: string | null;
    daftarDefaultPembimbing?: { id: number; nip: string; nama: string }[];
}

export interface Stase {
    id: number;
    nama: string;
    waktu: number;
    jenis: string; // "Terpisah" or "Bersamaan"
    idKoordinator?: number | null;
    namaKoordinator?: string | null;
    nipKoordinator?: string | null;
    daftarJadwal: {
        id: number;
        tanggalMulai: string;
        tanggalSelesai: string;
        idKelompok: number | null;
        namaKelompok: string | null;
        idPembimbing?: number | null;
        namaPembimbing?: string | null;
    }[];
    daftarSubStase?: SubStase[];
    daftarPembimbing?: { id: number; nip: string; nama: string }[];
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
        const res = await apiFetch(`${BASE_URL}/stase`);
        return handleResponse<Stase[]>(res);
    },

    get: async (id: number): Promise<Stase> => {
        const res = await apiFetch(`${BASE_URL}/stase/${id}`);
        return handleResponse<Stase>(res);
    },

    create: async (data: CreateStase): Promise<Stase> => {
        const res = await apiFetch(`${BASE_URL}/stase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<Stase>(res);
    },

    update: async (id: number, data: UpdateStase): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/stase/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<void>(res);
    },

    updatePembimbingStase: async (staseId: number, idPembimbingList: number[]): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/stase/${staseId}/pembimbing`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idPembimbingList }),
        });
        return handleResponse<void>(res);
    },

    pilihKoordinatorStase: async (staseId: number, idKoordinator: number | null): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/stase/${staseId}/koordinator`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idKoordinator }),
        });
        return handleResponse<void>(res);
    },

    pilihPembimbingSubStase: async (subStaseId: number, idDefaultPembimbingList: number[]): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/stase/sub-stase/${subStaseId}/pilih-pembimbing`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idDefaultPembimbingList }),
        });
        return handleResponse<void>(res);
    },

    createSubStase: async (staseId: number, data: { nama: string; urutan?: number; idDefaultPembimbingList?: number[] }): Promise<SubStase> => {
        const res = await apiFetch(`${BASE_URL}/stase/${staseId}/sub-stase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<SubStase>(res);
    },

    updateSubStase: async (subStaseId: number, data: { nama: string; urutan?: number; idDefaultPembimbingList?: number[] }): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/stase/sub-stase/${subStaseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<void>(res);
    },

    deleteSubStase: async (subStaseId: number): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/stase/sub-stase/${subStaseId}`, {
            method: 'DELETE',
        });
        return handleResponse<void>(res);
    },

    delete: async (id: number): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/stase/${id}`, {
            method: 'DELETE',
        });
        return handleResponse<void>(res);
    },
};

// ============================================================
// KELOMPOK API
// ============================================================
export interface KelompokJadwalSubStase {
    idSubStase: number | null;
    urutan: number | null;
    namaSubStase: string | null;
    idPembimbing: number | null;
    namaPembimbing: string | null;
    nipPembimbing: string | null;
    daftarPembimbing?: { id: number; nip: string; nama: string }[];
}

export interface KelompokJadwal {
    id: number;
    tanggalMulai: string;
    tanggalSelesai: string;
    idStase: number | null;
    namaStase: string | null;
    idPembimbing?: number | null;
    namaPembimbing?: string | null;
    nipPembimbing?: string | null;
    daftarSubStase?: KelompokJadwalSubStase[];
}

export interface Kelompok {
    id: number;
    nama: string;
    daftarMahasiswa: { id: number; nim: string; nama: string }[];
    daftarJadwal: KelompokJadwal[];
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
        const res = await apiFetch(`${BASE_URL}/kelompok`);
        return handleResponse<Kelompok[]>(res);
    },

    get: async (id: number): Promise<Kelompok> => {
        const res = await apiFetch(`${BASE_URL}/kelompok/${id}`);
        return handleResponse<Kelompok>(res);
    },

    create: async (data: CreateKelompok): Promise<Kelompok> => {
        const res = await apiFetch(`${BASE_URL}/kelompok`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<Kelompok>(res);
    },

    update: async (id: number, data: UpdateKelompok): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/kelompok/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<void>(res);
    },

    delete: async (id: number): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/kelompok/${id}`, {
            method: 'DELETE',
        });
        return handleResponse<void>(res);
    },

    tambahAnggota: async (kelompokId: number, idMahasiswa: number): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/kelompok/${kelompokId}/tambah-anggota`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idMahasiswa }),
        });
        return handleResponse<void>(res);
    },

    hapusAnggota: async (kelompokId: number, idMahasiswa: number): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/kelompok/${kelompokId}/hapus-anggota`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idMahasiswa }),
        });
        return handleResponse<void>(res);
    },

    pilihPembimbing: async (kelompokId: number, idPembimbing: number): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/kelompok/${kelompokId}/pilih-pembimbing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idPembimbing }),
        });
        return handleResponse<void>(res);
    },

    gantiPembimbing: async (kelompokId: number, idPembimbing: number): Promise<void> => {
        const res = await apiFetch(`${BASE_URL}/kelompok/${kelompokId}/ganti-pembimbing`, {
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
export interface JadwalSubStase {
  idSubStase: number;
  namaSubStase: string;
  urutan: number;
  idPembimbing?: number | null;
  namaPembimbing?: string | null;
  nipPembimbing?: string | null;
  daftarPembimbing?: { id: number; nip: string; nama: string }[];
}

export interface Jadwal {
  id: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  idKelompok: number;
  namaKelompok: string;
  idStase: number;
  namaStase: string;
  idPembimbing?: number | null;
  namaPembimbing?: string | null;
  nipPembimbing?: string | null;
  daftarSubStase?: JadwalSubStase[];
}

export interface CreateJadwalSubStaseInput {
  idSubStase: number;
  idPembimbing?: number | null;
  idPembimbingList?: number[];
}

export interface CreateJadwal {
  tanggalMulai: string; // "YYYY-MM-DD" format
  idKelompok: number;
  idStase: number;
  idPembimbing?: number | null;
  daftarSubStasePembimbing?: CreateJadwalSubStaseInput[];
}

export interface UpdateJadwalRequest {
  tanggalMulai: string;
  konfirmasiOverride?: boolean;
  idPembimbing?: number | null;
  daftarSubStasePembimbing?: CreateJadwalSubStaseInput[];
}

export interface GenerateJadwalKelompokSummary {
  id: number;
  nama: string;
  jadwalDibuat: number;
  pesan: string;
  staseDibuat: string[];
}

export interface GenerateJadwalRequest {
  tanggalMulai?: string;
}

export interface GenerateJadwalResult {
  tanggalMulaiAcuan: string;
  jadwalDibuat: number;
  kelompokDiproses: number;
  kelompokBerhasil: GenerateJadwalKelompokSummary[];
  kelompokTanpaPerubahan: GenerateJadwalKelompokSummary[];
  kelompokDilewati: GenerateJadwalKelompokSummary[];
}

export const jadwalApi = {
  getAll: async (): Promise<Jadwal[]> => {
    const res = await apiFetch(`${BASE_URL}/Jadwal`);
    return handleResponse<Jadwal[]>(res);
  },

  get: async (id: number): Promise<Jadwal> => {
    const res = await apiFetch(`${BASE_URL}/Jadwal/${id}`);
    return handleResponse<Jadwal>(res);
  },

  create: async (data: CreateJadwal): Promise<Jadwal> => {
    const res = await apiFetch(`${BASE_URL}/Jadwal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Jadwal>(res);
  },

  update: async (id: number, data: UpdateJadwalRequest): Promise<Jadwal> => {
    const res = await apiFetch(`${BASE_URL}/Jadwal/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Jadwal>(res);
  },

  generate: async (data?: GenerateJadwalRequest): Promise<GenerateJadwalResult> => {
    const res = await apiFetch(`${BASE_URL}/Jadwal/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data ?? {}),
    });
    return handleResponse<GenerateJadwalResult>(res);
  },

  delete: async (id: number): Promise<void> => {
    const res = await apiFetch(`${BASE_URL}/Jadwal/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },
  deleteAll: async (): Promise<void> => {
    const res = await apiFetch(`${BASE_URL}/Jadwal/all`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },
};
