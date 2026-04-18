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
        builder.HasData(
            new Mahasiswa { Id = 1, NIM = "2201001", Nama = "Ahmad Fauzi" },
            new Mahasiswa { Id = 2, NIM = "2201002", Nama = "Siti Nurhaliza" },
            new Mahasiswa { Id = 3, NIM = "2201003", Nama = "Muhammad Rizky" },
            new Mahasiswa { Id = 4, NIM = "2201004", Nama = "Dewi Anggraini" },
            new Mahasiswa { Id = 5, NIM = "2201005", Nama = "Budi Santoso" },
            new Mahasiswa { Id = 6, NIM = "2201006", Nama = "Putri Rahayu" },
            new Mahasiswa { Id = 7, NIM = "2201007", Nama = "Andi Pratama" },
            new Mahasiswa { Id = 8, NIM = "2201008", Nama = "Rina Wati" },
            new Mahasiswa { Id = 9, NIM = "2201009", Nama = "Fajar Nugroho" },
            new Mahasiswa { Id = 10, NIM = "2201010", Nama = "Lestari Dewi" },
            new Mahasiswa { Id = 11, NIM = "2201011", Nama = "Hendra Gunawan" },
            new Mahasiswa { Id = 12, NIM = "2201012", Nama = "Indah Permata" },
            new Mahasiswa { Id = 13, NIM = "2201013", Nama = "Yoga Aditya" },
            new Mahasiswa { Id = 14, NIM = "2201014", Nama = "Nadia Safitri" },
            new Mahasiswa { Id = 15, NIM = "2201015", Nama = "Rizal Ramadhan" },
            new Mahasiswa { Id = 16, NIM = "2201016", Nama = "Fitri Handayani" },
            new Mahasiswa { Id = 17, NIM = "2201017", Nama = "Dimas Ardiansyah" },
            new Mahasiswa { Id = 18, NIM = "2201018", Nama = "Sari Mulyani" },
            new Mahasiswa { Id = 19, NIM = "2201019", Nama = "Agus Setiawan" },
            new Mahasiswa { Id = 20, NIM = "2201020", Nama = "Maya Puspita" }
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
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<Mahasiswa?> Get(string nim) => await _appDbContext.Mahasiswa
        .Include(x => x.Kelompok).ThenInclude(x => x.DaftarJadwal)
        .Include(x => x.Kelompok).ThenInclude(x => x.Pembimbing)
        .FirstOrDefaultAsync(x => x.NIM == nim);

    public async Task<List<Mahasiswa>> GetAll() => await _appDbContext.Mahasiswa
        .Include(x => x.Kelompok).ThenInclude(x => x.DaftarJadwal)
        .Include(x => x.Kelompok).ThenInclude(x => x.Pembimbing)
        .ToListAsync();

    public async Task<bool> IsExist(string nim, int? id = null) => await _appDbContext.Mahasiswa
        .AnyAsync(x => x.Id != id && x.NIM.ToLower() == nim.ToLower());

    public void Update(Mahasiswa mahasiswa) => _appDbContext.Mahasiswa.Update(mahasiswa);
}