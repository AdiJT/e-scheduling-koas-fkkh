using ESchedulingKoasFKKH.Domain.Abstracts;

namespace ESchedulingKoasFKKH.Domain.ModulUtama;

internal class Mahasiswa : Entity<int>
{
    public required string Nama { get; set; }
}
