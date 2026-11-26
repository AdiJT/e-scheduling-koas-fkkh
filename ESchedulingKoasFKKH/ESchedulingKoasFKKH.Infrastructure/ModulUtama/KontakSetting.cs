using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class KontakSettingConfiguration : IEntityTypeConfiguration<KontakSetting>
{
    public void Configure(EntityTypeBuilder<KontakSetting> builder)
    {
        builder.ToTable("KontakSetting");

        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0);
        builder.HasData(new KontakSetting
        {
            Id = 1,
            Judul = "Kontak Administrator",
            SubJudul = "Layanan Bantuan Sistem E-Scheduling KOAS FKKH UNDANA",
            Lokasi = "Gedung Dekanat FKKH Universitas Nusa Cendana",
            Email = "fkkh@undana.ac.id",
            Telepon = null,
            WhatsApp = null,
            JamPelayanan = "Senin - Jumat, 08:00 - 16:00 WITA",
            Catatan = null,
            CreatedAt = seedDate,
            UpdatedAt = seedDate
        });
    }
}

internal class KontakSettingRepository : IKontakSettingRepository
{
    private readonly AppDbContext _appDbContext;

    public KontakSettingRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public async Task<KontakSetting?> GetDefault() =>
        await _appDbContext.KontakSetting
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync();

    public void Add(KontakSetting setting) => _appDbContext.KontakSetting.Add(setting);

    public void Update(KontakSetting setting) => _appDbContext.KontakSetting.Update(setting);
}
