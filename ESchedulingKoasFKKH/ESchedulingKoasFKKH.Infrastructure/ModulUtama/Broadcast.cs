using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class BroadcastConfiguration : IEntityTypeConfiguration<Broadcast>
{
    public void Configure(EntityTypeBuilder<Broadcast> builder)
    {
        builder.ToTable("Broadcast");
        builder.HasIndex(x => x.CreatedAt);
    }
}

internal class BroadcastRepository : IBroadcastRepository
{
    private readonly AppDbContext _appDbContext;

    public BroadcastRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(Broadcast broadcast) => _appDbContext.Broadcast.Add(broadcast);

    public void Update(Broadcast broadcast) => _appDbContext.Broadcast.Update(broadcast);

    public void Delete(Broadcast broadcast) => _appDbContext.Broadcast.Remove(broadcast);

    public async Task<Broadcast?> Get(int id) => await _appDbContext.Broadcast
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<Broadcast>> GetAll(int limit = 50) => await _appDbContext.Broadcast
        .OrderByDescending(x => x.CreatedAt)
        .Take(limit)
        .ToListAsync();

    public async Task<List<Broadcast>> GetActiveBroadcasts() => await _appDbContext.Broadcast
        .Where(x => x.IsActive)
        .OrderByDescending(x => x.CreatedAt)
        .ToListAsync();

    public async Task<int> GetActiveCount() => await _appDbContext.Broadcast
        .CountAsync(x => x.IsActive);

    public async Task<int> GetTotalCount() => await _appDbContext.Broadcast
        .CountAsync();

    public async Task<int> GetCountThisMonth()
    {
        var now = DateTime.Now;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Unspecified);
        return await _appDbContext.Broadcast.CountAsync(x => x.CreatedAt >= startOfMonth);
    }
}
