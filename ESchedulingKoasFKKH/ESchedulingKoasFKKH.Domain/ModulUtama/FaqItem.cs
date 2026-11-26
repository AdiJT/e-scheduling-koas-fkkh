using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.Contracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class FaqItem : Entity<int>, IAuditableEntity
{
    public required string Pertanyaan { get; set; }
    public required string Jawaban { get; set; }
    public int Urutan { get; set; } = 1;
    public bool IsAktif { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}

public interface IFaqRepository
{
    Task<List<FaqItem>> GetAll(bool hanyaAktif = false);
    Task<FaqItem?> Get(int id);
    void Add(FaqItem item);
    void Update(FaqItem item);
    void Delete(FaqItem item);
}
