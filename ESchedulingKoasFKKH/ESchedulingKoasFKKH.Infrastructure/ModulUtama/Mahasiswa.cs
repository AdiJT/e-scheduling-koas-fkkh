using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class MahasiswaConfiguration : IEntityTypeConfiguration<Mahasiswa>
{
    public void Configure(EntityTypeBuilder<Mahasiswa> builder)
    {
        builder.HasOne(x => x.Kelompok).WithMany(y => y.DaftarMahasiswa).IsRequired(false);
        builder.HasOne(x => x.User).WithOne(y => y.Mahasiswa).HasForeignKey<Mahasiswa>("UserId");

        builder.HasData(
            new { Id = 1, NIM = "2201001", Nama = "Ahmad Fauzi", UserId = 3, },
            new { Id = 2, NIM = "2201002", Nama = "Siti Nurhaliza", UserId = 4, },
            new { Id = 3, NIM = "2201003", Nama = "Muhammad Rizky", UserId = 5, },
            new { Id = 4, NIM = "2201004", Nama = "Dewi Anggraini", UserId = 6, },
            new { Id = 5, NIM = "2201005", Nama = "Budi Santoso", UserId = 7, },
            new { Id = 6, NIM = "2201006", Nama = "Putri Rahayu", UserId = 8, },
            new { Id = 7, NIM = "2201007", Nama = "Andi Pratama", UserId = 9, },
            new { Id = 8, NIM = "2201008", Nama = "Rina Wati", UserId = 10, },
            new { Id = 9, NIM = "2201009", Nama = "Fajar Nugroho", UserId = 11, },
            new { Id = 10, NIM = "2201010", Nama = "Lestari Dewi", UserId = 12, },
            new { Id = 11, NIM = "2201011", Nama = "Hendra Gunawan", UserId = 13, },
            new { Id = 12, NIM = "2201012", Nama = "Indah Permata", UserId = 14, },
            new { Id = 13, NIM = "2201013", Nama = "Yoga Aditya", UserId = 15, },
            new { Id = 14, NIM = "2201014", Nama = "Nadia Safitri", UserId = 16, },
            new { Id = 15, NIM = "2201015", Nama = "Rizal Ramadhan", UserId = 17, },
            new { Id = 16, NIM = "2201016", Nama = "Fitri Handayani", UserId = 18, },
            new { Id = 17, NIM = "2201017", Nama = "Dimas Ardiansyah", UserId = 19, },
            new { Id = 18, NIM = "2201018", Nama = "Sari Mulyani", UserId = 20, },
            new { Id = 19, NIM = "2201019", Nama = "Agus Setiawan", UserId = 21, },
            new { Id = 20, NIM = "2201020", Nama = "Maya Puspita", UserId = 22, }
        );
    }
}

internal class MahasiswaRepository : IMahasiswaRepository
{
    private readonly AppDbContext _appDbContext;

    public MahasiswaRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(Mahasiswa mahasiswa) => _appDbContext.Mahasiswa.Add(mahasiswa);

    public void Delete(Mahasiswa mahasiswa) => _appDbContext.Mahasiswa.Remove(mahasiswa);

    public async Task<Mahasiswa?> Get(int id) => await _appDbContext.Mahasiswa
        .Include(x => x.Kelompok).ThenInclude(x => x.DaftarJadwal)
        .Include(x => x.Kelompok).ThenInclude(x => x.Pembimbing)
        .Include(x => x.User)
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<Mahasiswa?> Get(string nim) => await _appDbContext.Mahasiswa
        .Include(x => x.Kelompok).ThenInclude(x => x.DaftarJadwal)
        .Include(x => x.Kelompok).ThenInclude(x => x.Pembimbing)
        .Include(x => x.User)
        .FirstOrDefaultAsync(x => x.NIM == nim);

    public async Task<List<Mahasiswa>> GetAll() => await _appDbContext.Mahasiswa
        .Include(x => x.Kelompok).ThenInclude(x => x.DaftarJadwal)
        .Include(x => x.Kelompok).ThenInclude(x => x.Pembimbing)
        .Include(x => x.User)
        .ToListAsync();

    public async Task<bool> IsExist(string nim, int? id = null) => await _appDbContext.Mahasiswa
        .AnyAsync(x => x.Id != id && x.NIM.ToLower() == nim.ToLower());

    public void Update(Mahasiswa mahasiswa) => _appDbContext.Mahasiswa.Update(mahasiswa);
}