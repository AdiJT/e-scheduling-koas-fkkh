using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Controllers.Dtos;
using ESchedulingKoasFKKH.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[Route("api/broadcast")]
[ApiController]
[Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Pengelola}")]
public class BroadcastController : ControllerBase
{
    private readonly IBroadcastRepository _broadcastRepository;
    private readonly INotifikasiService _notifikasiService;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public BroadcastController(
        IBroadcastRepository broadcastRepository,
        INotifikasiService notifikasiService,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork)
    {
        _broadcastRepository = broadcastRepository;
        _notifikasiService = notifikasiService;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    private async Task<User?> GetCurrentUserAsync()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return null;
        return await _userRepository.GetByName(username);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int limit = 50)
    {
        var list = await _broadcastRepository.GetAll(limit);
        var dtos = list.Select(b => new BroadcastItemDto
        {
            Id = b.Id,
            Judul = b.Judul,
            Pesan = b.Pesan,
            Tipe = b.Tipe,
            Prioritas = b.Prioritas,
            TargetRole = b.TargetRole,
            TargetKelompokId = b.TargetKelompokId,
            TargetKelompokNama = b.TargetKelompokNama,
            Tautan = b.Tautan,
            CreatedByUserId = b.CreatedByUserId,
            CreatedByName = b.CreatedByName,
            JumlahPenerima = b.JumlahPenerima,
            CreatedAt = b.CreatedAt
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var b = await _broadcastRepository.Get(id);
        if (b == null) return NotFound();

        return Ok(new BroadcastItemDto
        {
            Id = b.Id,
            Judul = b.Judul,
            Pesan = b.Pesan,
            Tipe = b.Tipe,
            Prioritas = b.Prioritas,
            TargetRole = b.TargetRole,
            TargetKelompokId = b.TargetKelompokId,
            TargetKelompokNama = b.TargetKelompokNama,
            Tautan = b.Tautan,
            CreatedByUserId = b.CreatedByUserId,
            CreatedByName = b.CreatedByName,
            JumlahPenerima = b.JumlahPenerima,
            CreatedAt = b.CreatedAt
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBroadcastDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Judul))
            return BadRequest(new { message = "Judul broadcast tidak boleh kosong" });

        if (string.IsNullOrWhiteSpace(dto.Pesan))
            return BadRequest(new { message = "Isi pesan broadcast tidak boleh kosong" });

        var user = await GetCurrentUserAsync();
        if (user == null) return Unauthorized();

        string senderName = user.Role.Equals(UserRoles.Admin, StringComparison.OrdinalIgnoreCase) 
            ? "Administrator" 
            : (user.Role.Equals(UserRoles.Pengelola, StringComparison.OrdinalIgnoreCase) ? "Pengelola Akademik" : user.Name);

        var result = await _notifikasiService.SendBroadcastAsync(dto, user.Id, senderName);
        return Created($"/api/broadcast/{result.Id}", result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var b = await _broadcastRepository.Get(id);
        if (b == null) return NotFound();

        _broadcastRepository.Delete(b);
        await _unitOfWork.SaveChangesAsync();
        return NoContent();
    }
}
