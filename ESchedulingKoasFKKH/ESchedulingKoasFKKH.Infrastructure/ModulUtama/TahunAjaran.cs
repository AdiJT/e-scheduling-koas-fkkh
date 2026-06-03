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

        builder.HasData(
            new TahunAjaran
            {
                Id = 1,
                Tahun = 2025,
                Semester = Semester.Ganjil
            },
            new TahunAjaran
            {
                Id = 2,
                Tahun = 2025,
                Semester = Semester.Genap
            },
            new TahunAjaran
            {
                Id = 3,
                Tahun = 2026,
                Semester = Semester.Ganjil
            },
            new TahunAjaran
            {
                Id = 4,
                Tahun = 2026,
                Semester = Semester.Genap
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