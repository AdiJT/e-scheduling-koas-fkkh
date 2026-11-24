using System.Globalization;
using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/activity-log")]
[Authorize(Roles = UserRoles.Admin)]
public class ActivityLogController : ControllerBase
{
    private readonly IActivityLogRepository _activityLogRepository;

    public ActivityLogController(IActivityLogRepository activityLogRepository)
    {
        _activityLogRepository = activityLogRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] string? modul = null,
        [FromQuery] string? aksi = null,
        [FromQuery] string? role = null,
        [FromQuery] string? tanggalMulai = null,
        [FromQuery] string? tanggalSelesai = null,
        [FromQuery] int limit = 1000)
    {
        DateOnly? parsedStart = null;
        DateOnly? parsedEnd = null;

        if (!string.IsNullOrWhiteSpace(tanggalMulai))
        {
            if (!DateOnly.TryParseExact(tanggalMulai.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var start))
                return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["tanggalMulai"] = "Format tanggal mulai tidak valid (gunakan YYYY-MM-DD)" });
            parsedStart = start;
        }

        if (!string.IsNullOrWhiteSpace(tanggalSelesai))
        {
            if (!DateOnly.TryParseExact(tanggalSelesai.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var end))
                return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["tanggalSelesai"] = "Format tanggal selesai tidak valid (gunakan YYYY-MM-DD)" });
            parsedEnd = end;
        }

        if (parsedStart.HasValue && parsedEnd.HasValue && parsedEnd.Value < parsedStart.Value)
        {
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["tanggalSelesai"] = "Tanggal selesai harus sama atau setelah tanggal mulai" });
        }

        var clampedLimit = Math.Clamp(limit, 1, 5000);
        var filter = new ActivityLogFilter
        {
            Search = search,
            Modul = modul,
            Aksi = aksi,
            Role = role,
            TanggalMulai = parsedStart,
            TanggalSelesai = parsedEnd
        };

        var items = await _activityLogRepository.GetFiltered(filter, clampedLimit);
        var totalKeseluruhan = await _activityLogRepository.GetTotalCount();

        return Ok(new
        {
            totalKeseluruhan,
            totalDitampilkan = items.Count,
            items = items.Select(x => new
            {
                x.Id,
                x.UserId,
                x.Username,
                x.NamaPelaku,
                x.Role,
                x.Modul,
                x.Aksi,
                x.Deskripsi,
                x.TargetEntitas,
                x.Endpoint,
                x.IpAddress,
                x.CreatedAt
            })
        });
    }
}
