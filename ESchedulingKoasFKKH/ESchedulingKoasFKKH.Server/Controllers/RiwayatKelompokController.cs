using System.Text.Json;
using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/riwayat-kelompok")]
[Authorize]
public class RiwayatKelompokController : ControllerBase
{
    private readonly IRiwayatKelompokRepository _riwayatRepository;
    private readonly IMahasiswaRepository _mahasiswaRepository;
    private readonly IAutoArchiveService _autoArchiveService;
    private readonly IUnitOfWork _unitOfWork;

    private static readonly JsonSerializerOptions CaseInsensitiveJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public RiwayatKelompokController(
        IRiwayatKelompokRepository riwayatRepository,
        IMahasiswaRepository mahasiswaRepository,
        IAutoArchiveService autoArchiveService,
        IUnitOfWork unitOfWork)
    {
        _riwayatRepository = riwayatRepository;
        _mahasiswaRepository = mahasiswaRepository;
        _autoArchiveService = autoArchiveService;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await _autoArchiveService.AutoArchiveCompletedSchedulesAsync();
        var list = await _riwayatRepository.GetAll();

        string? mahasiswaNim = null;
        if (User.IsInRole(UserRoles.Mahasiswa))
        {
            var mahasiswa = await _mahasiswaRepository.Get(User?.Identity?.Name!);
            if (mahasiswa is null) return Forbid();
            mahasiswaNim = mahasiswa.NIM;
        }

        var result = list.Select(r =>
        {
            var daftarMahasiswa = JsonSerializer.Deserialize<List<MahasiswaDto>>(r.DaftarMahasiswaJson, CaseInsensitiveJsonOptions) ?? [];
            var daftarSubStase = JsonSerializer.Deserialize<List<SubStaseDto>>(r.DaftarSubStaseJson, CaseInsensitiveJsonOptions) ?? [];
            return new
            {
                r.Id,
                r.IdJadwalAsal,
                r.NamaKelompok,
                r.TahunAjaran,
                r.NamaStase,
                r.TanggalMulai,
                r.TanggalSelesai,
                r.NamaPembimbing,
                r.NipPembimbing,
                daftarMahasiswa,
                daftarSubStase,
                r.TanggalDiarsipkan
            };
        });

        if (mahasiswaNim is not null)
        {
            result = result.Where(r => r.daftarMahasiswa.Any(m =>
                string.Equals(m.NIM, mahasiswaNim, StringComparison.OrdinalIgnoreCase)));
        }

        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var riwayat = await _riwayatRepository.Get(id);
        if (riwayat is null) return NotFound();

        _riwayatRepository.Delete(riwayat);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }
}

public class MahasiswaDto
{
    public string NIM { get; set; } = "";
    public string Nama { get; set; } = "";
}

public class SubStaseDto
{
    public string NamaSubStase { get; set; } = "";
    public string? NamaPembimbing { get; set; }
    public string? NipPembimbing { get; set; }
}
