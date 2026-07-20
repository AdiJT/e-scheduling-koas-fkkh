using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/riwayat-kelompok")]
[Authorize]
public class RiwayatKelompokController : ControllerBase
{
    private readonly IRiwayatKelompokRepository _riwayatRepository;
    private readonly IUnitOfWork _unitOfWork;

    public RiwayatKelompokController(
        IRiwayatKelompokRepository riwayatRepository,
        IUnitOfWork unitOfWork)
    {
        _riwayatRepository = riwayatRepository;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _riwayatRepository.GetAll();
        return Ok(list.Select(r => new
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
            daftarMahasiswa = System.Text.Json.JsonSerializer.Deserialize<List<MahasiswaDto>>(r.DaftarMahasiswaJson) ?? [],
            daftarSubStase = System.Text.Json.JsonSerializer.Deserialize<List<SubStaseDto>>(r.DaftarSubStaseJson) ?? [],
            r.TanggalDiarsipkan
        }));
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
