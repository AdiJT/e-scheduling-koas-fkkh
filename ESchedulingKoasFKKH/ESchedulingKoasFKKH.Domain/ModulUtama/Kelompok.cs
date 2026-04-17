using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class Kelompok : Entity<int>
{
    public required string Nama { get; set; }

    public Pembimbing Pembimbing { get; set; }
    public List<Mahasiswa> DaftarMahasiswa { get; set; } = [];
    public List<Stase> DaftarStase { get; set; } = [];
}

public interface IKelompokRepository
{
    Task<Kelompok?> Get(int id);
    Task<List<Kelompok>> GetAll();
    Task<bool> IsExist(string nama);

    void Add(Kelompok kelompok);
    void Update(Kelompok kelompok);
    void Delete(Kelompok kelompok);
}