using System.ComponentModel.DataAnnotations;
using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
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
    private readonly IJadwalRepository _jadwalRepository;
    private readonly IHariLiburService _hariLiburService;
    private readonly IUnitOfWork _unitOfWork;

    public TahunAjaranController(
        ITahunAjaranRepository tahunAjaranRepository,
        IMahasiswaRepository mahasiswaRepository,
        IJadwalRepository jadwalRepository,
        IHariLiburService hariLiburService,
        IUnitOfWork unitOfWork)
    {
        _tahunAjaranRepository = tahunAjaranRepository;
        _mahasiswaRepository = mahasiswaRepository;
        _jadwalRepository = jadwalRepository;
        _hariLiburService = hariLiburService;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var tahunAjaran = await _tahunAjaranRepository.Get(id);
        if (tahunAjaran is null) return NotFound();

        var semuaJadwal = await _jadwalRepository.GetAll();
        var jadwalTa = semuaJadwal.Where(j => j.Kelompok?.IdTahunAjaran == id || j.Kelompok?.TahunAjaran?.Id == id).ToList();
        var calculatedStatus = TahunAjaranStatusCalculator.HitungStatus(jadwalTa, _hariLiburService);

        if (tahunAjaran.Status != calculatedStatus)
        {
            tahunAjaran.Status = calculatedStatus;
            _tahunAjaranRepository.Update(tahunAjaran);
            await _unitOfWork.SaveChangesAsync();
        }

        return Ok(ToResponse(tahunAjaran));
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null)
    {
        var daftarTahunAjaran = await _tahunAjaranRepository.GetAll();
        var semuaJadwal = await _jadwalRepository.GetAll();

        var anyChanged = false;
        foreach (var ta in daftarTahunAjaran)
        {
            var jadwalTa = semuaJadwal.Where(j => j.Kelompok?.IdTahunAjaran == ta.Id || j.Kelompok?.TahunAjaran?.Id == ta.Id).ToList();
            var calculatedStatus = TahunAjaranStatusCalculator.HitungStatus(jadwalTa, _hariLiburService);

            if (ta.Status != calculatedStatus)
            {
                ta.Status = calculatedStatus;
                _tahunAjaranRepository.Update(ta);
                anyChanged = true;
            }
        }

        if (anyChanged)
        {
            await _unitOfWork.SaveChangesAsync();
        }

        if (!string.IsNullOrWhiteSpace(status) && TryParseStatus(status, out var filterStatus))
        {
            daftarTahunAjaran = daftarTahunAjaran.Where(x => x.Status == filterStatus).ToList();
        }

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

        var statusTahunAjaran = StatusTahunAjaran.AkanDatang;
        if (!string.IsNullOrWhiteSpace(create.Status))
        {
            if (!TryParseStatus(create.Status, out statusTahunAjaran))
                return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["status"] = "Status tahun ajaran tidak valid. Nilai valid: Selesai, Berjalan, Akan Datang" });
        }

        var daftarTahunAjaran = await _tahunAjaranRepository.GetAll();
        if (daftarTahunAjaran.Any(x => x.Tahun == create.Tahun && x.Semester == semester))
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["tahun"] = $"Tahun ajaran {create.Tahun} semester {semester} sudah ada"
            });

        var tahunAjaran = new TahunAjaran
        {
            Tahun = create.Tahun,
            Semester = semester,
            Status = statusTahunAjaran
        };

        _tahunAjaranRepository.Add(tahunAjaran);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return Created(
            $"/api/tahunajaran/{tahunAjaran.Id}",
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

        StatusTahunAjaran? statusTahunAjaran = null;
        if (!string.IsNullOrWhiteSpace(update.Status))
        {
            if (!TryParseStatus(update.Status, out var parsedStatus))
                return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["status"] = "Status tahun ajaran tidak valid. Nilai valid: Selesai, Berjalan, Akan Datang" });
            statusTahunAjaran = parsedStatus;
        }

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
        if (statusTahunAjaran.HasValue)
        {
            tahunAjaran.Status = statusTahunAjaran.Value;
        }
        else
        {
            var semuaJadwal = await _jadwalRepository.GetAll();
            var jadwalTa = semuaJadwal.Where(j => j.Kelompok?.IdTahunAjaran == id || j.Kelompok?.TahunAjaran?.Id == id).ToList();
            tahunAjaran.Status = TahunAjaranStatusCalculator.HitungStatus(jadwalTa, _hariLiburService);
        }

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
            semester = tahunAjaran.Semester.ToString(),
            status = FormatStatus(tahunAjaran.Status)
        };
    }

    private static string FormatStatus(StatusTahunAjaran status) => status switch
    {
        StatusTahunAjaran.Selesai => "Selesai",
        StatusTahunAjaran.Berjalan => "Berjalan",
        StatusTahunAjaran.AkanDatang => "Akan Datang",
        _ => status.ToString()
    };

    private static bool TryParseStatus(string? statusStr, out StatusTahunAjaran status)
    {
        if (string.IsNullOrWhiteSpace(statusStr))
        {
            status = StatusTahunAjaran.AkanDatang;
            return false;
        }

        var clean = statusStr.Replace(" ", "").Replace("_", "").Replace("-", "");
        return Enum.TryParse(clean, true, out status) && Enum.IsDefined(status);
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

    public string? Status { get; set; }
}

public class UpdateTahunAjaran
{
    [Required]
    public int Id { get; set; }

    [Required]
    public int Tahun { get; set; }

    [Required]
    public string Semester { get; set; } = string.Empty;

    public string? Status { get; set; }
}
