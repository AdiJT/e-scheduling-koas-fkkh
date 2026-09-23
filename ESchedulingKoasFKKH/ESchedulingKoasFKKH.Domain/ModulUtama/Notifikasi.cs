using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class Notifikasi : Entity<int>, IAuditableEntity
{
    public int UserId { get; set; }
    public User? User { get; set; }

    public required string Judul { get; set; }
    public required string Pesan { get; set; }
    public required string Tipe { get; set; } // broadcast, penugasan, kegiatan_mulai, kegiatan_selesai, sistem
    public string? Kategori { get; set; } // Pengumuman, Akademik, Jadwal, Penugasan
    public string? Tautan { get; set; } // e.g. /jadwal, /kelompok/1, /stase/4
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }

    public string? MetadataKey { get; set; } // Key for deduplication e.g. jadwal_1_mulai_20261021
    public int? BroadcastId { get; set; }
    public Broadcast? Broadcast { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public interface INotifikasiRepository
{
    Task<Notifikasi?> Get(int id);
    Task<List<Notifikasi>> GetByUserId(int userId, bool? unreadOnly = null, int limit = 50);
    Task<int> GetUnreadCount(int userId);
    Task<bool> ExistsByMetadataKey(int userId, string metadataKey);
    void Add(Notifikasi notifikasi);
    void AddRange(IEnumerable<Notifikasi> notifikasiList);
    void Update(Notifikasi notifikasi);
    void Delete(Notifikasi notifikasi);
    Task DeleteAllByUserId(int userId);
}
