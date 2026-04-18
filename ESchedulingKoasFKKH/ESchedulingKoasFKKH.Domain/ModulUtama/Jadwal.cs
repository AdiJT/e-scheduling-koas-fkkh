using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class Jadwal : Entity<int>
{
    public required DateOnly TanggalMulai { get; set; }
    public DateOnly TanggalSelesai => TanggalMulai.AddDays(Stase.Waktu * 7);

    public Kelompok Kelompok { get; set; }
    public Stase Stase { get; set; }
}

public interface IJadwalRepository
{
    Task<Jadwal?> Get(int id);
    Task<List<Jadwal>> GetAll();

    void Add(Jadwal jadwal);
    void Update(Jadwal jadwal);
    void Delete(Jadwal jadwal);
}
