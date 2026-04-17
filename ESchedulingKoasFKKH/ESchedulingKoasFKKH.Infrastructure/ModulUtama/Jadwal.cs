using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class JadwalConfiguration : IEntityTypeConfiguration<Jadwal>
{
    public void Configure(EntityTypeBuilder<Jadwal> builder)
    {
        builder.HasOne(x => x.Stase).WithMany(y => y.DaftarJadwal);
        builder.HasOne(x => x.Kelompok).WithMany(y => y.DaftarJadwal);
    }
}

internal class JadwalRepository : IJadwalRepository
{
    private readonly AppDbContext _appDbContext;

    public JadwalRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(Jadwal jadwal) => _appDbContext.Jadwal.Add(jadwal);

    public void Delete(Jadwal jadwal) => _appDbContext.Jadwal.Remove(jadwal);

    public async Task<Jadwal?> Get(int id) => await _appDbContext.Jadwal
        .Include(x => x.Kelompok).ThenInclude(y => y.DaftarMahasiswa)
        .Include(x => x.Kelompok).ThenInclude(y => y.Pembimbing)
        .Include(x => x.Stase)
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<Jadwal>> GetAll() => await _appDbContext.Jadwal
        .Include(x => x.Kelompok).ThenInclude(y => y.DaftarMahasiswa)
        .Include(x => x.Kelompok).ThenInclude(y => y.Pembimbing)
        .Include(x => x.Stase)
        .ToListAsync();

    public void Update(Jadwal jadwal) => _appDbContext.Jadwal.Update(jadwal);
}
