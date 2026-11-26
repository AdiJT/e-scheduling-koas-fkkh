using System.Security.Claims;
using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Controllers;
using ESchedulingKoasFKKH.Server.Controllers.Dtos;
using ESchedulingKoasFKKH.Server.Models.JadwalModels;
using ESchedulingKoasFKKH.Server.Models.KelompokModels;
using ESchedulingKoasFKKH.Server.Models.MahasiswaModels;
using ESchedulingKoasFKKH.Server.Models.PembimbingModels;
using ESchedulingKoasFKKH.Server.Models.PengaturanSistemModels;
using ESchedulingKoasFKKH.Server.Models.StaseModels;
using ESchedulingKoasFKKH.Server.Models.UserModels;
using ESchedulingKoasFKKH.Server.Services;
using ESchedulingKoasFKKH.Server.Services.Api;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Infrastructure;

namespace ESchedulingKoasFKKH.Server.Filters;

public sealed class ActivityLogActionFilter : IAsyncActionFilter
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ActivityLogActionFilter> _logger;

    private sealed record ActivityMetadata(
        string Modul,
        string Aksi,
        string Deskripsi,
        string? TargetEntitas);

    private sealed record ActorInfo(
        int? UserId,
        string Username,
        string? NamaPelaku,
        string Role);

    public ActivityLogActionFilter(
        IServiceScopeFactory scopeFactory,
        ILogger<ActivityLogActionFilter> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var method = context.HttpContext.Request.Method;
        if (!IsWriteMethod(method))
        {
            await next();
            return;
        }

        if (context.ActionDescriptor is not ControllerActionDescriptor descriptor)
        {
            await next();
            return;
        }

        var controller = descriptor.ControllerName;
        var action = descriptor.ActionName;

        // Skip login and ActivityLog endpoints
        if ((string.Equals(controller, "User", StringComparison.OrdinalIgnoreCase) &&
             (string.Equals(action, "Login", StringComparison.OrdinalIgnoreCase) ||
              string.Equals(action, "GoogleLogin", StringComparison.OrdinalIgnoreCase))) ||
            string.Equals(controller, "ActivityLog", StringComparison.OrdinalIgnoreCase))
        {
            await next();
            return;
        }

        ActorInfo actor = new(null, "system", "System", "system");
        ActivityMetadata? metadata = null;

        try
        {
            using var preScope = _scopeFactory.CreateScope();
            actor = await ResolveActorAsync(context.HttpContext.User, preScope.ServiceProvider);
            metadata = await BuildMetadataAsync(controller, action, method, context.ActionArguments, actor, preScope.ServiceProvider);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gagal menyusun metadata awal log aktivitas untuk {Controller}.{Action}", controller, action);
        }

        var executedContext = await next();

        if (executedContext.Exception != null && !executedContext.ExceptionHandled)
        {
            return;
        }

        var statusCode = GetResultStatusCode(executedContext);
        if (statusCode < 200 || statusCode >= 300)
        {
            return;
        }

        try
        {
            metadata ??= BuildFallbackMetadata(controller, action, method);
            metadata = EnrichMetadataAfterExecution(controller, action, metadata, executedContext);

            var endpoint = $"{method} {context.HttpContext.Request.Path.Value}";
            var ipAddress = context.HttpContext.Connection.RemoteIpAddress?.ToString();

            using var saveScope = _scopeFactory.CreateScope();
            var repo = saveScope.ServiceProvider.GetRequiredService<IActivityLogRepository>();
            var unitOfWork = saveScope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            repo.Add(new ActivityLog
            {
                UserId = actor.UserId,
                Username = actor.Username,
                NamaPelaku = actor.NamaPelaku,
                Role = actor.Role,
                Modul = metadata.Modul,
                Aksi = metadata.Aksi,
                Deskripsi = metadata.Deskripsi,
                TargetEntitas = metadata.TargetEntitas,
                Endpoint = endpoint,
                IpAddress = ipAddress,
            });

            await unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gagal menyimpan log aktivitas untuk {Controller}.{Action}", controller, action);
        }
    }

    private static bool IsWriteMethod(string method) =>
        HttpMethods.IsPost(method) ||
        HttpMethods.IsPut(method) ||
        HttpMethods.IsPatch(method) ||
        HttpMethods.IsDelete(method);

    private static int GetResultStatusCode(ActionExecutedContext context)
    {
        if (context.Result is IStatusCodeActionResult statusCodeResult && statusCodeResult.StatusCode.HasValue)
        {
            return statusCodeResult.StatusCode.Value;
        }

        return context.Result switch
        {
            NoContentResult => StatusCodes.Status204NoContent,
            OkResult => StatusCodes.Status200OK,
            _ => context.HttpContext.Response.StatusCode
        };
    }

    private static async Task<ActorInfo> ResolveActorAsync(ClaimsPrincipal principal, IServiceProvider sp)
    {
        var username = principal.Identity?.Name;
        var roleClaim = principal.FindFirst(ClaimTypes.Role)?.Value ?? "unknown";

        if (string.IsNullOrWhiteSpace(username))
        {
            return new ActorInfo(null, "unknown", "Pengguna Tidak Dikenal", roleClaim);
        }

        var userRepo = sp.GetRequiredService<IUserRepository>();
        var user = await userRepo.GetByName(username);

        if (user is null)
        {
            return new ActorInfo(null, username, username, roleClaim);
        }

        var role = string.IsNullOrWhiteSpace(user.Role) ? roleClaim : user.Role;
        var namaPelaku = role.ToLowerInvariant() switch
        {
            UserRoles.Mahasiswa => user.Mahasiswa?.Nama ?? user.Name,
            UserRoles.Dosen => user.Pembimbing?.Nama ?? user.Name,
            UserRoles.Admin => "Administrator",
            UserRoles.Pengelola => "Pengelola Akademik",
            _ => user.Name
        };

        return new ActorInfo(user.Id, user.Name, namaPelaku, role);
    }

    private static async Task<ActivityMetadata> BuildMetadataAsync(
        string controller,
        string action,
        string method,
        IDictionary<string, object?> args,
        ActorInfo actor,
        IServiceProvider sp)
    {
        return controller switch
        {
            "TahunAjaran" => await BuildTahunAjaranMetadataAsync(action, args, sp),
            "Mahasiswa" => await BuildMahasiswaMetadataAsync(action, args, sp),
            "Pembimbing" => await BuildPembimbingMetadataAsync(action, args, sp),
            "Stase" => await BuildStaseMetadataAsync(action, args, sp),
            "Kelompok" => await BuildKelompokMetadataAsync(action, args, sp),
            "Jadwal" => await BuildJadwalMetadataAsync(action, args, sp),
            "RiwayatKelompok" => await BuildRiwayatKelompokMetadataAsync(action, args, sp),
            "Broadcast" => await BuildBroadcastMetadataAsync(action, args, sp),
            "Notifikasi" => await BuildNotifikasiMetadataAsync(action, args, sp),
            "User" => await BuildUserMetadataAsync(action, args, actor, sp),
            "PengaturanSistem" => await BuildPengaturanSistemMetadataAsync(action, args, sp),
            _ => BuildFallbackMetadata(controller, action, method)
        };
    }

    private static async Task<ActivityMetadata> BuildTahunAjaranMetadataAsync(
        string action,
        IDictionary<string, object?> args,
        IServiceProvider sp)
    {
        const string modul = "Tahun Ajaran";
        switch (action)
        {
            case "Create":
                if (TryGetArg<CreateTahunAjaran>(args, out var create) && create is not null)
                {
                    var label = $"{create.Tahun} - {create.Semester}";
                    return new ActivityMetadata(modul, "Tambah",
                        $"Menambahkan periode Tahun Ajaran {label} ({create.TanggalMulai} s.d. {create.TanggalSelesai})",
                        label);
                }
                return new ActivityMetadata(modul, "Tambah", "Menambahkan periode Tahun Ajaran baru", null);

            case "Update":
                if (TryGetIntArg(args, "id", out var updId))
                {
                    var repo = sp.GetRequiredService<ITahunAjaranRepository>();
                    var existing = await repo.Get(updId);
                    if (TryGetArg<UpdateTahunAjaran>(args, out var update) && update is not null)
                    {
                        var tahun = update.Tahun > 0 ? update.Tahun : existing?.Tahun ?? 0;
                        var semester = !string.IsNullOrWhiteSpace(update.Semester)
                            ? update.Semester
                            : existing?.Semester.ToString() ?? "";
                        var label = $"{tahun} - {semester}".Trim(' ', '-');
                        return new ActivityMetadata(modul, "Ubah",
                            $"Memperbarui periode Tahun Ajaran {label} ({update.TanggalMulai} s.d. {update.TanggalSelesai})",
                            label);
                    }
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui periode Tahun Ajaran", null);

            case "Delete":
                if (TryGetIntArg(args, "id", out var delId))
                {
                    var repo = sp.GetRequiredService<ITahunAjaranRepository>();
                    var existing = await repo.Get(delId);
                    if (existing is not null)
                    {
                        var label = $"{existing.Tahun} - {existing.Semester}";
                        return new ActivityMetadata(modul, "Hapus",
                            $"Menghapus periode Tahun Ajaran {label}",
                            label);
                    }
                }
                return new ActivityMetadata(modul, "Hapus", "Menghapus periode Tahun Ajaran", null);

            default:
                return BuildFallbackMetadata("TahunAjaran", action, "POST");
        }
    }

    private static async Task<ActivityMetadata> BuildMahasiswaMetadataAsync(
        string action,
        IDictionary<string, object?> args,
        IServiceProvider sp)
    {
        const string modul = "Mahasiswa";
        switch (action)
        {
            case "Create":
                if (TryGetArg<CreateMahasiswa>(args, out var create) && create is not null)
                {
                    var target = $"{create.Nama} ({create.NIM})";
                    return new ActivityMetadata(modul, "Tambah", $"Menambahkan mahasiswa {target}", target);
                }
                return new ActivityMetadata(modul, "Tambah", "Menambahkan data mahasiswa baru", null);

            case "Update":
                if (TryGetArg<UpdateMahasiswa>(args, out var update) && update is not null)
                {
                    var target = $"{update.Nama} ({update.NIM})";
                    return new ActivityMetadata(modul, "Ubah", $"Memperbarui data mahasiswa {target}", target);
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui data mahasiswa", null);

            case "Delete":
                if (TryGetIntArg(args, "id", out var delId))
                {
                    var repo = sp.GetRequiredService<IMahasiswaRepository>();
                    var mhs = await repo.Get(delId);
                    if (mhs is not null)
                    {
                        var target = $"{mhs.Nama} ({mhs.NIM})";
                        return new ActivityMetadata(modul, "Hapus", $"Menghapus mahasiswa {target}", target);
                    }
                }
                return new ActivityMetadata(modul, "Hapus", "Menghapus data mahasiswa", null);

            case "ResetPassword":
                if (TryGetIntArg(args, "id", out var rstId))
                {
                    var repo = sp.GetRequiredService<IMahasiswaRepository>();
                    var mhs = await repo.Get(rstId);
                    if (mhs is not null)
                    {
                        var target = $"{mhs.Nama} ({mhs.NIM})";
                        return new ActivityMetadata(modul, "Reset Password", $"Mereset password akun mahasiswa {target}", target);
                    }
                }
                return new ActivityMetadata(modul, "Reset Password", "Mereset password akun mahasiswa", null);

            case "SinkronSiadiknona":
                return new ActivityMetadata(modul, "Sinkronisasi", "Menyinkronkan data mahasiswa dari SIADIKNONA", "Sinkronisasi SIADIKNONA");

            default:
                return BuildFallbackMetadata("Mahasiswa", action, "POST");
        }
    }

    private static async Task<ActivityMetadata> BuildPembimbingMetadataAsync(
        string action,
        IDictionary<string, object?> args,
        IServiceProvider sp)
    {
        const string modul = "Dosen Pembimbing";
        switch (action)
        {
            case "Create":
                if (TryGetArg<CreatePembimbing>(args, out var create) && create is not null)
                {
                    var target = $"{create.Nama} ({create.NIP})";
                    return new ActivityMetadata(modul, "Tambah", $"Menambahkan dosen pembimbing {target}", target);
                }
                return new ActivityMetadata(modul, "Tambah", "Menambahkan dosen pembimbing baru", null);

            case "Update":
                if (TryGetArg<UpdatePembimbing>(args, out var update) && update is not null)
                {
                    var target = $"{update.Nama} ({update.NIP})";
                    return new ActivityMetadata(modul, "Ubah", $"Memperbarui data dosen pembimbing {target}", target);
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui data dosen pembimbing", null);

            case "Delete":
                if (TryGetIntArg(args, "id", out var delId))
                {
                    var repo = sp.GetRequiredService<IPembimbingRepository>();
                    var dosen = await repo.Get(delId);
                    if (dosen is not null)
                    {
                        var target = $"{dosen.Nama} ({dosen.NIP})";
                        return new ActivityMetadata(modul, "Hapus", $"Menghapus dosen pembimbing {target}", target);
                    }
                }
                return new ActivityMetadata(modul, "Hapus", "Menghapus data dosen pembimbing", null);

            case "ResetPassword":
                if (TryGetIntArg(args, "id", out var rstId))
                {
                    var repo = sp.GetRequiredService<IPembimbingRepository>();
                    var dosen = await repo.Get(rstId);
                    if (dosen is not null)
                    {
                        var target = $"{dosen.Nama} ({dosen.NIP})";
                        return new ActivityMetadata(modul, "Reset Password", $"Mereset password akun dosen {target}", target);
                    }
                }
                return new ActivityMetadata(modul, "Reset Password", "Mereset password akun dosen pembimbing", null);

            case "SinkronSinergi":
                return new ActivityMetadata(modul, "Sinkronisasi", "Menyinkronkan data dosen pembimbing dari SINERGI", "Sinkronisasi SINERGI");

            default:
                return BuildFallbackMetadata("Pembimbing", action, "POST");
        }
    }

    private static async Task<ActivityMetadata> BuildStaseMetadataAsync(
        string action,
        IDictionary<string, object?> args,
        IServiceProvider sp)
    {
        const string modul = "Stase";
        var staseRepo = sp.GetRequiredService<IStaseRepository>();
        var subStaseRepo = sp.GetRequiredService<ISubStaseRepository>();
        var pembimbingRepo = sp.GetRequiredService<IPembimbingRepository>();

        switch (action)
        {
            case "Create":
                if (TryGetArg<CreateStase>(args, out var create) && create is not null)
                {
                    return new ActivityMetadata(modul, "Tambah",
                        $"Menambahkan stase {create.Nama} ({create.Waktu} minggu, {create.Jenis})",
                        create.Nama);
                }
                return new ActivityMetadata(modul, "Tambah", "Menambahkan stase baru", null);

            case "Update":
                if (TryGetArg<UpdateStase>(args, out var update) && update is not null)
                {
                    return new ActivityMetadata(modul, "Ubah",
                        $"Memperbarui stase {update.Nama} ({update.Waktu} minggu, {update.Jenis})",
                        update.Nama);
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui data stase", null);

            case "Delete":
                if (TryGetIntArg(args, "id", out var delId))
                {
                    var stase = await staseRepo.Get(delId);
                    if (stase is not null)
                    {
                        return new ActivityMetadata(modul, "Hapus", $"Menghapus stase {stase.Nama}", stase.Nama);
                    }
                }
                return new ActivityMetadata(modul, "Hapus", "Menghapus data stase", null);

            case "UpdatePembimbingStase":
                if (TryGetIntArg(args, "id", out var stId))
                {
                    var stase = await staseRepo.Get(stId);
                    var count = TryGetArg<UpdatePembimbingStaseRequest>(args, out var req) && req is not null
                        ? req.IdPembimbingList.Count
                        : 0;
                    var namaStase = stase?.Nama ?? $"ID {stId}";
                    return new ActivityMetadata(modul, "Ubah",
                        $"Memperbarui daftar dosen pembimbing stase {namaStase} ({count} dosen)",
                        namaStase);
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui daftar dosen pembimbing stase", null);

            case "PilihKoordinator":
                if (TryGetIntArg(args, "id", out var kordStaseId))
                {
                    var stase = await staseRepo.Get(kordStaseId);
                    var namaStase = stase?.Nama ?? $"ID {kordStaseId}";
                    if (TryGetArg<PilihKoordinatorStaseRequest>(args, out var kordReq) && kordReq?.IdKoordinator is int idKord)
                    {
                        var dosen = await pembimbingRepo.Get(idKord);
                        var namaDosen = dosen?.Nama ?? $"ID {idKord}";
                        return new ActivityMetadata(modul, "Ubah",
                            $"Menunjuk {namaDosen} sebagai koordinator stase {namaStase}",
                            namaStase);
                    }
                    return new ActivityMetadata(modul, "Ubah",
                        $"Menghapus koordinator stase {namaStase}",
                        namaStase);
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui koordinator stase", null);

            case "CreateSubStase":
                if (TryGetIntArg(args, "staseId", out var parentStaseId) &&
                    TryGetArg<CreateSubStaseRequest>(args, out var subCreate) && subCreate is not null)
                {
                    var stase = await staseRepo.Get(parentStaseId);
                    var namaStase = stase?.Nama ?? $"ID {parentStaseId}";
                    var target = $"{subCreate.Nama} ({namaStase})";
                    return new ActivityMetadata(modul, "Tambah",
                        $"Menambahkan sub-stase {subCreate.Nama} pada stase {namaStase}",
                        target);
                }
                return new ActivityMetadata(modul, "Tambah", "Menambahkan sub-stase baru", null);

            case "UpdateSubStase":
                if (TryGetIntArg(args, "subStaseId", out var updSubId) &&
                    TryGetArg<UpdateSubStaseRequest>(args, out var subUpdate) && subUpdate is not null)
                {
                    var sub = await subStaseRepo.Get(updSubId);
                    var namaStase = sub?.Stase?.Nama;
                    var target = string.IsNullOrWhiteSpace(namaStase) ? subUpdate.Nama : $"{subUpdate.Nama} ({namaStase})";
                    return new ActivityMetadata(modul, "Ubah", $"Memperbarui sub-stase {target}", target);
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui data sub-stase", null);

            case "PilihPembimbingSubStase":
                if (TryGetIntArg(args, "subStaseId", out var subId))
                {
                    var sub = await subStaseRepo.Get(subId);
                    var count = TryGetArg<PilihPembimbingSubStaseRequest>(args, out var subReq) && subReq is not null
                        ? subReq.IdDefaultPembimbingList.Count
                        : 0;
                    var namaSub = sub?.Nama ?? $"ID {subId}";
                    return new ActivityMetadata(modul, "Ubah",
                        $"Memperbarui dosen pengampu sub-stase {namaSub} ({count} dosen)",
                        namaSub);
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui dosen pengampu sub-stase", null);

            case "DeleteSubStase":
                if (TryGetIntArg(args, "subStaseId", out var delSubId))
                {
                    var sub = await subStaseRepo.Get(delSubId);
                    if (sub is not null)
                    {
                        var target = sub.Stase is not null ? $"{sub.Nama} ({sub.Stase.Nama})" : sub.Nama;
                        return new ActivityMetadata(modul, "Hapus", $"Menghapus sub-stase {target}", target);
                    }
                }
                return new ActivityMetadata(modul, "Hapus", "Menghapus sub-stase", null);

            default:
                return BuildFallbackMetadata("Stase", action, "POST");
        }
    }

    private static async Task<ActivityMetadata> BuildKelompokMetadataAsync(
        string action,
        IDictionary<string, object?> args,
        IServiceProvider sp)
    {
        const string modul = "Kelompok";
        var kelompokRepo = sp.GetRequiredService<IKelompokRepository>();
        var mahasiswaRepo = sp.GetRequiredService<IMahasiswaRepository>();

        switch (action)
        {
            case "Create":
                if (TryGetArg<CreateKelompok>(args, out var create) && create is not null)
                {
                    return new ActivityMetadata(modul, "Tambah", $"Membuat kelompok baru {create.Nama}", create.Nama);
                }
                return new ActivityMetadata(modul, "Tambah", "Membuat kelompok baru", null);

            case "Update":
                if (TryGetArg<UpdateKelompok>(args, out var update) && update is not null)
                {
                    return new ActivityMetadata(modul, "Ubah", $"Memperbarui kelompok {update.Nama}", update.Nama);
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui data kelompok", null);

            case "Delete":
                if (TryGetIntArg(args, "id", out var delId))
                {
                    var kelompok = await kelompokRepo.Get(delId);
                    if (kelompok is not null)
                    {
                        return new ActivityMetadata(modul, "Hapus", $"Menghapus kelompok {kelompok.Nama}", kelompok.Nama);
                    }
                }
                return new ActivityMetadata(modul, "Hapus", "Menghapus kelompok", null);

            case "TambahAnggota":
                if (TryGetIntArg(args, "id", out var addKelId) &&
                    TryGetArg<TambahAnggota>(args, out var tambah) && tambah is not null)
                {
                    var kelompok = await kelompokRepo.Get(addKelId);
                    var mhs = await mahasiswaRepo.Get(tambah.IdMahasiswa);
                    var namaKel = kelompok?.Nama ?? $"ID {addKelId}";
                    var namaMhs = mhs is not null ? $"{mhs.Nama} ({mhs.NIM})" : $"Mahasiswa ID {tambah.IdMahasiswa}";
                    return new ActivityMetadata(modul, "Ubah",
                        $"Menambahkan anggota {namaMhs} ke {namaKel}",
                        $"{namaKel} - {namaMhs}");
                }
                return new ActivityMetadata(modul, "Ubah", "Menambahkan anggota ke kelompok", null);

            case "HapusAnggota":
                if (TryGetIntArg(args, "id", out var remKelId) &&
                    TryGetArg<HapusAnggota>(args, out var hapus) && hapus is not null)
                {
                    var kelompok = await kelompokRepo.Get(remKelId);
                    var mhs = await mahasiswaRepo.Get(hapus.IdMahasiswa);
                    var namaKel = kelompok?.Nama ?? $"ID {remKelId}";
                    var namaMhs = mhs is not null ? $"{mhs.Nama} ({mhs.NIM})" : $"Mahasiswa ID {hapus.IdMahasiswa}";
                    return new ActivityMetadata(modul, "Ubah",
                        $"Mengeluarkan anggota {namaMhs} dari {namaKel}",
                        $"{namaKel} - {namaMhs}");
                }
                return new ActivityMetadata(modul, "Ubah", "Mengeluarkan anggota dari kelompok", null);

            default:
                return BuildFallbackMetadata("Kelompok", action, "POST");
        }
    }

    private static async Task<ActivityMetadata> BuildJadwalMetadataAsync(
        string action,
        IDictionary<string, object?> args,
        IServiceProvider sp)
    {
        const string modul = "Jadwal";
        var jadwalRepo = sp.GetRequiredService<IJadwalRepository>();
        var kelompokRepo = sp.GetRequiredService<IKelompokRepository>();
        var staseRepo = sp.GetRequiredService<IStaseRepository>();

        switch (action)
        {
            case "Create":
                if (TryGetArg<CreateJadwal>(args, out var create) && create is not null)
                {
                    var kelompok = await kelompokRepo.Get(create.IdKelompok);
                    var stase = await staseRepo.Get(create.IdStase);
                    var namaKel = kelompok?.Nama ?? $"Kelompok ID {create.IdKelompok}";
                    var namaStase = stase?.Nama ?? $"Stase ID {create.IdStase}";
                    var target = $"{namaKel} - {namaStase}";
                    return new ActivityMetadata(modul, "Tambah",
                        $"Menjadwalkan {namaKel} di stase {namaStase} mulai {create.TanggalMulai:dd/MM/yyyy}",
                        target);
                }
                return new ActivityMetadata(modul, "Tambah", "Menambahkan jadwal rotasi baru", null);

            case "Generate":
                if (TryGetArg<GenerateJadwalOtomatis>(args, out var gen) && gen?.TanggalMulai is DateOnly tgl)
                {
                    return new ActivityMetadata(modul, "Generate",
                        $"Menjalankan generate jadwal otomatis mulai {tgl:dd/MM/yyyy}",
                        "Jadwal Otomatis");
                }
                return new ActivityMetadata(modul, "Generate", "Menjalankan generate jadwal otomatis", "Jadwal Otomatis");

            case "Update":
                if (TryGetIntArg(args, "id", out var updId))
                {
                    var jadwal = await jadwalRepo.Get(updId);
                    if (TryGetArg<UpdateJadwal>(args, out var update) && update is not null)
                    {
                        var namaKel = jadwal?.Kelompok?.Nama ?? $"Jadwal ID {updId}";
                        var namaStase = jadwal?.Stase?.Nama ?? "";
                        var target = string.IsNullOrWhiteSpace(namaStase) ? namaKel : $"{namaKel} - {namaStase}";
                        return new ActivityMetadata(modul, "Ubah",
                            $"Memperbarui jadwal {target} (mulai {update.TanggalMulai:dd/MM/yyyy})",
                            target);
                    }
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui jadwal rotasi", null);

            case "Delete":
                if (TryGetIntArg(args, "id", out var delId))
                {
                    var jadwal = await jadwalRepo.Get(delId);
                    if (jadwal is not null)
                    {
                        var target = $"{jadwal.Kelompok?.Nama} - {jadwal.Stase?.Nama}";
                        return new ActivityMetadata(modul, "Hapus",
                            $"Menghapus jadwal {target} (mulai {jadwal.TanggalMulai:dd/MM/yyyy})",
                            target);
                    }
                }
                return new ActivityMetadata(modul, "Hapus", "Menghapus jadwal rotasi", null);

            case "DeleteAll":
                return new ActivityMetadata(modul, "Hapus", "Menghapus seluruh jadwal rotasi", "Semua Jadwal");

            default:
                return BuildFallbackMetadata("Jadwal", action, "POST");
        }
    }

    private static async Task<ActivityMetadata> BuildRiwayatKelompokMetadataAsync(
        string action,
        IDictionary<string, object?> args,
        IServiceProvider sp)
    {
        const string modul = "Riwayat Kelompok";
        if (action == "Delete" && TryGetIntArg(args, "id", out var delId))
        {
            var repo = sp.GetRequiredService<IRiwayatKelompokRepository>();
            var riwayat = await repo.Get(delId);
            if (riwayat is not null)
            {
                var target = $"{riwayat.NamaKelompok} - {riwayat.NamaStase}";
                return new ActivityMetadata(modul, "Hapus", $"Menghapus arsip riwayat {target}", target);
            }
            return new ActivityMetadata(modul, "Hapus", "Menghapus data riwayat kelompok", null);
        }

        return BuildFallbackMetadata("RiwayatKelompok", action, "DELETE");
    }

    private static async Task<ActivityMetadata> BuildBroadcastMetadataAsync(
        string action,
        IDictionary<string, object?> args,
        IServiceProvider sp)
    {
        const string modul = "Broadcast";
        switch (action)
        {
            case "Create":
                if (TryGetArg<CreateBroadcastDto>(args, out var dto) && dto is not null)
                {
                    return new ActivityMetadata(modul, "Broadcast",
                        $"Mengirim broadcast '{dto.Judul}' ke target {dto.TargetRole}",
                        dto.Judul);
                }
                return new ActivityMetadata(modul, "Broadcast", "Mengirim pesan broadcast", null);

            case "Delete":
                if (TryGetIntArg(args, "id", out var delId))
                {
                    var repo = sp.GetRequiredService<IBroadcastRepository>();
                    var existing = await repo.Get(delId);
                    if (existing is not null)
                    {
                        return new ActivityMetadata(modul, "Hapus", $"Menghapus riwayat broadcast '{existing.Judul}'", existing.Judul);
                    }
                }
                return new ActivityMetadata(modul, "Hapus", "Menghapus riwayat broadcast", null);

            case "ToggleStatus":
                if (TryGetIntArg(args, "id", out var toggleId))
                {
                    var repo = sp.GetRequiredService<IBroadcastRepository>();
                    var existing = await repo.Get(toggleId);
                    if (existing is not null)
                    {
                        return new ActivityMetadata(modul, "Ubah", $"Mengubah status aktif broadcast '{existing.Judul}'", existing.Judul);
                    }
                }
                return new ActivityMetadata(modul, "Ubah", "Mengubah status aktif broadcast", null);

            default:
                return BuildFallbackMetadata("Broadcast", action, "POST");
        }
    }

    private static async Task<ActivityMetadata> BuildNotifikasiMetadataAsync(
        string action,
        IDictionary<string, object?> args,
        IServiceProvider sp)
    {
        const string modul = "Notifikasi";
        switch (action)
        {
            case "MarkAsRead":
                if (TryGetIntArg(args, "id", out var readId))
                {
                    var repo = sp.GetRequiredService<INotifikasiRepository>();
                    var notif = await repo.Get(readId);
                    var target = notif?.Judul;
                    return new ActivityMetadata(modul, "Ubah",
                        string.IsNullOrWhiteSpace(target) ? "Menandai notifikasi sebagai telah dibaca" : $"Menandai notifikasi '{target}' sebagai telah dibaca",
                        target);
                }
                return new ActivityMetadata(modul, "Ubah", "Menandai notifikasi sebagai telah dibaca", null);

            case "MarkAllAsRead":
                return new ActivityMetadata(modul, "Ubah", "Menandai seluruh notifikasi sebagai telah dibaca", "Semua Notifikasi");

            case "Delete":
                if (TryGetIntArg(args, "id", out var delId))
                {
                    var repo = sp.GetRequiredService<INotifikasiRepository>();
                    var notif = await repo.Get(delId);
                    var target = notif?.Judul;
                    return new ActivityMetadata(modul, "Hapus",
                        string.IsNullOrWhiteSpace(target) ? "Menghapus notifikasi" : $"Menghapus notifikasi '{target}'",
                        target);
                }
                return new ActivityMetadata(modul, "Hapus", "Menghapus notifikasi", null);

            case "ClearAll":
                return new ActivityMetadata(modul, "Hapus", "Membersihkan seluruh notifikasi pribadi", "Semua Notifikasi");

            default:
                return BuildFallbackMetadata("Notifikasi", action, "PUT");
        }
    }

    private static async Task<ActivityMetadata> BuildUserMetadataAsync(
        string action,
        IDictionary<string, object?> args,
        ActorInfo actor,
        IServiceProvider sp)
    {
        switch (action)
        {
            case "UpdateProfile":
                if (TryGetArg<UpdateProfile>(args, out var profile) && profile is not null)
                {
                    var hasNewPassword = !string.IsNullOrWhiteSpace(profile.NewPassword);
                    var usernameChanged = !string.Equals(actor.Username, profile.NewUsername, StringComparison.Ordinal);
                    var detail = (usernameChanged, hasNewPassword) switch
                    {
                        (true, true) => $"Memperbarui username menjadi '{profile.NewUsername}' dan mengganti password profil",
                        (true, false) => $"Memperbarui username profil menjadi '{profile.NewUsername}'",
                        (false, true) => $"Mengganti password akun profil '{actor.Username}'",
                        _ => $"Memperbarui profil akun '{actor.Username}'"
                    };
                    return new ActivityMetadata("Profil Pengguna", "Ubah", detail, profile.NewUsername);
                }
                return new ActivityMetadata("Profil Pengguna", "Ubah", $"Memperbarui profil akun '{actor.Username}'", actor.Username);

            case "CreateManagedUser":
                if (TryGetArg<CreateManagedUserDto>(args, out var create) && create is not null)
                {
                    var emailPart = string.IsNullOrWhiteSpace(create.Email) ? "" : $", email: {create.Email.Trim()}";
                    var target = $"{create.Username} ({create.Role}{emailPart})";
                    return new ActivityMetadata("Manajemen Pengguna", "Tambah", $"Menambahkan akun pengguna {target}", target);
                }
                return new ActivityMetadata("Manajemen Pengguna", "Tambah", "Menambahkan akun pengguna baru", null);

            case "UpdateManagedUser":
                if (TryGetArg<UpdateManagedUserDto>(args, out var update) && update is not null)
                {
                    var emailPart = string.IsNullOrWhiteSpace(update.Email) ? "" : $", email: {update.Email.Trim()}";
                    var target = $"{update.Username} ({update.Role}{emailPart})";
                    var pwdNote = string.IsNullOrWhiteSpace(update.Password) ? "" : " beserta pembaruan password";
                    return new ActivityMetadata("Manajemen Pengguna", "Ubah", $"Memperbarui akun pengguna {target}{pwdNote}", target);
                }
                return new ActivityMetadata("Manajemen Pengguna", "Ubah", "Memperbarui akun pengguna", null);

            case "DeleteManagedUser":
                if (TryGetIntArg(args, "id", out var delId))
                {
                    var userRepo = sp.GetRequiredService<IUserRepository>();
                    var targetUser = await userRepo.Get(delId);
                    if (targetUser is not null)
                    {
                        var target = $"{targetUser.Name} ({targetUser.Role})";
                        return new ActivityMetadata("Manajemen Pengguna", "Hapus", $"Menghapus akun pengguna {target}", target);
                    }
                }
                return new ActivityMetadata("Manajemen Pengguna", "Hapus", "Menghapus akun pengguna", null);

            default:
                return BuildFallbackMetadata("User", action, "POST");
        }
    }

    private static async Task<ActivityMetadata> BuildPengaturanSistemMetadataAsync(
        string action,
        IDictionary<string, object?> args,
        IServiceProvider sp)
    {
        const string modul = "Pengaturan Sistem";
        switch (action)
        {
            case "CreateFaq":
                if (TryGetArg<FaqItemRequest>(args, out var faqCreate) && faqCreate is not null)
                {
                    return new ActivityMetadata(modul, "Tambah", $"Menambahkan FAQ: '{faqCreate.Pertanyaan}'", "Pengaturan FAQ");
                }
                return new ActivityMetadata(modul, "Tambah", "Menambahkan item FAQ baru", "Pengaturan FAQ");

            case "UpdateFaq":
                if (TryGetArg<FaqItemRequest>(args, out var faqUpdate) && faqUpdate is not null)
                {
                    return new ActivityMetadata(modul, "Ubah", $"Memperbarui FAQ: '{faqUpdate.Pertanyaan}'", "Pengaturan FAQ");
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui item FAQ", "Pengaturan FAQ");

            case "DeleteFaq":
                if (TryGetIntArg(args, "id", out var delFaqId))
                {
                    var faqRepo = sp.GetRequiredService<IFaqRepository>();
                    var existingFaq = await faqRepo.Get(delFaqId);
                    if (existingFaq is not null)
                    {
                        return new ActivityMetadata(modul, "Hapus", $"Menghapus FAQ: '{existingFaq.Pertanyaan}'", "Pengaturan FAQ");
                    }
                }
                return new ActivityMetadata(modul, "Hapus", "Menghapus item FAQ", "Pengaturan FAQ");

            case "UpdateKontak":
                if (TryGetArg<KontakSettingRequest>(args, out var kontakReq) && kontakReq is not null)
                {
                    return new ActivityMetadata(modul, "Ubah", $"Memperbarui pengaturan kontak ({kontakReq.Email})", "Pengaturan Kontak");
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui pengaturan kontak administrator", "Pengaturan Kontak");

            case "CreateHariLibur":
                if (TryGetArg<HariLiburRequest>(args, out var liburCreate) && liburCreate is not null)
                {
                    var tglSelesai = liburCreate.TanggalSelesai ?? liburCreate.TanggalMulai;
                    var rangeText = tglSelesai == liburCreate.TanggalMulai
                        ? $"{liburCreate.TanggalMulai:dd/MM/yyyy}"
                        : $"{liburCreate.TanggalMulai:dd/MM/yyyy} s.d. {tglSelesai:dd/MM/yyyy}";
                    return new ActivityMetadata(modul, "Tambah", $"Menambahkan hari libur '{liburCreate.Nama}' ({rangeText})", liburCreate.Nama);
                }
                return new ActivityMetadata(modul, "Tambah", "Menambahkan hari libur kalender", "Pengaturan Kalender");

            case "UpdateHariLibur":
                if (TryGetArg<HariLiburRequest>(args, out var liburUpdate) && liburUpdate is not null)
                {
                    var tglSelesai = liburUpdate.TanggalSelesai ?? liburUpdate.TanggalMulai;
                    var rangeText = tglSelesai == liburUpdate.TanggalMulai
                        ? $"{liburUpdate.TanggalMulai:dd/MM/yyyy}"
                        : $"{liburUpdate.TanggalMulai:dd/MM/yyyy} s.d. {tglSelesai:dd/MM/yyyy}";
                    return new ActivityMetadata(modul, "Ubah", $"Memperbarui hari libur '{liburUpdate.Nama}' ({rangeText})", liburUpdate.Nama);
                }
                return new ActivityMetadata(modul, "Ubah", "Memperbarui hari libur kalender", "Pengaturan Kalender");

            case "DeleteHariLibur":
                if (TryGetIntArg(args, "id", out var delLiburId))
                {
                    var liburRepo = sp.GetRequiredService<IHariLiburRepository>();
                    var existingLibur = await liburRepo.Get(delLiburId);
                    if (existingLibur is not null)
                    {
                        return new ActivityMetadata(modul, "Hapus", $"Menghapus hari libur '{existingLibur.Nama}'", existingLibur.Nama);
                    }
                }
                return new ActivityMetadata(modul, "Hapus", "Menghapus hari libur kalender", "Pengaturan Kalender");

            default:
                return BuildFallbackMetadata("PengaturanSistem", action, "POST");
        }
    }

    private static ActivityMetadata EnrichMetadataAfterExecution(
        string controller,
        string action,
        ActivityMetadata current,
        ActionExecutedContext executedContext)
    {
        if (string.Equals(controller, "Jadwal", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(action, "Generate", StringComparison.OrdinalIgnoreCase) &&
            executedContext.Result is ObjectResult objectResult &&
            objectResult.Value is GenerateJadwalResult genResult)
        {
            return current with
            {
                Deskripsi = $"Generate jadwal otomatis selesai: {genResult.JadwalDibuat} jadwal dibuat untuk {genResult.KelompokDiproses} kelompok (acuan {genResult.TanggalMulaiAcuan:dd/MM/yyyy})"
            };
        }

        if (string.Equals(controller, "Broadcast", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(action, "Create", StringComparison.OrdinalIgnoreCase) &&
            executedContext.Result is ObjectResult broadcastResult &&
            broadcastResult.Value is BroadcastItemDto broadcastDto)
        {
            return current with
            {
                Deskripsi = $"Mengirim broadcast '{broadcastDto.Judul}' ke target {broadcastDto.TargetRole} ({broadcastDto.JumlahPenerima} penerima)"
            };
        }

        if (string.Equals(controller, "Mahasiswa", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(action, "SinkronSiadiknona", StringComparison.OrdinalIgnoreCase) &&
            executedContext.Result is ObjectResult syncResultObj &&
            syncResultObj.Value is SiadiknonaSyncResult syncResult)
        {
            return current with
            {
                Deskripsi = $"Sinkronisasi SIADIKNONA periode {syncResult.IdPeriode} ({syncResult.TahunAjaran}): {syncResult.JumlahBaru} baru, {syncResult.JumlahUpdate} diperbarui, {syncResult.JumlahTidakBerubah} tetap, {syncResult.JumlahGagal} gagal dari {syncResult.JumlahItem} data",
                TargetEntitas = $"SIADIKNONA {syncResult.IdPeriode}"
            };
        }

        if (string.Equals(controller, "Pembimbing", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(action, "SinkronSinergi", StringComparison.OrdinalIgnoreCase) &&
            executedContext.Result is ObjectResult sinergiResultObj &&
            sinergiResultObj.Value is SinergiSyncResult sinergiResult)
        {
            return current with
            {
                Deskripsi = $"Sinkronisasi SINERGI (S1 Kedokteran Hewan & Profesi Dokter Hewan): {sinergiResult.JumlahBaru} baru, {sinergiResult.JumlahUpdate} diperbarui, {sinergiResult.JumlahTidakBerubah} tetap, {sinergiResult.JumlahGagal} gagal dari {sinergiResult.JumlahItem} data",
                TargetEntitas = "SINERGI Dosen"
            };
        }

        return current;
    }

    private static ActivityMetadata BuildFallbackMetadata(string controller, string action, string method)
    {
        var aksi = method.ToUpperInvariant() switch
        {
            "POST" => "Tambah",
            "PUT" or "PATCH" => "Ubah",
            "DELETE" => "Hapus",
            _ => "Aktivitas"
        };

        return new ActivityMetadata(controller, aksi, $"Menjalankan aksi {action} pada modul {controller}", null);
    }

    private static bool TryGetArg<T>(IDictionary<string, object?> args, out T? value) where T : class
    {
        foreach (var item in args.Values)
        {
            if (item is T typed)
            {
                value = typed;
                return true;
            }
        }

        value = null;
        return false;
    }

    private static bool TryGetIntArg(IDictionary<string, object?> args, string key, out int value)
    {
        if (args.TryGetValue(key, out var raw) && raw is int intVal)
        {
            value = intVal;
            return true;
        }

        value = 0;
        return false;
    }
}
