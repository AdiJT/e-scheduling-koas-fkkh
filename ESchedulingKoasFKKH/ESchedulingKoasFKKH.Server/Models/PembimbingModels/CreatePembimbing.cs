using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.PembimbingModels;

public class CreatePembimbing
{
    [Required]
    public string NIP { get; set; } = string.Empty;

    [Required]
    public string Nama { get; set; } = string.Empty;
}
