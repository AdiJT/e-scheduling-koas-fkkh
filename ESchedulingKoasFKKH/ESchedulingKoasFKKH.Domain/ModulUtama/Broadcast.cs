using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.Contracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class Broadcast : Entity<int>, IAuditableEntity
{
    public required string Judul { get; set; }
    public required string Pesan { get; set; }
    public string Tipe { get; set; } = "Pengumuman"; // Pengumuman, Penting, Darurat, Akademik, Libur
    public string Prioritas { get; set; } = "Normal"; // Normal, Tinggi, Mendesak
    public string TargetRole { get; set; } = "semua"; // semua, dosen, mahasiswa, kelompok
    public int? TargetKelompokId { get; set; }
    public string? TargetKelompokNama { get; set; }
    public string? Tautan { get; set; }

    public int CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public int JumlahPenerima { get; set; }

    public List<Notifikasi> DaftarNotifikasi { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public interface IBroadcastRepository
{
    Task<Broadcast?> Get(int id);
    Task<List<Broadcast>> GetAll(int limit = 50);
    void Add(Broadcast broadcast);
    void Delete(Broadcast broadcast);
}
