using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class HariLiburConfiguration : IEntityTypeConfiguration<HariLibur>
{
    public void Configure(EntityTypeBuilder<HariLibur> builder)
    {
        builder.ToTable("HariLibur");
        builder.HasIndex(x => new { x.TanggalMulai, x.TanggalSelesai });

        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0);
        builder.HasData(
            new HariLibur { Id = 1, TanggalMulai = new DateOnly(2026, 1, 16), TanggalSelesai = new DateOnly(2026, 1, 16), Nama = "Isra Mikraj Muhammad SAW", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 2, TanggalMulai = new DateOnly(2026, 2, 16), TanggalSelesai = new DateOnly(2026, 2, 17), Nama = "Cuti Bersama & Tahun Baru Imlek", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 3, TanggalMulai = new DateOnly(2026, 2, 19), TanggalSelesai = new DateOnly(2026, 2, 19), Nama = "1 Ramadhan", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 4, TanggalMulai = new DateOnly(2026, 3, 16), TanggalSelesai = new DateOnly(2026, 3, 30), Nama = "Libur Ramadhan & Idul Fitri", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 5, TanggalMulai = new DateOnly(2026, 4, 1), TanggalSelesai = new DateOnly(2026, 4, 7), Nama = "Libur Paskah", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 6, TanggalMulai = new DateOnly(2026, 5, 1), TanggalSelesai = new DateOnly(2026, 5, 1), Nama = "Hari Buruh Internasional", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 7, TanggalMulai = new DateOnly(2026, 5, 14), TanggalSelesai = new DateOnly(2026, 5, 14), Nama = "Kenaikan Isa Al Masih", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 8, TanggalMulai = new DateOnly(2026, 5, 15), TanggalSelesai = new DateOnly(2026, 5, 15), Nama = "Cuti Bersama Kenaikan Isa Al Masih", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 9, TanggalMulai = new DateOnly(2026, 5, 27), TanggalSelesai = new DateOnly(2026, 5, 27), Nama = "Hari Raya Idul Adha", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 10, TanggalMulai = new DateOnly(2026, 5, 28), TanggalSelesai = new DateOnly(2026, 5, 28), Nama = "Cuti Bersama Idul Adha", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 11, TanggalMulai = new DateOnly(2026, 5, 31), TanggalSelesai = new DateOnly(2026, 5, 31), Nama = "Hari Raya Waisak", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 12, TanggalMulai = new DateOnly(2026, 6, 1), TanggalSelesai = new DateOnly(2026, 6, 1), Nama = "Hari Lahir Pancasila", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 13, TanggalMulai = new DateOnly(2026, 6, 16), TanggalSelesai = new DateOnly(2026, 6, 16), Nama = "1 Muharam (Tahun Baru Islam)", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 14, TanggalMulai = new DateOnly(2026, 8, 17), TanggalSelesai = new DateOnly(2026, 8, 17), Nama = "Hari Proklamasi Kemerdekaan RI", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 15, TanggalMulai = new DateOnly(2026, 8, 25), TanggalSelesai = new DateOnly(2026, 8, 25), Nama = "Maulid Nabi Muhammad SAW", CreatedAt = seedDate, UpdatedAt = seedDate },
            new HariLibur { Id = 16, TanggalMulai = new DateOnly(2026, 12, 22), TanggalSelesai = new DateOnly(2027, 1, 2), Nama = "Libur Natal dan Tahun Baru", CreatedAt = seedDate, UpdatedAt = seedDate }
        );
    }
}

internal class HariLiburRepository : IHariLiburRepository
{
    private readonly AppDbContext _appDbContext;

    public HariLiburRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public async Task<List<HariLibur>> GetAll(int? tahun = null)
    {
        var query = _appDbContext.HariLibur.AsNoTracking().AsQueryable();

        if (tahun.HasValue)
        {
            var startOfYear = new DateOnly(tahun.Value, 1, 1);
            var endOfYear = new DateOnly(tahun.Value, 12, 31);
            query = query.Where(x => x.TanggalMulai <= endOfYear && x.TanggalSelesai >= startOfYear);
        }

        return await query
            .OrderBy(x => x.TanggalMulai)
            .ThenBy(x => x.TanggalSelesai)
            .ThenBy(x => x.Id)
            .ToListAsync();
    }

    public async Task<HariLibur?> Get(int id) =>
        await _appDbContext.HariLibur.FirstOrDefaultAsync(x => x.Id == id);

    public void Add(HariLibur item) => _appDbContext.HariLibur.Add(item);

    public void Update(HariLibur item) => _appDbContext.HariLibur.Update(item);

    public void Delete(HariLibur item) => _appDbContext.HariLibur.Remove(item);
}
