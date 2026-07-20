using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class SubStase : Entity<int>
{
    public required string Nama { get; set; }
    public int Urutan { get; set; }

    public Stase Stase { get; set; }
    public Pembimbing? DefaultPembimbing { get; set; }
}

public interface ISubStaseRepository
{
    Task<SubStase?> Get(int id);
    Task<List<SubStase>> GetAll();
    Task<List<SubStase>> GetByStase(int staseId);

    void Add(SubStase subStase);
    void Update(SubStase subStase);
    void Delete(SubStase subStase);
}
