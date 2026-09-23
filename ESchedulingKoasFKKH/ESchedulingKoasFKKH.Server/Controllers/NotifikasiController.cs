using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[Route("api/notifikasi")]
[ApiController]
[Authorize]
public class NotifikasiController : ControllerBase
{
    private readonly INotifikasiService _notifikasiService;
    private readonly IUserRepository _userRepository;

    public NotifikasiController(
        INotifikasiService notifikasiService,
        IUserRepository userRepository)
    {
        _notifikasiService = notifikasiService;
        _userRepository = userRepository;
    }

    private async Task<User?> GetCurrentUserAsync()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return null;
        return await _userRepository.GetByName(username);
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] bool? unreadOnly, [FromQuery] int limit = 50)
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return Unauthorized();

        // Otomatis sinkronisasi notifikasi stase mendekati tanggal mulai / selesai
        try
        {
            await _notifikasiService.GenerateScheduleNotificationsAsync();
        }
        catch
        {
            // Jangan biarkan kegagalan kalkulasi menghentikan pembacaan notifikasi
        }

        var result = await _notifikasiService.GetUserNotificationsAsync(user.Id, unreadOnly, limit);
        return Ok(result);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return Unauthorized();

        var count = await _notifikasiService.GetUnreadCountAsync(user.Id);
        return Ok(new { unreadCount = count });
    }

    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return Unauthorized();

        var success = await _notifikasiService.MarkAsReadAsync(id, user.Id);
        if (!success) return NotFound();

        return Ok(new { success = true });
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return Unauthorized();

        await _notifikasiService.MarkAllAsReadAsync(user.Id);
        return Ok(new { success = true });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return Unauthorized();

        var success = await _notifikasiService.DeleteNotificationAsync(id, user.Id);
        if (!success) return NotFound();

        return NoContent();
    }

    [HttpDelete("clear-all")]
    public async Task<IActionResult> ClearAll()
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return Unauthorized();

        await _notifikasiService.ClearAllAsync(user.Id);
        return NoContent();
    }
}
