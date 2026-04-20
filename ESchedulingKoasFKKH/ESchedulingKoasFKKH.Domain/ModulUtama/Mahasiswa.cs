using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.Auth;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class Mahasiswa : Entity<int>
{
    public required string NIM { get; set; }
    public required string Nama { get; set; }

    public Kelompok? Kelompok { get; set; }
    public User User { get; set; }
}

public interface IMahasiswaRepository
{
    Task<Mahasiswa?> Get(int id);
    Task<Mahasiswa?> Get(string nim);
    Task<List<Mahasiswa>> GetAll();
    Task<bool> IsExist(string nim, int? id = null);

    void Add(Mahasiswa mahasiswa);
    void Update(Mahasiswa mahasiswa);
    void Delete(Mahasiswa mahasiswa);
}
