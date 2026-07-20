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

    public int? IdPembimbing { get; set; }

    public List<CreateJadwalSubStase>? DaftarSubStasePembimbing { get; set; }
}

public class CreateJadwalSubStase
{
    [Required]
    public int IdSubStase { get; set; }

    public int? IdPembimbing { get; set; }
}
