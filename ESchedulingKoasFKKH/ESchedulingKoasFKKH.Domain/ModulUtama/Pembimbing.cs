using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class Pembimbing : Entity<int>
{
    public required string NIP { get; set; }
    public required string Nama { get; set; }

    public List<Kelompok> DaftarKelompok { get; set; } = [];
}

public interface IPembimbingRepository
{
    Task<Pembimbing?> Get(int id);
    Task<Pembimbing?> Get(string nip);
    Task<List<Pembimbing>> GetAll();
    Task<bool> IsExist(string nip, int? id = null);

    void Add(Pembimbing pembimbing);
    void Update(Pembimbing pembimbing);
    void Delete(Pembimbing pembimbing);
}
