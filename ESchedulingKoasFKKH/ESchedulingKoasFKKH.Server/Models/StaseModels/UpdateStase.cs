using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.StaseModels;

public class UpdateStase
{
    [Required]
    public int Id { get; set; }

    [Required]
    public string Nama { get; set; } = string.Empty;

    [Required]
    public int Waktu { get; set; }

    [Required]
    public string Jenis { get; set; } = string.Empty;
}
