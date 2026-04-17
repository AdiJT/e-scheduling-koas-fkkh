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

    public async Task<bool> IsExist(string nim) => await _appDbContext.Mahasiswa
        .AnyAsync(x => x.NIM.ToLower() == nim.ToLower());

    public void Update(Mahasiswa mahasiswa) => _appDbContext.Mahasiswa.Update(mahasiswa);
}