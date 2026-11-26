using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.Contracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class HariLibur : Entity<int>, IAuditableEntity
{
    public DateOnly TanggalMulai { get; set; }
    public DateOnly TanggalSelesai { get; set; }
    public required string Nama { get; set; }
    public string? Keterangan { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}

public interface IHariLiburRepository
{
    Task<List<HariLibur>> GetAll(int? tahun = null);
    Task<HariLibur?> Get(int id);
    void Add(HariLibur item);
    void Update(HariLibur item);
    void Delete(HariLibur item);
}
