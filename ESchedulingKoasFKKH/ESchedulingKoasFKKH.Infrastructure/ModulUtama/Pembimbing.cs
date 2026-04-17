using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ESchedulingKoasFKKH.Infrastructure.ModulUtama;

internal class PembimbingConfiguration : IEntityTypeConfiguration<Pembimbing>
{
    public void Configure(EntityTypeBuilder<Pembimbing> builder)
    {
        builder.HasMany(x => x.DaftarKelompok).WithOne(y => y.Pembimbing).IsRequired(false);
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
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<Pembimbing?> Get(string nip) => await _appDbContext.Pembimbing
        .Include(x => x.DaftarKelompok).ThenInclude(x => x.DaftarMahasiswa)
        .Include(x => x.DaftarKelompok).ThenInclude(x => x.DaftarJadwal)
        .FirstOrDefaultAsync(x => x.NIP == nip);

    public async Task<List<Pembimbing>> GetAll() => await _appDbContext.Pembimbing
        .Include(x => x.DaftarKelompok).ThenInclude(x => x.DaftarMahasiswa)
        .Include(x => x.DaftarKelompok).ThenInclude(x => x.DaftarJadwal)
        .ToListAsync();

    public async Task<bool> IsExist(string nip) => await _appDbContext.Pembimbing
        .AnyAsync(x => x.NIP.ToLower() == nip.ToLower());

    public void Update(Pembimbing pembimbing) => _appDbContext.Pembimbing.Update(pembimbing);
}
