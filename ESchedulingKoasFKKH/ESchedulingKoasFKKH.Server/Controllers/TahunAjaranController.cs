using System.Globalization;
using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Services;
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
    private readonly IMahasiswaAccessService _mahasiswaAccessService;

    public TahunAjaranController(
        ITahunAjaranRepository tahunAjaranRepository,
        IMahasiswaRepository mahasiswaRepository,
        IUnitOfWork unitOfWork,
        IMahasiswaAccessService mahasiswaAccessService)
    {
        _tahunAjaranRepository = tahunAjaranRepository;
        _mahasiswaRepository = mahasiswaRepository;
        _unitOfWork = unitOfWork;
        _mahasiswaAccessService = mahasiswaAccessService;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var tahunAjaran = await _tahunAjaranRepository.Get(id);
        if (tahunAjaran is null) return NotFound();

        var today = DateOnly.FromDateTime(DateTime.Today);
        var calculatedStatus = tahunAjaran.HitungStatusPeriode(today);
        if (tahunAjaran.Status != calculatedStatus)
        {
            tahunAjaran.Status = calculatedStatus;
            _tahunAjaranRepository.Update(tahunAjaran);
            await _unitOfWork.SaveChangesAsync();
        }

        return Ok(ToResponse(tahunAjaran, today));
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null)
    {
        var daftarTahunAjaran = await _tahunAjaranRepository.GetAll();
        var today = DateOnly.FromDateTime(DateTime.Today);

        var anyChanged = false;
        foreach (var ta in daftarTahunAjaran)
        {
            var calculatedStatus = ta.HitungStatusPeriode(today);
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

        if (!string.IsNullOrWhiteSpace(status) && TryParseStatusFilter(status, out var filterStatus))
        {
            daftarTahunAjaran = daftarTahunAjaran.Where(x => x.HitungStatusPeriode(today) == filterStatus).ToList();
        }

        if (User.IsInRole(UserRoles.Mahasiswa))
        {
            var access = await _mahasiswaAccessService.EvaluateByUsernameAsync(User?.Identity?.Name);
            if (access is null || !access.CanViewJadwalDanKelompok)
                return Ok(Array.Empty<object>());

            daftarTahunAjaran = daftarTahunAjaran.Where(x => x.IsAktif(today)).ToList();
        }

        return Ok(daftarTahunAjaran
            .OrderByDescending(x => x.Tahun)
            .ThenByDescending(x => x.Semester)
            .ThenByDescending(x => x.TanggalMulai)
            .Select(x => ToResponse(x, today)));
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Create(CreateTahunAjaran create)
    {
        var errors = new Dictionary<string, string>();

        if (create.Tahun <= 0)
            errors["tahun"] = "Tahun ajaran harus lebih besar dari 0";

        if (!TryParseSemester(create.Semester, out var semester))
            errors["semester"] = GetInvalidSemesterMessage(create.Semester);

        ValidateRentangPeriode(create.TanggalMulai, create.TanggalSelesai, out var tanggalMulai, out var tanggalSelesai, errors);

        if (errors.Count > 0)
            return HelpersFunctions.BadRequest(errors);

        var daftarTahunAjaran = await _tahunAjaranRepository.GetAll();
        if (daftarTahunAjaran.Any(x => x.Tahun == create.Tahun && x.Semester == semester))
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["tahun"] = $"Tahun ajaran {create.Tahun} semester {semester} sudah ada"
            });

        var today = DateOnly.FromDateTime(DateTime.Today);
        var tahunAjaran = new TahunAjaran
        {
            Tahun = create.Tahun,
            Semester = semester,
            TanggalMulai = tanggalMulai,
            TanggalSelesai = tanggalSelesai,
            Status = StatusTahunAjaran.AkanDatang
        };
        tahunAjaran.Status = tahunAjaran.HitungStatusPeriode(today);

        _tahunAjaranRepository.Add(tahunAjaran);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return Created(
            $"/api/tahun-ajaran/{tahunAjaran.Id}",
            ToResponse(tahunAjaran, today));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Pengelola}")]
    public async Task<IActionResult> Update(int id, UpdateTahunAjaran update)
    {
        if (update.Id != id)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["id"] = "Id pada body tidak sesuai dengan id pada url" });

        var tahunAjaran = await _tahunAjaranRepository.Get(id);
        if (tahunAjaran is null) return NotFound();

        var isAdmin = User.IsInRole(UserRoles.Admin);
        var errors = new Dictionary<string, string>();

        if (!isAdmin)
        {
            if (update.Tahun != 0 && update.Tahun != tahunAjaran.Tahun)
                errors["tahun"] = "Pengelola tidak memiliki akses untuk mengubah tahun ajaran";

            if (!string.IsNullOrWhiteSpace(update.Semester) &&
                (!TryParseSemester(update.Semester, out var requestedSemester) || requestedSemester != tahunAjaran.Semester))
                errors["semester"] = "Pengelola tidak memiliki akses untuk mengubah semester";

            ValidateRentangPeriode(update.TanggalMulai, update.TanggalSelesai, out var tanggalMulai, out var tanggalSelesai, errors);

            if (errors.Count > 0)
                return HelpersFunctions.BadRequest(errors);

            tahunAjaran.TanggalMulai = tanggalMulai;
            tahunAjaran.TanggalSelesai = tanggalSelesai;
        }
        else
        {
            if (update.Tahun <= 0)
                errors["tahun"] = "Tahun ajaran harus lebih besar dari 0";

            if (!TryParseSemester(update.Semester, out var semester))
                errors["semester"] = GetInvalidSemesterMessage(update.Semester);

            ValidateRentangPeriode(update.TanggalMulai, update.TanggalSelesai, out var tanggalMulai, out var tanggalSelesai, errors);

            if (errors.Count > 0)
                return HelpersFunctions.BadRequest(errors);

            var daftarTahunAjaran = await _tahunAjaranRepository.GetAll();
            if (daftarTahunAjaran.Any(x => x.Id != id && x.Tahun == update.Tahun && x.Semester == semester))
                return HelpersFunctions.BadRequest(new Dictionary<string, string>
                {
                    ["tahun"] = $"Tahun ajaran {update.Tahun} semester {semester} sudah ada"
                });

            tahunAjaran.Tahun = update.Tahun;
            tahunAjaran.Semester = semester;
            tahunAjaran.TanggalMulai = tanggalMulai;
            tahunAjaran.TanggalSelesai = tanggalSelesai;
        }

        var today = DateOnly.FromDateTime(DateTime.Today);
        tahunAjaran.Status = tahunAjaran.HitungStatusPeriode(today);

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

    private static object ToResponse(TahunAjaran tahunAjaran, DateOnly today)
    {
        return new
        {
            tahunAjaran.Id,
            tahunAjaran.Tahun,
            semester = tahunAjaran.Semester.ToString(),
            tanggalMulai = tahunAjaran.TanggalMulai,
            tanggalSelesai = tahunAjaran.TanggalSelesai,
            isAktif = tahunAjaran.IsAktif(today),
            status = tahunAjaran.GetStatusLabel(today)
        };
    }

    private static void ValidateRentangPeriode(
        string? tanggalMulaiStr,
        string? tanggalSelesaiStr,
        out DateOnly tanggalMulai,
        out DateOnly tanggalSelesai,
        Dictionary<string, string> errors)
    {
        tanggalMulai = default;
        tanggalSelesai = default;

        var validMulai = TryParseDateOnly(tanggalMulaiStr, out tanggalMulai);
        if (!validMulai)
            errors["tanggalMulai"] = "Tanggal mulai periode wajib diisi dengan format tanggal yang valid";

        var validSelesai = TryParseDateOnly(tanggalSelesaiStr, out tanggalSelesai);
        if (!validSelesai)
            errors["tanggalSelesai"] = "Tanggal selesai periode wajib diisi dengan format tanggal yang valid";

        if (!validMulai || !validSelesai)
            return;

        if (tanggalSelesai <= tanggalMulai)
        {
            errors["tanggalSelesai"] = "Tanggal selesai harus setelah tanggal mulai";
            return;
        }

        var minTanggalSelesai = tanggalMulai.AddYears(2);
        if (tanggalSelesai < minTanggalSelesai)
            errors["tanggalSelesai"] = $"Rentang periode minimal 2 tahun (minimal selesai pada {minTanggalSelesai:dd/MM/yyyy})";
    }

    private static bool TryParseDateOnly(string? value, out DateOnly parsedDate)
    {
        parsedDate = default;
        if (string.IsNullOrWhiteSpace(value)) return false;

        return DateOnly.TryParseExact(value.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedDate)
            || DateOnly.TryParse(value.Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedDate);
    }

    private static bool TryParseStatusFilter(string? statusStr, out StatusTahunAjaran status)
    {
        status = StatusTahunAjaran.AkanDatang;
        if (string.IsNullOrWhiteSpace(statusStr)) return false;

        var clean = statusStr.Replace(" ", "").Replace("_", "").Replace("-", "").ToLowerInvariant();
        if (clean is "aktif" or "berjalan")
        {
            status = StatusTahunAjaran.Berjalan;
            return true;
        }
        if (clean is "belummulai" or "akandatang")
        {
            status = StatusTahunAjaran.AkanDatang;
            return true;
        }
        if (clean == "selesai")
        {
            status = StatusTahunAjaran.Selesai;
            return true;
        }

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
    public int Tahun { get; set; }
    public string Semester { get; set; } = string.Empty;
    public string TanggalMulai { get; set; } = string.Empty;
    public string TanggalSelesai { get; set; } = string.Empty;
}

public class UpdateTahunAjaran
{
    public int Id { get; set; }
    public int Tahun { get; set; }
    public string Semester { get; set; } = string.Empty;
    public string TanggalMulai { get; set; } = string.Empty;
    public string TanggalSelesai { get; set; } = string.Empty;
}
