using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Shared;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Server.Configurations;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.UserModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ESchedulingKoasFKKH.Server.Controllers;

[Route("api/user")]
[ApiController]
public class UserController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly JwtOptions _jwtOptions;
    private readonly IUnitOfWork _unitOfWork;

    public UserController(
        IUserRepository userRepository,
        IPasswordHasher<User> passwordHasher,
        IOptions<JwtOptions> jwtOptions,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtOptions = jwtOptions.Value;
        _unitOfWork = unitOfWork;
    }

    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var user = await _userRepository.Get(id);
        if (user is null) return NotFound();

        if (User.IsInRole(UserRoles.Admin))
            return Ok(new
            {
                user.Id,
                user.Name,
                user.Role
            });

        if (User?.Identity?.Name == user.Name)
            return user.Role switch
            {
                UserRoles.Pengelola => Ok(new { user.Id, user.Name }),
                UserRoles.Dosen => Ok(new { user.Id, user.Name, PembimbingId = user.Pembimbing?.Id }),
                UserRoles.Mahasiswa => Ok(new { user.Id, user.Name, MahasiswaId = user.Mahasiswa?.Id }),
                _ => Forbid()
            };

        return Forbid();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(Login login)
    {
        var user = await _userRepository.GetByName(login.UserName);
        if (user is null)
            return HelpersFunctions.NotFound(
                new Dictionary<string, string> { ["userName"] = $"User dengan username '{login.UserName}' tidak ditemukan" });

        if (_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, login.Password) == PasswordVerificationResult.Failed)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["password"] = $"Password salah" });

        var claims = new Claim[]
        {
            new(JwtRegisteredClaimNames.Sub, user.Name),
            new(JwtRegisteredClaimNames.Name, user.Name),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Role, user.Role),
        };

        var signingCredentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SecretKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            _jwtOptions.Issuer,
            "",
            claims,
            null,
            CultureInfos.DateTimeNow.AddHours(3),
            signingCredentials);

        var tokenStr = new JwtSecurityTokenHandler().WriteToken(token);

        string? fullName = user.Role switch
        {
            UserRoles.Mahasiswa => user.Mahasiswa?.Nama,
            UserRoles.Dosen => user.Pembimbing?.Nama,
            _ => user.Name
        };

        int? profileId = user.Role switch
        {
            UserRoles.Mahasiswa => user.Mahasiswa?.Id,
            UserRoles.Dosen => user.Pembimbing?.Id,
            _ => null
        };

        return Ok(new { user.Id, user.Role, token = tokenStr, fullName, profileId });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfile model)
    {
        var currentUsername = User?.Identity?.Name;
        if (currentUsername is null) return Unauthorized();

        var user = await _userRepository.GetByName(currentUsername);
        if (user is null) return NotFound();

        if (user.Name != model.NewUsername)
        {
            if (await _userRepository.IsExist(model.NewUsername, user.Id))
            {
                return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["newUsername"] = "Username sudah digunakan oleh user lain" });
            }
            user.Name = model.NewUsername;
        }

        if (!string.IsNullOrWhiteSpace(model.NewPassword))
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, model.NewPassword);
        }

        _userRepository.Update(user);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [Authorize(Roles = UserRoles.Admin)]
    [HttpGet("manage")]
    public async Task<IActionResult> GetAllManagedUsers()
    {
        var currentUsername = User?.Identity?.Name;
        var users = await _userRepository.GetAll();

        var list = users
            .Where(u => u.Role == UserRoles.Admin || u.Role == UserRoles.Pengelola)
            .OrderByDescending(u => u.Role == UserRoles.Admin)
            .ThenBy(u => u.Name)
            .Select(u => new ManagedUserDto
            {
                Id = u.Id,
                Username = u.Name,
                Role = u.Role,
                IsCurrentLoggedInUser = string.Equals(u.Name, currentUsername, StringComparison.OrdinalIgnoreCase)
            })
            .ToList();

        return Ok(list);
    }

    [Authorize(Roles = UserRoles.Admin)]
    [HttpPost("manage")]
    public async Task<IActionResult> CreateManagedUser(CreateManagedUserDto dto)
    {
        var targetRole = dto.Role.Trim().ToLowerInvariant();
        if (targetRole != UserRoles.Admin && targetRole != UserRoles.Pengelola)
        {
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["role"] = "Role hanya boleh 'admin' atau 'pengelola'" });
        }

        var username = dto.Username.Trim();
        if (await _userRepository.IsExist(username))
        {
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["username"] = $"Username '{username}' sudah digunakan" });
        }

        var newUser = new User
        {
            Name = username,
            Role = targetRole,
            PasswordHash = ""
        };
        newUser.PasswordHash = _passwordHasher.HashPassword(newUser, dto.Password);

        _userRepository.Add(newUser);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        var currentUsername = User?.Identity?.Name;
        return Ok(new ManagedUserDto
        {
            Id = newUser.Id,
            Username = newUser.Name,
            Role = newUser.Role,
            IsCurrentLoggedInUser = string.Equals(newUser.Name, currentUsername, StringComparison.OrdinalIgnoreCase)
        });
    }

    [Authorize(Roles = UserRoles.Admin)]
    [HttpPut("manage/{id:int}")]
    public async Task<IActionResult> UpdateManagedUser(int id, UpdateManagedUserDto dto)
    {
        var user = await _userRepository.Get(id);
        if (user is null) return NotFound();

        if (user.Role != UserRoles.Admin && user.Role != UserRoles.Pengelola)
        {
            return Forbid();
        }

        var targetRole = dto.Role.Trim().ToLowerInvariant();
        if (targetRole != UserRoles.Admin && targetRole != UserRoles.Pengelola)
        {
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["role"] = "Role hanya boleh 'admin' atau 'pengelola'" });
        }

        // Last admin protection: cannot demote last admin
        if (user.Role == UserRoles.Admin && targetRole != UserRoles.Admin)
        {
            var allUsers = await _userRepository.GetAll();
            var adminCount = allUsers.Count(u => u.Role == UserRoles.Admin);
            if (adminCount <= 1)
            {
                return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["role"] = "Tidak dapat mengubah role Admin terakhir. Sistem membutuhkan minimal satu Administrator." });
            }
        }

        var newUsername = dto.Username.Trim();
        if (!string.Equals(user.Name, newUsername, StringComparison.OrdinalIgnoreCase))
        {
            if (await _userRepository.IsExist(newUsername, user.Id))
            {
                return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["username"] = $"Username '{newUsername}' sudah digunakan oleh user lain" });
            }
            user.Name = newUsername;
        }

        user.Role = targetRole;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            if (dto.Password.Length < 6)
            {
                return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["password"] = "Password baru minimal 6 karakter" });
            }
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
        }

        _userRepository.Update(user);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        var currentUsername = User?.Identity?.Name;
        return Ok(new ManagedUserDto
        {
            Id = user.Id,
            Username = user.Name,
            Role = user.Role,
            IsCurrentLoggedInUser = string.Equals(user.Name, currentUsername, StringComparison.OrdinalIgnoreCase)
        });
    }

    [Authorize(Roles = UserRoles.Admin)]
    [HttpDelete("manage/{id:int}")]
    public async Task<IActionResult> DeleteManagedUser(int id)
    {
        var user = await _userRepository.Get(id);
        if (user is null) return NotFound();

        if (user.Role != UserRoles.Admin && user.Role != UserRoles.Pengelola)
        {
            return Forbid();
        }

        var currentUsername = User?.Identity?.Name;
        // Self-delete protection
        if (string.Equals(user.Name, currentUsername, StringComparison.OrdinalIgnoreCase))
        {
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["error"] = "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan." });
        }

        // Last admin protection
        if (user.Role == UserRoles.Admin)
        {
            var allUsers = await _userRepository.GetAll();
            var adminCount = allUsers.Count(u => u.Role == UserRoles.Admin);
            if (adminCount <= 1)
            {
                return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["error"] = "Tidak dapat menghapus Admin terakhir. Sistem membutuhkan minimal satu Administrator." });
            }
        }

        _userRepository.Delete(user);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }
}
