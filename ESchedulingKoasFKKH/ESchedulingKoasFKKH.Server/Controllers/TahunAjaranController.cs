using System.ComponentModel.DataAnnotations;
using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/tahun-ajaran")]
[Authorize]
public class TahunAjaranController : ControllerBase
{
    private readonly ITahunAjaranRepository _tahunAjaranRepository;
    private readonly IMahasiswaRepository _mahasiswaRepository;
    private readonly IUnitOfWork _unitOfWork;

    public TahunAjaranController(
        ITahunAjaranRepository tahunAjaranRepository,
        IMahasiswaRepository mahasiswaRepository,
        IUnitOfWork unitOfWork)
    {
        _tahunAjaranRepository = tahunAjaranRepository;
        _mahasiswaRepository = mahasiswaRepository;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var tahunAjaran = await _tahunAjaranRepository.Get(id);
        if (tahunAjaran is null) return NotFound();

        return Ok(ToResponse(tahunAjaran));
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var daftarTahunAjaran = await _tahunAjaranRepository.GetAll();

        return Ok(daftarTahunAjaran
            .OrderByDescending(x => x.Tahun)
            .ThenByDescending(x => x.Semester)
            .Select(ToResponse));
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Create(CreateTahunAjaran create)
    {
        if (create.Tahun <= 0)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["tahun"] = "Tahun ajaran harus lebih besar dari 0" });

        if (!TryParseSemester(create.Semester, out var semester))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["semester"] = GetInvalidSemesterMessage(create.Semester) });

        var daftarTahunAjaran = await _tahunAjaranRepository.GetAll();
        if (daftarTahunAjaran.Any(x => x.Tahun == create.Tahun && x.Semester == semester))
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["tahun"] = $"Tahun ajaran {create.Tahun} semester {semester} sudah ada"
            });

        var tahunAjaran = new TahunAjaran
        {
            Tahun = create.Tahun,
            Semester = semester
        };

        _tahunAjaranRepository.Add(tahunAjaran);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return CreatedAtAction(
            nameof(Get),
            new { id = tahunAjaran.Id },
            ToResponse(tahunAjaran));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Update(int id, UpdateTahunAjaran update)
    {
        if (update.Id != id)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["id"] = "Id pada body tidak sesuai dengan id pada url" });

        if (update.Tahun <= 0)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["tahun"] = "Tahun ajaran harus lebih besar dari 0" });

        if (!TryParseSemester(update.Semester, out var semester))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["semester"] = GetInvalidSemesterMessage(update.Semester) });

        var tahunAjaran = await _tahunAjaranRepository.Get(id);
        if (tahunAjaran is null) return NotFound();

        var daftarTahunAjaran = await _tahunAjaranRepository.GetAll();
        if (daftarTahunAjaran.Any(x => x.Id != id && x.Tahun == update.Tahun && x.Semester == semester))
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["tahun"] = $"Tahun ajaran {update.Tahun} semester {semester} sudah ada"
            });

        tahunAjaran.Tahun = update.Tahun;
        tahunAjaran.Semester = semester;

        _tahunAjaranRepository.Update(tahunAjaran);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id, bool konfirmasiHapus = false)
    {
        var tahunAjaran = await _tahunAjaranRepository.Get(id);
        if (tahunAjaran is null) return NotFound();

        var jumlahMahasiswa = (await _mahasiswaRepository.GetAll())
            .Count(x => x.TahunAjaran?.Id == id);

        if (jumlahMahasiswa > 0 && !konfirmasiHapus)
            return HelpersFunctions.Conflict(
                new Dictionary<string, string>
                {
                    ["tahunAjaran"] = $"Tahun ajaran {tahunAjaran.Tahun} semester {tahunAjaran.Semester} sudah dipakai oleh {jumlahMahasiswa} mahasiswa."
                },
                "Jika tetap dihapus, tahun ajaran pada semua mahasiswa terkait akan dikosongkan atau null.");

        _tahunAjaranRepository.Delete(tahunAjaran);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    private static object ToResponse(TahunAjaran tahunAjaran)
    {
        return new
        {
            tahunAjaran.Id,
            tahunAjaran.Tahun,
            semester = tahunAjaran.Semester.ToString()
        };
    }

    private static bool TryParseSemester(string semester, out Semester parsedSemester)
    {
        return Enum.TryParse(semester, true, out parsedSemester) && Enum.IsDefined(parsedSemester);
    }

    private static string GetInvalidSemesterMessage(string semester)
    {
        return $"Semester '{semester}' tidak valid. Nilai valid : {string.Join(", ", Enum.GetNames<Semester>())}";
    }
}

public class CreateTahunAjaran
{
    [Required]
    public int Tahun { get; set; }

    [Required]
    public string Semester { get; set; } = string.Empty;
}

public class UpdateTahunAjaran
{
    [Required]
    public int Id { get; set; }

    [Required]
    public int Tahun { get; set; }

    [Required]
    public string Semester { get; set; } = string.Empty;
}
