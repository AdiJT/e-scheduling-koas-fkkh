using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class PembimbingConfiguration : IEntityTypeConfiguration<Pembimbing>
{
    public void Configure(EntityTypeBuilder<Pembimbing> builder)
    {
        builder.HasMany(x => x.DaftarKelompok).WithOne(y => y.Pembimbing).IsRequired(false);
        builder.HasOne(x => x.User).WithOne(y => y.Pembimbing).HasForeignKey<Pembimbing>("UserId");

        builder.HasData(
            new { Id = 1, NIP = "198501012010011001", Nama = "Drg. Adi Wijaya, Sp.KG", UserId = 23 },
            new { Id = 2, NIP = "198602022011012002", Nama = "Drg. Sinta Maharani, M.Kes", UserId = 24 },
            new { Id = 3, NIP = "197803032009011003", Nama = "Drg. Bambang Hermanto, Sp.BM", UserId = 25 },
            new { Id = 4, NIP = "198204042012012004", Nama = "Drg. Ratna Sari, Sp.Perio", UserId = 26 },
            new { Id = 5, NIP = "197905052010011005", Nama = "Drg. Hasan Basri, Sp.Ort", UserId = 27 },
            new { Id = 6, NIP = "198306062013012006", Nama = "Drg. Anita Kusuma, Sp.PM", UserId = 28 },
            new { Id = 7, NIP = "197607072008011007", Nama = "Drg. Taufik Hidayat, Sp.Pros", UserId = 29 },
            new { Id = 8, NIP = "198408082014012008", Nama = "Drg. Wulandari, M.Sc", UserId = 30 },
            new { Id = 9, NIP = "197709092007011009", Nama = "Drg. Surya Darma, Sp.RKG", UserId = 31 },
            new { Id = 10, NIP = "198510102015012010", Nama = "Drg. Lina Marlina, Sp.KGA", UserId = 32 }
        );
    }
}

internal class PembimbingRepository : IPembimbingRepository
{
    private readonly AppDbContext _appDbContext;

    public PembimbingRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(Pembimbing pembimbing) => _appDbContext.Pembimbing.Add(pembimbing);

    public void Delete(Pembimbing pembimbing) => _appDbContext.Pembimbing.Remove(pembimbing);

    public async Task<Pembimbing?> Get(int id) => await _appDbContext.Pembimbing
        .Include(x => x.DaftarKelompok).ThenInclude(x => x.DaftarMahasiswa)
        .Include(x => x.DaftarKelompok).ThenInclude(x => x.DaftarJadwal)
        .Include(x => x.User)
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<Pembimbing?> Get(string nip) => await _appDbContext.Pembimbing
        .Include(x => x.DaftarKelompok).ThenInclude(x => x.DaftarMahasiswa)
        .Include(x => x.DaftarKelompok).ThenInclude(x => x.DaftarJadwal)
        .Include(x => x.User)
        .FirstOrDefaultAsync(x => x.NIP == nip);

    public async Task<List<Pembimbing>> GetAll() => await _appDbContext.Pembimbing
        .Include(x => x.DaftarKelompok).ThenInclude(x => x.DaftarMahasiswa)
        .Include(x => x.DaftarKelompok).ThenInclude(x => x.DaftarJadwal)
        .Include(x => x.User)
        .ToListAsync();

    public async Task<bool> IsExist(string nip, int? id = null) => await _appDbContext.Pembimbing
        .AnyAsync(x => x.Id != id && x.NIP.ToLower() == nip.ToLower());

    public void Update(Pembimbing pembimbing) => _appDbContext.Pembimbing.Update(pembimbing);
}
