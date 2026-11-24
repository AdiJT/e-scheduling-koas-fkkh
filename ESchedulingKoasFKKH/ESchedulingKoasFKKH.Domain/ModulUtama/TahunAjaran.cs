using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class TahunAjaran : Entity<int>
{
    public int Tahun { get; set; }
    public Semester Semester { get; set; }
    public DateOnly TanggalMulai { get; set; }
    public DateOnly TanggalSelesai { get; set; }
    public StatusTahunAjaran Status { get; set; } = StatusTahunAjaran.AkanDatang;

    public List<Mahasiswa> DaftarSiswa { get; set; } = [];
    public List<Kelompok> DaftarKelompok { get; set; } = [];

    public bool IsAktif(DateOnly today) => TanggalMulai <= today && today <= TanggalSelesai;

    public StatusTahunAjaran HitungStatusPeriode(DateOnly today)
    {
        if (today < TanggalMulai) return StatusTahunAjaran.AkanDatang;
        if (today > TanggalSelesai) return StatusTahunAjaran.Selesai;
        return StatusTahunAjaran.Berjalan;
    }

    public string GetStatusLabel(DateOnly today) => HitungStatusPeriode(today) switch
    {
        StatusTahunAjaran.Berjalan => "Berjalan",
        StatusTahunAjaran.AkanDatang => "Akan Datang",
        StatusTahunAjaran.Selesai => "Selesai",
        _ => Status.ToString()
    };
}

public enum Semester
{
    Ganjil = 1, Genap = 2
}

public enum StatusTahunAjaran
{
    Selesai = 1,
    Berjalan = 2,
    AkanDatang = 3
}

public interface ITahunAjaranRepository
{
    Task<TahunAjaran?> Get(int id);
    Task<List<TahunAjaran>> GetAll();

    void Add(TahunAjaran tahunAjaran);
    void Update(TahunAjaran tahunAjaran);
    void Delete(TahunAjaran tahunAjaran);
}
