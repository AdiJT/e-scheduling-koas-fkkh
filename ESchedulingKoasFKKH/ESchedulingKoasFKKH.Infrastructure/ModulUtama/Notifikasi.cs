using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class NotifikasiConfiguration : IEntityTypeConfiguration<Notifikasi>
{
    public void Configure(EntityTypeBuilder<Notifikasi> builder)
    {
        builder.ToTable("Notifikasi");
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.IsRead);
        builder.HasIndex(x => new { x.UserId, x.MetadataKey }).IsUnique(false);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Broadcast)
            .WithMany(b => b.DaftarNotifikasi)
            .HasForeignKey(x => x.BroadcastId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal class NotifikasiRepository : INotifikasiRepository
{
    private readonly AppDbContext _appDbContext;

    public NotifikasiRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(Notifikasi notifikasi) => _appDbContext.Notifikasi.Add(notifikasi);

    public void AddRange(IEnumerable<Notifikasi> notifikasiList) => _appDbContext.Notifikasi.AddRange(notifikasiList);

    public void Update(Notifikasi notifikasi) => _appDbContext.Notifikasi.Update(notifikasi);

    public void Delete(Notifikasi notifikasi) => _appDbContext.Notifikasi.Remove(notifikasi);

    public async Task<Notifikasi?> Get(int id) => await _appDbContext.Notifikasi
        .Include(x => x.Broadcast)
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<Notifikasi>> GetByUserId(int userId, bool? unreadOnly = null, int limit = 50)
    {
        var query = _appDbContext.Notifikasi
            .Include(x => x.Broadcast)
            .Where(x => x.UserId == userId);

        if (unreadOnly.HasValue && unreadOnly.Value)
        {
            query = query.Where(x => !x.IsRead);
        }

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCount(int userId) => await _appDbContext.Notifikasi
        .CountAsync(x => x.UserId == userId && !x.IsRead);

    public async Task<bool> ExistsByMetadataKey(int userId, string metadataKey) => await _appDbContext.Notifikasi
        .AnyAsync(x => x.UserId == userId && x.MetadataKey == metadataKey);

    public async Task DeleteAllByUserId(int userId)
    {
        var list = await _appDbContext.Notifikasi.Where(x => x.UserId == userId).ToListAsync();
        _appDbContext.Notifikasi.RemoveRange(list);
    }
}
