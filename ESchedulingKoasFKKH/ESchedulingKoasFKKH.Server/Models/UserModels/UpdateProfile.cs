using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.UserModels;

public class UpdateProfile
{
    [Required]
    public string NewUsername { get; set; } = string.Empty;

    public string? NewPassword { get; set; }
}
