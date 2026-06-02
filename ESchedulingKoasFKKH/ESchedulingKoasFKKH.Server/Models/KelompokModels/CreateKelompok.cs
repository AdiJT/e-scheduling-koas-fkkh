using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.KelompokModels;

public class CreateKelompok
{
    [Required]
    public string Nama { get; set; } = string.Empty;
}
