using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class JadwalSubStase : Entity<int>
{
    public Jadwal Jadwal { get; set; }
    public SubStase SubStase { get; set; }
    public Pembimbing? Pembimbing { get; set; }
}

public interface IJadwalSubStaseRepository
{
    Task<JadwalSubStase?> Get(int id);
    Task<List<JadwalSubStase>> GetByJadwal(int jadwalId);

    void Add(JadwalSubStase jadwalSubStase);
    void Update(JadwalSubStase jadwalSubStase);
    void Delete(JadwalSubStase jadwalSubStase);
}
