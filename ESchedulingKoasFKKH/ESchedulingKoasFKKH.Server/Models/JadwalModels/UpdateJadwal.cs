namespace ESchedulingKoasFKKH.Server.Models.JadwalModels;

public sealed class UpdateJadwal
{
    public required DateOnly TanggalMulai { get; set; }
    public bool KonfirmasiOverride { get; set; }
}
