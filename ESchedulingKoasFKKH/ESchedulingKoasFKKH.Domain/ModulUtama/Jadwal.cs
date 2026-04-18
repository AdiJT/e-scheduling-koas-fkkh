using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class Jadwal : Entity<int>
{
    public required DateOnly TanggalMulai { get; set; }

    public Kelompok Kelompok { get; set; }
    public Stase Stase { get; set; }

    public DateOnly TanggalSelesai(IHariLiburService hariLiburService)
    {
        var tanggalSelesai = TanggalMulai;
        var jumlahHari = 0;

        while(jumlahHari < Stase.JumlahHari)
        {
            tanggalSelesai = tanggalSelesai.AddDays(1);

            if (!hariLiburService.HariLibur(tanggalSelesai))
                jumlahHari++;
        }

        return tanggalSelesai;
    }
}

public interface IJadwalRepository
{
    Task<Jadwal?> Get(int id);
    Task<List<Jadwal>> GetAll();

    void Add(Jadwal jadwal);
    void Update(Jadwal jadwal);
    void Delete(Jadwal jadwal);
}
