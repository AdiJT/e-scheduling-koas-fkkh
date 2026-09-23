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

    public void Delete(Broadcast broadcast) => _appDbContext.Broadcast.Remove(broadcast);

    public async Task<Broadcast?> Get(int id) => await _appDbContext.Broadcast
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<Broadcast>> GetAll(int limit = 50) => await _appDbContext.Broadcast
        .OrderByDescending(x => x.CreatedAt)
        .Take(limit)
        .ToListAsync();
}
