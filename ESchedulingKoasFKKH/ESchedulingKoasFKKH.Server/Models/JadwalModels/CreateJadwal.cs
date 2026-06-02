using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.JadwalModels;

public class CreateJadwal
{
    [Required]
    public DateOnly TanggalMulai { get; set; }

    [Required]
    public int IdKelompok { get; set; }

    [Required]
    public int IdStase { get; set; }
}
