using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.KelompokModels;

public class Update
{
    [Required]
    public int Id { get; set; }

    [Required]
    public string Nama { get; set; } = string.Empty;
}
