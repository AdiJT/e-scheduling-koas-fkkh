namespace ESchedulingKoasFKKH.Server.Controllers.Dtos;

public class NotifikasiDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Judul { get; set; } = string.Empty;
    public string Pesan { get; set; } = string.Empty;
    public string Tipe { get; set; } = string.Empty; // broadcast, penugasan, kegiatan_mulai, kegiatan_selesai, sistem
    public string? Kategori { get; set; }
    public string? Tautan { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public int? BroadcastId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class NotifikasiListResponseDto
{
    public List<NotifikasiDto> Items { get; set; } = [];
    public int UnreadCount { get; set; }
    public int TotalCount { get; set; }
}

public class CreateBroadcastDto
{
    public string Judul { get; set; } = string.Empty;
    public string Pesan { get; set; } = string.Empty;
    public string Tipe { get; set; } = "Pengumuman"; // Pengumuman, Penting, Darurat, Akademik, Libur
    public string Prioritas { get; set; } = "Normal"; // Normal, Tinggi, Mendesak
    public string TargetRole { get; set; } = "semua"; // semua, dosen, mahasiswa, kelompok
    public int? TargetKelompokId { get; set; }
    public string? Tautan { get; set; }
}

public class BroadcastItemDto
{
    public int Id { get; set; }
    public string Judul { get; set; } = string.Empty;
    public string Pesan { get; set; } = string.Empty;
    public string Tipe { get; set; } = string.Empty;
    public string Prioritas { get; set; } = string.Empty;
    public string TargetRole { get; set; } = string.Empty;
    public int? TargetKelompokId { get; set; }
    public string? TargetKelompokNama { get; set; }
    public string? Tautan { get; set; }
    public int CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public int JumlahPenerima { get; set; }
    public DateTime CreatedAt { get; set; }
}
