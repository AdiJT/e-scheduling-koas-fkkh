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
    public bool IsActive { get; set; } = true;

    public List<Notifikasi> DaftarNotifikasi { get; set; } = [];
    public List<NotifikasiDibaca> DaftarDibaca { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}

public interface IBroadcastRepository
{
    Task<Broadcast?> Get(int id);
    Task<List<Broadcast>> GetAll(int limit = 50);
    Task<List<Broadcast>> GetActiveBroadcasts();
    Task<int> GetActiveCount();
    Task<int> GetTotalCount();
    Task<int> GetCountThisMonth();
    void Add(Broadcast broadcast);
    void Update(Broadcast broadcast);
    void Delete(Broadcast broadcast);
}
