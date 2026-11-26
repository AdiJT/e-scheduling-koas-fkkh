using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class FaqItemConfiguration : IEntityTypeConfiguration<FaqItem>
{
    public void Configure(EntityTypeBuilder<FaqItem> builder)
    {
        builder.ToTable("FaqItem");
        builder.HasIndex(x => x.Urutan);

        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0);
        builder.HasData(
            new FaqItem
            {
                Id = 1,
                Pertanyaan = "Email Google apa yang dapat saya gunakan untuk masuk?",
                Jawaban = "Anda wajib menggunakan akun Google dengan email yang sudah terhubung atau terdaftar pada profil akun SIADIKNONA Anda. Sistem akan mencocokkan email Google dengan data SIADIKNONA.",
                Urutan = 1,
                IsAktif = true,
                CreatedAt = seedDate,
                UpdatedAt = seedDate
            },
            new FaqItem
            {
                Id = 2,
                Pertanyaan = "Bagaimana jika email saya belum terhubung ke SIADIKNONA?",
                Jawaban = "Silakan perbarui data email aktif Anda pada portal SIADIKNONA atau koordinasikan dengan bagian akademik/admin FKKH UNDANA agar data email Anda dapat disinkronkan ke dalam sistem penjadwalan.",
                Urutan = 2,
                IsAktif = true,
                CreatedAt = seedDate,
                UpdatedAt = seedDate
            },
            new FaqItem
            {
                Id = 3,
                Pertanyaan = "Apakah saya masih bisa login dengan email dan password manual?",
                Jawaban = "Ya, Anda tetap dapat login secara manual. Cukup masukkan email terdaftar Anda dan password pada form input di bawah tombol Google.",
                Urutan = 3,
                IsAktif = true,
                CreatedAt = seedDate,
                UpdatedAt = seedDate
            },
            new FaqItem
            {
                Id = 4,
                Pertanyaan = "Bagaimana jika saya lupa password akun manual saya?",
                Jawaban = "Jika email Anda terdaftar di SIADIKNONA, Anda bisa langsung masuk menggunakan opsi \"Masuk dengan Google\". Atau, Anda dapat menghubungi Administrator FKKH UNDANA untuk bantuan reset password akun manual.",
                Urutan = 4,
                IsAktif = true,
                CreatedAt = seedDate,
                UpdatedAt = seedDate
            },
            new FaqItem
            {
                Id = 5,
                Pertanyaan = "Muncul pesan \"Akun Belum Terdaftar\" saat login Google, apa penyebabnya?",
                Jawaban = "Pesan ini muncul jika email akun Google yang Anda pilih belum tercatat pada data SIADIKNONA di sistem penjadwalan. Pastikan Anda memilih akun Google yang benar sesuai email di SIADIKNONA.",
                Urutan = 5,
                IsAktif = true,
                CreatedAt = seedDate,
                UpdatedAt = seedDate
            }
        );
    }
}

internal class FaqRepository : IFaqRepository
{
    private readonly AppDbContext _appDbContext;

    public FaqRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public async Task<List<FaqItem>> GetAll(bool hanyaAktif = false)
    {
        var query = _appDbContext.FaqItem.AsNoTracking().AsQueryable();
        if (hanyaAktif)
        {
            query = query.Where(x => x.IsAktif);
        }

        return await query
            .OrderBy(x => x.Urutan)
            .ThenBy(x => x.Id)
            .ToListAsync();
    }

    public async Task<FaqItem?> Get(int id) =>
        await _appDbContext.FaqItem.FirstOrDefaultAsync(x => x.Id == id);

    public void Add(FaqItem item) => _appDbContext.FaqItem.Add(item);

    public void Update(FaqItem item) => _appDbContext.FaqItem.Update(item);

    public void Delete(FaqItem item) => _appDbContext.FaqItem.Remove(item);
}
