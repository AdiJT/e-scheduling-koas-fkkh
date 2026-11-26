using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.Contracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class HariLibur : Entity<int>, IAuditableEntity
{
    public DateOnly TanggalMulai { get; set; }
    public DateOnly TanggalSelesai { get; set; }
    public required string Nama { get; set; }
    public string? Keterangan { get; set; }
    public string Tipe { get; set; } = "Kampus";
    public string Sumber { get; set; } = "Manual";

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}

public interface IHariLiburRepository
{
    Task<List<HariLibur>> GetAll(int? tahun = null);
    Task<List<HariLibur>> GetTrackedByTahun(int tahun);
    Task<List<HariLibur>> GetTrackedOverlapping(DateOnly tanggalMulai, DateOnly tanggalSelesai, int? excludeId = null);
    Task<HariLibur?> Get(int id);
    void Add(HariLibur item);
    void AddRange(IEnumerable<HariLibur> items);
    void Update(HariLibur item);
    void Delete(HariLibur item);
    void DeleteRange(IEnumerable<HariLibur> items);
}
