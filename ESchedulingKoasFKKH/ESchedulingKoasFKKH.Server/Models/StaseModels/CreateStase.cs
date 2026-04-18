using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.StaseModels;

public class CreateStase
{
    [Required]
    public string Nama { get; set; } = string.Empty;

    [Required]
    public int Waktu { get; set; }

    [Required]
    public string Jenis { get; set; } = string.Empty;
}
