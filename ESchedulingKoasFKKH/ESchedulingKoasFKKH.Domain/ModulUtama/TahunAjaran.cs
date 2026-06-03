using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class TahunAjaran : Entity<int>
{
    public int Tahun { get; set; }
    public Semester Semester { get; set; }

    public List<Mahasiswa> DaftarSiswa { get; set; } = [];
}

public enum Semester
{
    Genap, Ganjil
}

public interface ITahunAjaranRepository
{
    Task<TahunAjaran?> Get(int id);
    Task<List<TahunAjaran>> GetAll();

    void Add(TahunAjaran tahunAjaran);
    void Update(TahunAjaran tahunAjaran);
    void Delete(TahunAjaran tahunAjaran);
}