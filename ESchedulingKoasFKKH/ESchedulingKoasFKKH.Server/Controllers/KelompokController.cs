using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.KelompokModels;
using ESchedulingKoasFKKH.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/kelompok")]
[Authorize]
public class KelompokController : ControllerBase
{
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IMahasiswaRepository _mahasiswaRepository;
    private readonly IRiwayatKelompokRepository _riwayatKelompokRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHariLiburService _hariLiburService;
    private readonly IAutoArchiveService _autoArchiveService;
    private readonly INotifikasiService _notifikasiService;
    private readonly IMahasiswaAccessService _mahasiswaAccessService;

    public KelompokController(
        IKelompokRepository kelompokRepository,
        IMahasiswaRepository mahasiswaRepository,
        IRiwayatKelompokRepository riwayatKelompokRepository,
        IUnitOfWork unitOfWork,
        IHariLiburService hariLiburService,
        IAutoArchiveService autoArchiveService,
        INotifikasiService notifikasiService,
        IMahasiswaAccessService mahasiswaAccessService)
    {
        _kelompokRepository = kelompokRepository;
        _mahasiswaRepository = mahasiswaRepository;
        _riwayatKelompokRepository = riwayatKelompokRepository;
        _unitOfWork = unitOfWork;
        _hariLiburService = hariLiburService;
        _autoArchiveService = autoArchiveService;
        _notifikasiService = notifikasiService;
        _mahasiswaAccessService = mahasiswaAccessService;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        await AutoArchiveCompletedSchedulesAsync();
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        if (User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Pengelola) || User.IsInRole(UserRoles.Dosen))
            return Ok(ToResponse(kelompok));

        if (User.IsInRole(UserRoles.Mahasiswa))
        {
            var access = await _mahasiswaAccessService.EvaluateByUsernameAsync(User?.Identity?.Name);
            if (access is null || !access.CanViewJadwalDanKelompok)
                return Forbid();

            var today = DateOnly.FromDateTime(DateTime.Today);
            var activeTaIds = await _mahasiswaAccessService.GetActiveTahunAjaranIdsAsync(today);
            if (!_mahasiswaAccessService.IsKelompokInActivePeriod(kelompok, activeTaIds, today))
                return Forbid();

            return Ok(ToResponse(kelompok));
        }

