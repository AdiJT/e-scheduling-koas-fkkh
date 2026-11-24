using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.JadwalModels;

public sealed class GenerateJadwalOtomatis
{
    [Required(ErrorMessage = "Tahun ajaran wajib dipilih untuk generate jadwal.")]
    public int IdTahunAjaran { get; set; }

    public DateOnly? TanggalMulai { get; set; }
}
