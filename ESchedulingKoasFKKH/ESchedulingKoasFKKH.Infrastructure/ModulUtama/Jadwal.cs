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
        builder.HasOne(x => x.Pembimbing).WithMany().IsRequired(false);
        builder.HasMany(x => x.DaftarJadwalSubStase).WithOne(y => y.Jadwal);
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
        .Include(x => x.Pembimbing)
        .Include(x => x.DaftarJadwalSubStase).ThenInclude(y => y.SubStase)
        .Include(x => x.DaftarJadwalSubStase).ThenInclude(y => y.Pembimbing)
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<Jadwal>> GetAll() => await _appDbContext.Jadwal
        .Include(x => x.Kelompok).ThenInclude(y => y.DaftarMahasiswa)
        .Include(x => x.Kelompok).ThenInclude(y => y.Pembimbing)
        .Include(x => x.Stase)
        .Include(x => x.Pembimbing)
        .Include(x => x.DaftarJadwalSubStase).ThenInclude(y => y.SubStase)
        .Include(x => x.DaftarJadwalSubStase).ThenInclude(y => y.Pembimbing)
        .ToListAsync();

    public void Update(Jadwal jadwal) => _appDbContext.Jadwal.Update(jadwal);
    
    public async Task DeleteAll() => await _appDbContext.Jadwal.ExecuteDeleteAsync();
}
