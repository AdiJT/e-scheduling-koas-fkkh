using ESchedulingKoasFKKH.Domain.ModulUtama;
using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.StaseModels;

public class Create
{
    [Required]
    public string Nama { get; set; } = string.Empty;

    [Required]
    public int Waktu { get; set; }

    [Required]
    public JenisStase Jenis { get; set; }
}
