using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.ToTable("ActivityLog");
        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => x.Modul);
        builder.HasIndex(x => x.Aksi);
        builder.HasIndex(x => x.Role);
    }
}

internal class ActivityLogRepository : IActivityLogRepository
{
    private readonly AppDbContext _appDbContext;

    public ActivityLogRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(ActivityLog log) => _appDbContext.ActivityLog.Add(log);

    public async Task<List<ActivityLog>> GetFiltered(ActivityLogFilter filter, int limit = 1000)
    {
        var query = _appDbContext.ActivityLog.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Modul))
        {
            var modul = filter.Modul.Trim();
            query = query.Where(x => x.Modul == modul);
        }

        if (!string.IsNullOrWhiteSpace(filter.Aksi))
        {
            var aksi = filter.Aksi.Trim();
            query = query.Where(x => x.Aksi == aksi);
        }

        if (!string.IsNullOrWhiteSpace(filter.Role))
        {
            var role = filter.Role.Trim().ToLower();
            query = query.Where(x => x.Role.ToLower() == role);
        }

        if (filter.TanggalMulai.HasValue)
        {
            var start = filter.TanggalMulai.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.CreatedAt >= start);
        }

        if (filter.TanggalSelesai.HasValue)
        {
            var end = filter.TanggalSelesai.Value.ToDateTime(TimeOnly.MaxValue);
            query = query.Where(x => x.CreatedAt <= end);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var pattern = $"%{filter.Search.Trim()}%";
            query = query.Where(x =>
                EF.Functions.ILike(x.Username, pattern) ||
                (x.NamaPelaku != null && EF.Functions.ILike(x.NamaPelaku, pattern)) ||
                EF.Functions.ILike(x.Deskripsi, pattern) ||
                (x.TargetEntitas != null && EF.Functions.ILike(x.TargetEntitas, pattern)) ||
                EF.Functions.ILike(x.Modul, pattern) ||
                (x.Endpoint != null && EF.Functions.ILike(x.Endpoint, pattern)));
        }

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetTotalCount() => await _appDbContext.ActivityLog.CountAsync();
}
