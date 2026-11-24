using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.Auth;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

public class NotifikasiDibaca : Entity<int>
{
    public int BroadcastId { get; set; }
    public Broadcast? Broadcast { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public DateTime TanggalDibaca { get; set; } = DateTime.Now;
}

public interface INotifikasiDibacaRepository
{
    Task<bool> IsRead(int broadcastId, int userId);
    Task<List<int>> GetReadBroadcastIdsByUser(int userId);
    Task<Dictionary<int, int>> GetReadCountsByBroadcastIds(List<int> broadcastIds);
    Task<int> GetTotalReadCount();
    void Add(NotifikasiDibaca notifikasiDibaca);
    void AddRange(IEnumerable<NotifikasiDibaca> items);
}
