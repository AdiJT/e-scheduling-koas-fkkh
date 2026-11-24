using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class TahunAjaranConfiguration : IEntityTypeConfiguration<TahunAjaran>
{
    public void Configure(EntityTypeBuilder<TahunAjaran> builder)
    {
        builder.HasMany(x => x.DaftarSiswa).WithOne(y => y.TahunAjaran).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(x => new { x.Tahun, x.Semester }).IsUnique();
        builder.Property(x => x.TanggalMulai).IsRequired();
        builder.Property(x => x.TanggalSelesai).IsRequired();

        builder.HasData(
            new TahunAjaran
            {
                Id = 1,
                Tahun = 2025,
                Semester = Semester.Ganjil,
                TanggalMulai = new DateOnly(2025, 7, 1),
                TanggalSelesai = new DateOnly(2027, 7, 1)
            },
            new TahunAjaran
            {
                Id = 2,
                Tahun = 2025,
                Semester = Semester.Genap,
                TanggalMulai = new DateOnly(2026, 1, 1),
                TanggalSelesai = new DateOnly(2028, 1, 1)
            },
            new TahunAjaran
            {
                Id = 3,
                Tahun = 2026,
                Semester = Semester.Ganjil,
                TanggalMulai = new DateOnly(2026, 7, 1),
                TanggalSelesai = new DateOnly(2028, 7, 1)
            },
            new TahunAjaran
            {
                Id = 4,
                Tahun = 2026,
                Semester = Semester.Genap,
                TanggalMulai = new DateOnly(2027, 1, 1),
                TanggalSelesai = new DateOnly(2029, 1, 1)
            }
        );
    }
}

internal class TahunAjaranRepository : ITahunAjaranRepository
{
    private readonly AppDbContext _appDbContext;

    public TahunAjaranRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(TahunAjaran tahunAjaran) => _appDbContext.TahunAjaran.Add(tahunAjaran);

    public void Delete(TahunAjaran tahunAjaran) => _appDbContext.TahunAjaran.Remove(tahunAjaran);

    public async Task<TahunAjaran?> Get(int id) => await _appDbContext.TahunAjaran.FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<TahunAjaran>> GetAll() => await _appDbContext.TahunAjaran.ToListAsync();

    public void Update(TahunAjaran tahunAjaran) => _appDbContext.TahunAjaran.Update(tahunAjaran);
}