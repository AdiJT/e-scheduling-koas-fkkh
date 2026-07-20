using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class SubStaseConfiguration : IEntityTypeConfiguration<SubStase>
{
    public void Configure(EntityTypeBuilder<SubStase> builder)
    {
        builder.HasOne(x => x.Stase)
            .WithMany(y => y.DaftarSubStase);

        builder.HasMany(x => x.DaftarDefaultPembimbing)
            .WithMany();

        // Seeding 5 Sub-Stase khusus untuk Stase KODIL (Id = 1)
        builder.HasData(
            new { Id = 1, Nama = "Patologi Klinik", Urutan = 1, StaseId = 1 },
            new { Id = 2, Nama = "Patologi Veteriner", Urutan = 2, StaseId = 1 },
            new { Id = 3, Nama = "Mikrobiologi (Bakteriologi)", Urutan = 3, StaseId = 1 },
            new { Id = 4, Nama = "Virologi", Urutan = 4, StaseId = 1 },
            new { Id = 5, Nama = "Parasitologi", Urutan = 5, StaseId = 1 }
        );
    }
}

internal class SubStaseRepository : ISubStaseRepository
{
    private readonly AppDbContext _appDbContext;

    public SubStaseRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(SubStase subStase) => _appDbContext.SubStase.Add(subStase);

    public void Delete(SubStase subStase) => _appDbContext.SubStase.Remove(subStase);

    public async Task<SubStase?> Get(int id) => await _appDbContext.SubStase
        .Include(x => x.Stase)
        .Include(x => x.DaftarDefaultPembimbing)
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<SubStase>> GetAll() => await _appDbContext.SubStase
        .Include(x => x.Stase)
        .Include(x => x.DaftarDefaultPembimbing)
        .OrderBy(x => x.Urutan)
        .ToListAsync();

    public async Task<List<SubStase>> GetByStase(int staseId) => await _appDbContext.SubStase
        .Where(x => x.Stase.Id == staseId)
        .Include(x => x.DaftarDefaultPembimbing)
        .OrderBy(x => x.Urutan)
        .ToListAsync();

    public void Update(SubStase subStase) => _appDbContext.SubStase.Update(subStase);
}
