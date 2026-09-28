using System.Text.Json.Serialization;

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
    public bool IsBroadcast { get; set; }
    public string? SenderName { get; set; }
    public string? Prioritas { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? TimeAgo { get; set; }
}

public class NotifikasiListResponseDto
{
    public List<NotifikasiDto> Items { get; set; } = [];
    public int UnreadCount { get; set; }
    public int TotalCount { get; set; }
    public int Total => TotalCount;
}

public class CreateBroadcastDto
{
    public string Judul { get; set; } = string.Empty;
    public string Pesan { get; set; } = string.Empty;

    private string _tipe = "Pengumuman";
    public string Tipe 
    { 
        get => _tipe; 
        set => _tipe = value; 
    }

    [JsonPropertyName("kategori")]
    public string? Kategori 
    { 
        get => _tipe; 
        set { if (!string.IsNullOrWhiteSpace(value)) _tipe = value; } 
    }

    public string Prioritas { get; set; } = "Normal"; // Normal, Penting, Mendesak
    public string TargetRole { get; set; } = "semua"; // semua, dosen, mahasiswa, kelompok
    public int? TargetKelompokId { get; set; }

    private string? _tautan;
    public string? Tautan 
    { 
        get => _tautan; 
        set => _tautan = value; 
    }

    [JsonPropertyName("actionUrl")]
    public string? ActionUrl 
    { 
        get => _tautan; 
        set { if (!string.IsNullOrWhiteSpace(value)) _tautan = value; } 
    }
}

public class BroadcastItemDto
{
    public int Id { get; set; }
    public string Judul { get; set; } = string.Empty;
    public string Pesan { get; set; } = string.Empty;
    public string Tipe { get; set; } = string.Empty;
    public string Kategori => Tipe;
    public string Prioritas { get; set; } = string.Empty;
    public string TargetRole { get; set; } = string.Empty;
    public int? TargetKelompokId { get; set; }
    public string? TargetKelompokNama { get; set; }
    public string? TargetNamaKelompok => TargetKelompokNama;
    public string? Tautan { get; set; }
    public string? ActionUrl => Tautan;
    public int CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public string SenderName => CreatedByName;
    public int JumlahPenerima { get; set; }
    public int TotalPenerima => JumlahPenerima;
    public int TotalDibaca { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

public class BroadcastStatsDto
{
    public int TotalBroadcast { get; set; }
    public int BroadcastAktif { get; set; }
    public int TotalDibaca { get; set; }
    public int BroadcastBulanIni { get; set; }
}
