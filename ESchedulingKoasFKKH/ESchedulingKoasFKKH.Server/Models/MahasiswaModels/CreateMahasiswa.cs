using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.MahasiswaModels;

public class CreateMahasiswa
{
    [Required]
    public string NIM { get; set; } = string.Empty;

    [Required]
    public string Nama { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Tahun ajaran wajib dipilih")]
    public int IdTahunAjaran { get; set; }
}
