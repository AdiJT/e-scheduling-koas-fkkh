namespace ESchedulingKoasFKKH.Server.Models.PengaturanSistemModels;

public class FaqItemRequest
{
    public string Pertanyaan { get; set; } = string.Empty;
    public string Jawaban { get; set; } = string.Empty;
    public int Urutan { get; set; } = 1;
    public bool IsAktif { get; set; } = true;
}

public class KontakSettingRequest
{
    public string Judul { get; set; } = string.Empty;
    public string SubJudul { get; set; } = string.Empty;
    public string Lokasi { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telepon { get; set; }
    public string? WhatsApp { get; set; }
    public string JamPelayanan { get; set; } = string.Empty;
    public string? Catatan { get; set; }
}

public class HariLiburRequest
{
    public DateOnly TanggalMulai { get; set; }
    public DateOnly? TanggalSelesai { get; set; }
    public string Nama { get; set; } = string.Empty;
    public string? Keterangan { get; set; }
}
