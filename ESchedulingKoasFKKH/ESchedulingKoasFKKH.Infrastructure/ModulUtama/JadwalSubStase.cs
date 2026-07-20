using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class JadwalSubStaseConfiguration : IEntityTypeConfiguration<JadwalSubStase>
{
    public void Configure(EntityTypeBuilder<JadwalSubStase> builder)
    {
        builder.HasOne(x => x.Jadwal)
            .WithMany(y => y.DaftarJadwalSubStase);

        builder.HasOne(x => x.SubStase)
            .WithMany();

        builder.HasOne(x => x.Pembimbing)
            .WithMany()
            .IsRequired(false);
    }
}

internal class JadwalSubStaseRepository : IJadwalSubStaseRepository
{
    private readonly AppDbContext _appDbContext;

    public JadwalSubStaseRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(JadwalSubStase jadwalSubStase) => _appDbContext.Set<JadwalSubStase>().Add(jadwalSubStase);

    public void Delete(JadwalSubStase jadwalSubStase) => _appDbContext.Set<JadwalSubStase>().Remove(jadwalSubStase);

    public async Task<JadwalSubStase?> Get(int id) => await _appDbContext.Set<JadwalSubStase>()
        .Include(x => x.Jadwal)
        .Include(x => x.SubStase)
        .Include(x => x.Pembimbing)
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<JadwalSubStase>> GetByJadwal(int jadwalId) => await _appDbContext.Set<JadwalSubStase>()
        .Where(x => x.Jadwal.Id == jadwalId)
        .Include(x => x.SubStase)
        .Include(x => x.Pembimbing)
        .OrderBy(x => x.SubStase.Urutan)
        .ToListAsync();

    public void Update(JadwalSubStase jadwalSubStase) => _appDbContext.Set<JadwalSubStase>().Update(jadwalSubStase);
}
