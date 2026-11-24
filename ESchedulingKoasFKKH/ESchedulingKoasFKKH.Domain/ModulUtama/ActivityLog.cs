using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.Contracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class ActivityLog : Entity<int>, IAuditableEntity
{
    public int? UserId { get; set; }
    public required string Username { get; set; }
    public string? NamaPelaku { get; set; }
    public required string Role { get; set; }
    public required string Modul { get; set; }
    public required string Aksi { get; set; }
    public required string Deskripsi { get; set; }
    public string? TargetEntitas { get; set; }
    public string? Endpoint { get; set; }
    public string? IpAddress { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}

public class ActivityLogFilter
{
    public string? Search { get; set; }
    public string? Modul { get; set; }
    public string? Aksi { get; set; }
    public string? Role { get; set; }
    public DateOnly? TanggalMulai { get; set; }
    public DateOnly? TanggalSelesai { get; set; }
}

public interface IActivityLogRepository
{
    void Add(ActivityLog log);
    Task<List<ActivityLog>> GetFiltered(ActivityLogFilter filter, int limit = 1000);
    Task<int> GetTotalCount();
}
