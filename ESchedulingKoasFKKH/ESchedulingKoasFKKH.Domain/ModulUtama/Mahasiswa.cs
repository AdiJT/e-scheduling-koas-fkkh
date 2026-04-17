using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class Mahasiswa : Entity<int>
{
    public required string NIM { get; set; }
    public required string Nama { get; set; }

    public Kelompok? Kelompok { get; set; }
}

public interface IMahasiswaRepository
{
    Task<Mahasiswa?> Get(int id);
    Task<Mahasiswa?> Get(string nim);
    Task<List<Mahasiswa>> GetAll();
    Task<bool> IsExist(string nim);

    void Add(Mahasiswa mahasiswa);
    void Update(Mahasiswa mahasiswa);
    void Delete(Mahasiswa mahasiswa);
}
