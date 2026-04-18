using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.MahasiswaModels;

public class UpdateMahasiswa
{
    [Required]
    public int Id { get; set; }

    [Required]
    public string NIM { get; set; } = string.Empty;

    [Required]
    public string Nama { get; set; } = string.Empty;
}
