using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class Stase : Entity<int>
{
    public required string Nama { get; set; }
    public required int Waktu { get; set; }
    public required JenisStase Jenis { get; set; }
}

public enum JenisStase
{
    Terpisah, Bersamaan
}

public interface IStaseRepository
{
    Task<Stase?> Get(int id);
    Task<List<Stase>> GetAll();
    Task<bool> IsExist(string nama);

    void Add(Stase stase);
    void Update(Stase stase);
    void Delete(Stase stase);
}