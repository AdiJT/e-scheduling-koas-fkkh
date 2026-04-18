using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.KelompokModels;

public class TambahAnggota
{
    [Required]
    public int IdMahasiswa { get; set; }
}
