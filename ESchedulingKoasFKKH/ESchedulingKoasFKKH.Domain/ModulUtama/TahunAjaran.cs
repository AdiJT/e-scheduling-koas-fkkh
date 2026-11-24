using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class TahunAjaran : Entity<int>
{
    public int Tahun { get; set; }
    public Semester Semester { get; set; }
    public DateOnly TanggalMulai { get; set; }
    public DateOnly TanggalSelesai { get; set; }

    public List<Mahasiswa> DaftarSiswa { get; set; } = [];
    public List<Kelompok> DaftarKelompok { get; set; } = [];

    public bool IsAktif(DateOnly today) => TanggalMulai <= today && today <= TanggalSelesai;

    public string GetStatus(DateOnly today)
    {
        if (today < TanggalMulai) return "Belum Mulai";
        if (today > TanggalSelesai) return "Selesai";
        return "Aktif";
    }
}

public enum Semester
{
    Ganjil = 1, Genap = 2
}

public interface ITahunAjaranRepository
{
    Task<TahunAjaran?> Get(int id);
    Task<List<TahunAjaran>> GetAll();

    void Add(TahunAjaran tahunAjaran);
    void Update(TahunAjaran tahunAjaran);
    void Delete(TahunAjaran tahunAjaran);
}