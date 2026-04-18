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

        builder.HasData(
            new Stase { Id = 1, Nama = "KODIL", Waktu = 7, Jenis = JenisStase.Terpisah },
            new Stase { Id = 2, Nama = "PDHK", Waktu = 6, Jenis = JenisStase.Terpisah },
            new Stase { Id = 3, Nama = "PDHB", Waktu = 6, Jenis = JenisStase.Terpisah },
            new Stase { Id = 4, Nama = "Bedah dan Teknik Pencitraan Radiologi", Waktu = 6, Jenis = JenisStase.Terpisah },
            new Stase { Id = 5, Nama = "Kesmavet dan Epidemiologi", Waktu = 4, Jenis = JenisStase.Terpisah },
            new Stase { Id = 6, Nama = "Kedinasan dan Karantina", Waktu = 2, Jenis = JenisStase.Terpisah },
            new Stase { Id = 7, Nama = "Seminar", Waktu = 1, Jenis = JenisStase.Terpisah },
            new Stase { Id = 8, Nama = "Magang Profesi", Waktu = 4, Jenis = JenisStase.Bersamaan },
            new Stase { Id = 9, Nama = "Magang Babi", Waktu = 2, Jenis = JenisStase.Bersamaan },
            new Stase { Id = 10, Nama = "Magang Sapi", Waktu = 2, Jenis = JenisStase.Bersamaan },
            new Stase { Id = 11, Nama = "Magang Satwa Liar", Waktu = 2, Jenis = JenisStase.Bersamaan },
            new Stase { Id = 12, Nama = "Magang Kuda", Waktu = 2, Jenis = JenisStase.Bersamaan },
            new Stase { Id = 13, Nama = "Ujian Komprehensip",Waktu = 1, Jenis = JenisStase.Terpisah }
        );
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

    public async Task<bool> IsExist(string nama, int? id = null) => await _appDbContext.Stase
        .AnyAsync(x => x.Id != id && x.Nama == nama);

    public void Update(Stase stase) => _appDbContext.Stase.Update(stase);
}
