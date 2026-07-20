using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class RiwayatKelompok : Entity<int>
{
    public required int IdJadwalAsal { get; set; }
    public required string NamaKelompok { get; set; }
    public required string TahunAjaran { get; set; }
    public required string NamaStase { get; set; }
    public required DateOnly TanggalMulai { get; set; }
    public required DateOnly TanggalSelesai { get; set; }
    public string? NamaPembimbing { get; set; }
    public string? NipPembimbing { get; set; }
    public required string DaftarMahasiswaJson { get; set; }
    public required string DaftarSubStaseJson { get; set; }
    public DateTime TanggalDiarsipkan { get; set; } = DateTime.UtcNow;
}

public interface IRiwayatKelompokRepository
{
    Task<RiwayatKelompok?> Get(int id);
    Task<List<RiwayatKelompok>> GetAll();
    void Add(RiwayatKelompok riwayat);
    void Delete(RiwayatKelompok riwayat);
}
