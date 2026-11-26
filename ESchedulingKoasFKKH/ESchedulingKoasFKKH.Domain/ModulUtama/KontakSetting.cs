using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.Contracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class KontakSetting : Entity<int>, IAuditableEntity
{
    public required string Judul { get; set; }
    public required string SubJudul { get; set; }
    public required string Lokasi { get; set; }
    public required string Email { get; set; }
    public string? Telepon { get; set; }
    public string? WhatsApp { get; set; }
    public required string JamPelayanan { get; set; }
    public string? Catatan { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}

public interface IKontakSettingRepository
{
    Task<KontakSetting?> GetDefault();
    void Add(KontakSetting setting);
    void Update(KontakSetting setting);
}
