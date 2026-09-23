using System.ComponentModel.DataAnnotations;

namespace ESchedulingKoasFKKH.Server.Models.UserModels;

public class ManagedUserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsCurrentLoggedInUser { get; set; }
}

public class CreateManagedUserDto
{
    [Required(ErrorMessage = "Username wajib diisi")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username minimal 3 karakter")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password wajib diisi")]
    [MinLength(6, ErrorMessage = "Password minimal 6 karakter")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role wajib dipilih")]
    public string Role { get; set; } = string.Empty;
}

public class UpdateManagedUserDto
{
    [Required(ErrorMessage = "Username wajib diisi")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username minimal 3 karakter")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role wajib dipilih")]
    public string Role { get; set; } = string.Empty;

    public string? Password { get; set; }
}

public class ResetUserPasswordDto
{
    public string? Password { get; set; }
}
