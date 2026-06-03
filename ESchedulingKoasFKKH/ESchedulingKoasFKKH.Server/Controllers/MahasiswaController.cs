using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.MahasiswaModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/mahasiswa")]
[Authorize]
public class MahasiswaController : ControllerBase
{
    private readonly IMahasiswaRepository _mahasiswaRepository;
    private readonly ITahunAjaranRepository _tahunAjaranRepository;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;

    public MahasiswaController(
        IMahasiswaRepository mahasiswaRepository,
        ITahunAjaranRepository tahunAjaranRepository,
        IUnitOfWork unitOfWork,
        IUserRepository userRepository,
        IPasswordHasher<User> passwordHasher)
    {
        _mahasiswaRepository = mahasiswaRepository;
        _tahunAjaranRepository = tahunAjaranRepository;
        _unitOfWork = unitOfWork;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var mahasiswa = await _mahasiswaRepository.Get(id);
        if (mahasiswa is null) return NotFound();

        if (User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Pengelola) || User.IsInRole(UserRoles.Dosen)) 
            return Ok(ToResponse(mahasiswa));

        if (mahasiswa.NIM != User?.Identity?.Name) return Forbid();

        return Ok(ToResponse(mahasiswa));
    }

    [HttpGet]
    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Pengelola},{UserRoles.Dosen},{UserRoles.Mahasiswa}")]
    public async Task<IActionResult> GetAll()
    {
        return Ok((await _mahasiswaRepository.GetAll()).Select(ToResponse));
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Create(CreateMahasiswa create)
    {
        if (await _mahasiswaRepository.IsExist(create.NIM))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nim"] = $"NIM '{create.NIM}' sudah digunakan" });

        if (await _userRepository.IsExist(create.NIM))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nim"] = $"Akun dengan user name '{create.NIM}' sudah digunakan" });

        var tahunAjaran = await _tahunAjaranRepository.Get(create.IdTahunAjaran);
        if (tahunAjaran is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string>
            {
                ["idTahunAjaran"] = $"Tahun ajaran dengan id '{create.IdTahunAjaran}' tidak ditemukan"
            });

        var user = new User
        {
            Name = create.NIM,
            PasswordHash = _passwordHasher.HashPassword(null, create.NIM),
            Role = UserRoles.Mahasiswa
        };

        var mahasiswa = new Mahasiswa
        {
            NIM = create.NIM,
            Nama = create.Nama,
            User = user,
            TahunAjaran = tahunAjaran
        };

        user.Mahasiswa = mahasiswa;

        _mahasiswaRepository.Add(mahasiswa);
        _userRepository.Add(user);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return CreatedAtAction(
            nameof(Get), 
            new { id = mahasiswa.Id }, 
            ToResponse(mahasiswa));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Update(int id, UpdateMahasiswa update)
    {
        if (update.Id != id) return BadRequest();

        var mahasiswa = await _mahasiswaRepository.Get(id);
        if (mahasiswa is null) return NotFound();

        if (await _mahasiswaRepository.IsExist(update.NIM, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nim"] = $"NIM '{update.NIM}' sudah digunakan" });

        if (await _userRepository.IsExist(update.NIM, mahasiswa.User.Id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nim"] = $"Akun dengan user name '{update.NIM}' sudah digunakan" });

        var tahunAjaran = await _tahunAjaranRepository.Get(update.IdTahunAjaran);
        if (tahunAjaran is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string>
            {
                ["idTahunAjaran"] = $"Tahun ajaran dengan id '{update.IdTahunAjaran}' tidak ditemukan"
            });

        mahasiswa.Nama = update.Nama;
        mahasiswa.NIM = update.NIM;
        mahasiswa.TahunAjaran = tahunAjaran;
        mahasiswa.User.Name = update.NIM;
        mahasiswa.User.PasswordHash = _passwordHasher.HashPassword(mahasiswa.User, update.NIM);

        _mahasiswaRepository.Update(mahasiswa);
        _userRepository.Update(mahasiswa.User);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var mahasiswa = await _mahasiswaRepository.Get(id);
        if (mahasiswa is null) return NotFound();

        _mahasiswaRepository.Delete(mahasiswa);
        _userRepository.Delete(mahasiswa.User);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    private static object ToResponse(Mahasiswa mahasiswa)
    {
        return new
        {
            mahasiswa.Id,
            mahasiswa.NIM,
            mahasiswa.Nama,
            idKelompok = mahasiswa.Kelompok?.Id,
            namaKelompok = mahasiswa.Kelompok?.Nama,
            kelompok = mahasiswa.Kelompok is null ? null : new
            {
                mahasiswa.Kelompok.Id,
                mahasiswa.Kelompok.Nama,
                idPembimbing = mahasiswa.Kelompok.Pembimbing?.Id,
                namaPembimbing = mahasiswa.Kelompok.Pembimbing?.Nama
            },
            idTahunAjaran = mahasiswa.TahunAjaran?.Id,
            tahunAjaran = mahasiswa.TahunAjaran is null ? null : new
            {
                mahasiswa.TahunAjaran.Id,
                mahasiswa.TahunAjaran.Tahun,
                semester = mahasiswa.TahunAjaran.Semester.ToString()
            },
            user = new
            {
                mahasiswa.User.Id,
                mahasiswa.User.Name,
                mahasiswa.User.Role
            }
        };
    }
}
