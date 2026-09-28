using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class NotifikasiDibacaConfiguration : IEntityTypeConfiguration<NotifikasiDibaca>
{
    public void Configure(EntityTypeBuilder<NotifikasiDibaca> builder)
    {
        builder.ToTable("NotifikasiDibaca");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TanggalDibaca)
            .HasColumnType("timestamp without time zone");

        builder.HasIndex(x => new { x.BroadcastId, x.UserId })
            .IsUnique();

        builder.HasOne(x => x.Broadcast)
            .WithMany(b => b.DaftarDibaca)
            .HasForeignKey(x => x.BroadcastId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal class NotifikasiDibacaRepository : INotifikasiDibacaRepository
{
    private readonly AppDbContext _appDbContext;

    public NotifikasiDibacaRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public async Task<bool> IsRead(int broadcastId, int userId) => await _appDbContext.NotifikasiDibaca
        .AnyAsync(x => x.BroadcastId == broadcastId && x.UserId == userId);

    public async Task<List<int>> GetReadBroadcastIdsByUser(int userId) => await _appDbContext.NotifikasiDibaca
        .Where(x => x.UserId == userId)
        .Select(x => x.BroadcastId)
        .ToListAsync();

    public async Task<Dictionary<int, int>> GetReadCountsByBroadcastIds(List<int> broadcastIds)
    {
        if (broadcastIds.Count == 0) return new Dictionary<int, int>();

        return await _appDbContext.NotifikasiDibaca
            .Where(x => broadcastIds.Contains(x.BroadcastId))
            .GroupBy(x => x.BroadcastId)
            .Select(g => new { BroadcastId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.BroadcastId, x => x.Count);
    }

    public async Task<int> GetTotalReadCount() => await _appDbContext.NotifikasiDibaca.CountAsync();

    public void Add(NotifikasiDibaca notifikasiDibaca) => _appDbContext.NotifikasiDibaca.Add(notifikasiDibaca);

    public void AddRange(IEnumerable<NotifikasiDibaca> items) => _appDbContext.NotifikasiDibaca.AddRange(items);
}
