using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.UserModels;

public class GoogleLoginRequest
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}
