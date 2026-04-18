using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.MahasiswaModels;

public class CreateMahasiswa
{
    [Required]
    public string NIM { get; set; } = string.Empty;

    [Required]
    public string Nama { get; set; } = string.Empty;
}
