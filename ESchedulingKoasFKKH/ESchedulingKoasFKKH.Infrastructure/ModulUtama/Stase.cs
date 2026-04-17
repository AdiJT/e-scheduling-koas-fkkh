using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class StaseConfiguration : IEntityTypeConfiguration<Stase>
{
    public void Configure(EntityTypeBuilder<Stase> builder)
    {
        builder.HasMany(x => x.DaftarJadwal).WithOne(y => y.Stase);
    }
}

internal class StaseRepository : IStaseRepository
{
    private readonly AppDbContext _appDbContext;

    public StaseRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(Stase stase) => _appDbContext.Stase.Add(stase);

    public void Delete(Stase stase) => _appDbContext.Stase.Remove(stase);

    public async Task<Stase?> Get(int id) => await _appDbContext.Stase
        .Include(x => x.DaftarJadwal).ThenInclude(x => x.Kelompok)
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<Stase>> GetAll() => await _appDbContext.Stase
        .Include(x => x.DaftarJadwal).ThenInclude(x => x.Kelompok)
        .ToListAsync();

    public async Task<bool> IsExist(string nama) => await _appDbContext.Stase
        .AnyAsync(x => x.Nama == nama);

    public void Update(Stase stase) => _appDbContext.Stase.Update(stase);
}
