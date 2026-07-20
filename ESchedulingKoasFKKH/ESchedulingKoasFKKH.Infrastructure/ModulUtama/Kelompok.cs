using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class KelompokConfiguration : IEntityTypeConfiguration<Kelompok>
{
    public void Configure(EntityTypeBuilder<Kelompok> builder)
    {
        builder.HasMany(x => x.DaftarMahasiswa).WithOne(y => y.Kelompok).IsRequired(false);
        builder.HasMany(x => x.DaftarJadwal).WithOne(y => y.Kelompok);
    }
}

internal class KelompokRepository : IKelompokRepository
{
    private readonly AppDbContext _appDbContext;

    public KelompokRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(Kelompok kelompok) => _appDbContext.Kelompok.Add(kelompok);

    public void Delete(Kelompok kelompok) => _appDbContext.Kelompok.Remove(kelompok);

    public async Task<Kelompok?> Get(int id) => await _appDbContext.Kelompok
        .Include(x => x.DaftarMahasiswa)
        .Include(x => x.DaftarJadwal).ThenInclude(x => x.Stase)
        .Include(x => x.DaftarJadwal).ThenInclude(x => x.Pembimbing)
        .Include(x => x.DaftarJadwal).ThenInclude(x => x.DaftarJadwalSubStase).ThenInclude(x => x.SubStase)
        .Include(x => x.DaftarJadwal).ThenInclude(x => x.DaftarJadwalSubStase).ThenInclude(x => x.Pembimbing)
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<Kelompok>> GetAll() => await _appDbContext.Kelompok
        .Include(x => x.DaftarMahasiswa)
        .Include(x => x.DaftarJadwal).ThenInclude(x => x.Stase)
        .Include(x => x.DaftarJadwal).ThenInclude(x => x.Pembimbing)
        .Include(x => x.DaftarJadwal).ThenInclude(x => x.DaftarJadwalSubStase).ThenInclude(x => x.SubStase)
        .Include(x => x.DaftarJadwal).ThenInclude(x => x.DaftarJadwalSubStase).ThenInclude(x => x.Pembimbing)
        .ToListAsync();

    public async Task<bool> IsExist(string nama, int? id = null) => await _appDbContext.Kelompok
        .AnyAsync(x => x.Id != id && x.Nama.ToLower() == nama.ToLower());

    public void Update(Kelompok kelompok) => _appDbContext.Kelompok.Update(kelompok);
}
