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
}
