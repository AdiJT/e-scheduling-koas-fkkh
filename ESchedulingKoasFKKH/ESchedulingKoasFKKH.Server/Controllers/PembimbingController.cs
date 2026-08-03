using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.PembimbingModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/pembimbing")]
[Authorize]
public class PembimbingController : ControllerBase
{
    private readonly IPembimbingRepository _pembimbingRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IStaseRepository _staseRepository;

    public PembimbingController(
        IPembimbingRepository pembimbingRepository,
        IUnitOfWork unitOfWork,
        IUserRepository userRepository,
        IPasswordHasher<User> passwordHasher,
        IStaseRepository staseRepository)
    {
        _pembimbingRepository = pembimbingRepository;
        _unitOfWork = unitOfWork;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _staseRepository = staseRepository;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var pembimbing = await _pembimbingRepository.Get(id);
        if (pembimbing is null) return NotFound();

        var semuaStase = await _staseRepository.GetAll();

        return Ok(new 
        { 
            pembimbing.Id, 
            pembimbing.NIP, 
            pembimbing.Nama, 
            daftarStase = pembimbing.DaftarStase.Select(s => s.Nama).ToList(),
            koordinatorStase = semuaStase.Where(s => s.Koordinator?.Id == pembimbing.Id).Select(s => s.Nama).ToList()
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var daftarPembimbing = await _pembimbingRepository.GetAll();
        var semuaStase = await _staseRepository.GetAll();

        return Ok(daftarPembimbing.Select(x => new
        {
            x.Id,
            x.NIP,
            x.Nama,
            daftarStase = x.DaftarStase.Select(s => s.Nama).ToList(),
            koordinatorStase = semuaStase.Where(s => s.Koordinator?.Id == x.Id).Select(s => s.Nama).ToList()
        }));
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Create(CreatePembimbing create)
    {
        if (await _pembimbingRepository.IsExist(create.NIP))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nip"] = $"NIP '{create.NIP}' sudah digunakan"});

        if (await _userRepository.IsExist(create.NIP))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nip"] = $"Akun dengan user name '{create.NIP}' sudah digunakan" });

        var pembimbing = new Pembimbing
        {
            NIP = create.NIP,
            Nama = create.Nama,
        };

        var user = new User
        {
            Name = create.NIP,
            PasswordHash = _passwordHasher.HashPassword(null, create.NIP),
            Role = UserRoles.Dosen,
            Pembimbing = pembimbing,
        };

        pembimbing.User = user;

        _pembimbingRepository.Add(pembimbing);
        _userRepository.Add(user);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return Created(
            $"/api/pembimbing/{pembimbing.Id}",
            new
            {
                pembimbing.Id,
                pembimbing.NIP,
                pembimbing.Nama,
                daftarStase = new List<string>(),
                koordinatorStase = new List<string>()
            });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Update(int id, UpdatePembimbing update)
    {
        if (id != update.Id) return BadRequest();

        var pembimbing = await _pembimbingRepository.Get(id);
        if (pembimbing is null) return NotFound();

        if (await _pembimbingRepository.IsExist(update.NIP, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nip"] = $"NIP '{update.NIP}' sudah digunakan" });


        if (await _userRepository.IsExist(update.NIP, pembimbing.User.Id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nip"] = $"Akun dengan user name '{update.NIP}' sudah digunakan" });

        pembimbing.NIP = update.NIP;
        pembimbing.Nama = update.Nama;
        pembimbing.User.Name = update.NIP;
        pembimbing.User.PasswordHash = _passwordHasher.HashPassword(pembimbing.User, update.NIP);

        _pembimbingRepository.Update(pembimbing);
        _userRepository.Update(pembimbing.User);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var pembimbing = await _pembimbingRepository.Get(id);
        if (pembimbing is null) return NotFound();

        _pembimbingRepository.Delete(pembimbing);
        _userRepository.Delete(pembimbing.User);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }
}
