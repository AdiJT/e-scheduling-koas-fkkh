using ESchedulingKoasFKKH.Domain.ModulUtama;

namespace ESchedulingKoasFKKH.Server.Models.StaseModels;

public class Update
{
    public int Id { get; set; }
    public string Nama { get; set; } = string.Empty;
    public int Waktu { get; set; }
    public JenisStase Jenis { get; set; }
}