        return Forbid();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? idTahunAjaran = null)
    {
        await AutoArchiveCompletedSchedulesAsync();
        var allKelompok = await _kelompokRepository.GetAll();

        if (User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Pengelola) || User.IsInRole(UserRoles.Dosen))
        {
            if (idTahunAjaran.HasValue && idTahunAjaran.Value > 0)
            {
                allKelompok = allKelompok.Where(x => x.IdTahunAjaran == idTahunAjaran.Value).ToList();
            }

            return Ok(allKelompok.Select(ToResponse));
        }

        if (User.IsInRole(UserRoles.Mahasiswa))
        {
            var access = await _mahasiswaAccessService.EvaluateByUsernameAsync(User?.Identity?.Name);
            if (access is null || access.SudahSelesaiAtauTerlewat)
                return Forbid();

            if (!access.CanViewJadwalDanKelompok)
                return Ok(Array.Empty<object>());

            var today = DateOnly.FromDateTime(DateTime.Today);
            var activeTaIds = await _mahasiswaAccessService.GetActiveTahunAjaranIdsAsync(today);
            var filtered = allKelompok
                .Where(x => _mahasiswaAccessService.IsKelompokInActivePeriod(x, activeTaIds, today));

            if (idTahunAjaran.HasValue && idTahunAjaran.Value > 0)
            {
                filtered = filtered.Where(x =>
                    (_mahasiswaAccessService.ResolveTahunAjaranKelompok(x)?.Id ?? x.IdTahunAjaran) == idTahunAjaran.Value);
            }

            return Ok(filtered.Select(ToResponse));
        }

        return Forbid();
    }

    private object ToResponse(Kelompok x)
    {
        var tahunAjaran = _mahasiswaAccessService.ResolveTahunAjaranKelompok(x);
        return new
        {
            x.Id,
            x.Nama,
            idTahunAjaran = tahunAjaran?.Id ?? x.IdTahunAjaran,
            tahunAjaran = tahunAjaran != null ? $"{tahunAjaran.Tahun} - {tahunAjaran.Semester}" : null,
            daftarMahasiswa = (x.DaftarMahasiswa ?? Enumerable.Empty<Mahasiswa>()).Select(m => new { m.Id, m.NIM, m.Nama }),
            daftarJadwal = (x.DaftarJadwal ?? Enumerable.Empty<Jadwal>()).Select(j => new
            {
                j.Id,
                j.TanggalMulai,
                tanggalSelesai = j.Stase != null ? j.TanggalSelesai(_hariLiburService) : j.TanggalMulai,
                idStase = j.Stase?.Id,
                namaStase = j.Stase?.Nama,
                idPembimbing = j.Pembimbing?.Id,
                namaPembimbing = j.Pembimbing?.Nama,
                nipPembimbing = j.Pembimbing?.NIP,
                daftarSubStase = (j.DaftarJadwalSubStase ?? Enumerable.Empty<JadwalSubStase>()).Select(sub => new
                {
                    idSubStase = sub.SubStase?.Id,
                    urutan = sub.SubStase?.Urutan,
                    namaSubStase = sub.SubStase?.Nama,
                    idPembimbing = sub.Pembimbing?.Id,
                    namaPembimbing = sub.Pembimbing?.Nama,
                    nipPembimbing = sub.Pembimbing?.NIP
                }).OrderBy(s => s.urutan)
            })
        };
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Create(CreateKelompok create)
    {
        if (await _kelompokRepository.IsExist(create.Nama, create.IdTahunAjaran))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nama"] = $"Nama kelompok '{create.Nama}' sudah digunakan pada tahun ajaran ini" });

        var kelompok = new Kelompok
        {
            Nama = create.Nama,
            IdTahunAjaran = create.IdTahunAjaran
        };

        _kelompokRepository.Add(kelompok);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return Created(
            $"/api/kelompok/{kelompok.Id}",
            new
            {
                kelompok.Id,
                kelompok.Nama,
                idTahunAjaran = kelompok.IdTahunAjaran
            });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Update(int id, UpdateKelompok update)
    {
        if (update.Id != id)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["id"] = "Id pada body tidak sesuai dengan id pada url" });

        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        if (await _kelompokRepository.IsExist(update.Nama, update.IdTahunAjaran, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nama"] = $"Nama kelompok '{update.Nama}' sudah digunakan pada tahun ajaran ini" });

        kelompok.Nama = update.Nama;
        kelompok.IdTahunAjaran = update.IdTahunAjaran;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        _kelompokRepository.Delete(kelompok);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpPut("{id:int}/tambah-anggota")]
    [Authorize(Roles = UserRoles.Pengelola)]
    public async Task<IActionResult> TambahAnggota(int id, TambahAnggota tambahAnggota)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        var mahasiswa = await _mahasiswaRepository.Get(tambahAnggota.IdMahasiswa);
        if (mahasiswa is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["idMahasiswa"] = $"Mahasiswa dengan id '{tambahAnggota.IdMahasiswa}' tidak ditemukan" });

        if (mahasiswa.Kelompok is not null)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["idMahasiswa"] = $"Mahasiswa '{mahasiswa.Nama}' sudah terdaftar di kelompok lain" });

        mahasiswa.Kelompok = kelompok;

        if (mahasiswa.TahunAjaran is null && kelompok.TahunAjaran is not null)
        {
            mahasiswa.TahunAjaran = kelompok.TahunAjaran;
        }

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        if (mahasiswa.User is not null)
        {
            try
            {
                await _notifikasiService.SendNotificationAsync(
                    mahasiswa.User.Id,
                    "Penugasan Kelompok",
                    $"Anda telah ditugaskan ke dalam {kelompok.Nama}.",
                    "penugasan",
                    "Penugasan",
                    $"/mahasiswa/{mahasiswa.Id}"
                );
            }
            catch { /* Notification failure should not break the response */ }
        }

        return NoContent();
    }

    [HttpPost("{id:int}/hapus-anggota")]
    [Authorize(Roles = UserRoles.Pengelola)]
    public async Task<IActionResult> HapusAnggota(int id, HapusAnggota hapusAnggota)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        var mahasiswa = await _mahasiswaRepository.Get(hapusAnggota.IdMahasiswa);
        if (mahasiswa is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["idMahasiswa"] = $"Mahasiswa dengan id '{hapusAnggota.IdMahasiswa}' tidak ditemukan" });

        if (mahasiswa.Kelompok is null || mahasiswa.Kelompok.Id != id)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["idMahasiswa"] = $"Mahasiswa '{mahasiswa.Nama}' bukan anggota kelompok ini" });

        mahasiswa.Kelompok = null;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        if (mahasiswa.User is not null)
        {
            try
            {
                await _notifikasiService.SendNotificationAsync(
                    mahasiswa.User.Id,
                    "Perubahan Kelompok",
                    $"Anda telah dikeluarkan dari {kelompok.Nama}.",
                    "pemberitahuan",
                    "Akademik",
                    $"/mahasiswa/{mahasiswa.Id}"
                );
            }
            catch { /* Notification failure should not break the response */ }
        }

        return NoContent();
    }

    private async Task AutoArchiveCompletedSchedulesAsync()
    {
        await _autoArchiveService.AutoArchiveCompletedSchedulesAsync();
    }
}
