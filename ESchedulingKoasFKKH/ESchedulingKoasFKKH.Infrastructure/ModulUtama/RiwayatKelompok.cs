using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class RiwayatKelompokConfiguration : IEntityTypeConfiguration<RiwayatKelompok>
{
    public void Configure(EntityTypeBuilder<RiwayatKelompok> builder)
    {
        builder.ToTable("RiwayatKelompok");
    }
}

internal class RiwayatKelompokRepository : IRiwayatKelompokRepository
{
    private readonly AppDbContext _appDbContext;

    public RiwayatKelompokRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(RiwayatKelompok riwayat) => _appDbContext.RiwayatKelompok.Add(riwayat);

    public void Update(RiwayatKelompok riwayat) => _appDbContext.RiwayatKelompok.Update(riwayat);

    public void Delete(RiwayatKelompok riwayat) => _appDbContext.RiwayatKelompok.Remove(riwayat);

    public async Task<RiwayatKelompok?> Get(int id) => await _appDbContext.RiwayatKelompok
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<RiwayatKelompok>> GetAll() => await _appDbContext.RiwayatKelompok
        .OrderByDescending(x => x.TanggalDiarsipkan)
        .ToListAsync();
}
