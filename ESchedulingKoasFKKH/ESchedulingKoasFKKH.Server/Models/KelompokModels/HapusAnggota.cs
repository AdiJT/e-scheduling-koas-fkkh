using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.KelompokModels;

public class HapusAnggota
{
    [Required]
    public int IdMahasiswa { get; set; }
}
