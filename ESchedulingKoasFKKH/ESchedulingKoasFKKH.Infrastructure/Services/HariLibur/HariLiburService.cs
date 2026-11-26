using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace ESchedulingKoasFKKH.Infrastructure.Services.HariLibur;

internal class HariLiburService : IHariLiburService
{
    private readonly AppDbContext _dbContext;
    private List<(DateOnly Mulai, DateOnly Selesai)>? _cachedRanges;

    public HariLiburService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private List<(DateOnly Mulai, DateOnly Selesai)> GetRanges()
    {
        _cachedRanges ??= _dbContext.HariLibur
            .AsNoTracking()
            .Select(x => new { x.TanggalMulai, x.TanggalSelesai })
            .ToList()
            .Select(x => (x.TanggalMulai, x.TanggalSelesai))
            .ToList();

        return _cachedRanges;
    }

    public bool HariLibur(DateOnly tanggal) =>
        GetRanges().Any(r => tanggal >= r.Mulai && tanggal <= r.Selesai);
}
