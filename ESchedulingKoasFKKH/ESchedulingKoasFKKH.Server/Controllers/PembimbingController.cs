using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.PembimbingModels;
using ESchedulingKoasFKKH.Server.Models.UserModels;
using ESchedulingKoasFKKH.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/pembimbing")]
[Authorize]
public class PembimbingController : ControllerBase
{
    private readonly IPembimbingRepository _pembimbingRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IStaseRepository _staseRepository;
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IRiwayatKelompokRepository _riwayatKelompokRepository;
    private readonly IHariLiburService _hariLiburService;
    private readonly IAutoArchiveService _autoArchiveService;

    public PembimbingController(
        IPembimbingRepository pembimbingRepository,
        IUnitOfWork unitOfWork,
        IUserRepository userRepository,
        IPasswordHasher<User> passwordHasher,
        IStaseRepository staseRepository,
        IKelompokRepository kelompokRepository,
        IRiwayatKelompokRepository riwayatKelompokRepository,
        IHariLiburService hariLiburService,
        IAutoArchiveService autoArchiveService)
    {
        _pembimbingRepository = pembimbingRepository;
        _unitOfWork = unitOfWork;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _staseRepository = staseRepository;
        _kelompokRepository = kelompokRepository;
        _riwayatKelompokRepository = riwayatKelompokRepository;
        _hariLiburService = hariLiburService;
        _autoArchiveService = autoArchiveService;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var pembimbing = await _pembimbingRepository.Get(id);
        if (pembimbing is null) return NotFound();

        await _autoArchiveService.AutoArchiveCompletedSchedulesAsync();

        var semuaStase = await _staseRepository.GetAll();
        var staseDiampu = semuaStase
            .Where(s => s.DaftarPembimbing.Any(p => p.Id == pembimbing.Id || p.NIP == pembimbing.NIP) || pembimbing.DaftarStase.Any(ds => ds.Id == s.Id))
            .Select(s => new
            {
                s.Id,
                s.Nama,
                jumlahHari = s.JumlahHari
            }).ToList();

        var staseKoordinator = semuaStase
            .Where(s => s.Koordinator?.Id == pembimbing.Id || s.Koordinator?.NIP == pembimbing.NIP)
            .Select(s => new
            {
                s.Id,
                s.Nama,
                jumlahHari = s.JumlahHari
            }).ToList();

        var staseDiampuIds = staseDiampu.Select(s => s.Id).ToHashSet();
        var staseKoordinatorIds = staseKoordinator.Select(s => s.Id).ToHashSet();
        var staseDiampuNames = staseDiampu.Select(s => s.Nama).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var staseKoordinatorNames = staseKoordinator.Select(s => s.Nama).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var today = DateOnly.FromDateTime(DateTime.Today);

        try
        {
            var allKelompoks = await _kelompokRepository.GetAll();
            var jadwalBimbinganList = new List<JadwalBimbinganItemDto>();
            int totalBimbinganAktif = 0;
            int totalBimbinganMendatang = 0;

            foreach (var kel in allKelompoks ?? Enumerable.Empty<Kelompok>())
            {
                if (kel?.DaftarJadwal == null) continue;
                foreach (var j in kel.DaftarJadwal)
                {
                    if (j == null) continue;

                    // Cek apakah dosen pengampu jadwal ini, pengampu sub-stase, atau pengampu stase klinis bersangkutan
                    bool isMainSupervisor = j.Pembimbing is not null && 
                        (j.Pembimbing.Id == pembimbing.Id || (!string.IsNullOrEmpty(pembimbing.NIP) && j.Pembimbing.NIP == pembimbing.NIP));
                    
                    var matchingSubStase = (j.DaftarJadwalSubStase ?? Enumerable.Empty<JadwalSubStase>())
                        .FirstOrDefault(sub => sub?.Pembimbing is not null && (sub.Pembimbing.Id == pembimbing.Id || (!string.IsNullOrEmpty(pembimbing.NIP) && sub.Pembimbing.NIP == pembimbing.NIP)));
                    bool isSubSupervisor = matchingSubStase != null;
                    bool isStasePengampu = j.Stase is not null && (staseDiampuIds.Contains(j.Stase.Id) || staseKoordinatorIds.Contains(j.Stase.Id));

                    // CUKUP TAMPILKAN JADWAL YANG MEMANG DOSEN TERSEBUT ADALAH PENGAMPUNYA
                    if (isMainSupervisor || isSubSupervisor || isStasePengampu)
                    {
                        DateOnly tglSelesai = j.TanggalMulai;
                        try
                        {
                            tglSelesai = j.Stase != null && _hariLiburService != null ? j.TanggalSelesai(_hariLiburService) : j.TanggalMulai;
                        }
                        catch
                        {
                            tglSelesai = j.Stase != null ? j.TanggalMulai.AddDays(j.Stase.JumlahHari) : j.TanggalMulai;
                        }

                        string status = tglSelesai < today ? "Selesai" : (j.TanggalMulai <= today && today <= tglSelesai ? "Sedang Berjalan" : "Mendatang");

                        if (status == "Sedang Berjalan") totalBimbinganAktif++;
                        else if (status == "Mendatang") totalBimbinganMendatang++;

                        string peran;
                        string? subInfo = null;

                        if (isMainSupervisor)
                        {
                            peran = "Pembimbing Utama";
                        }
                        else if (isSubSupervisor)
                        {
                            peran = "Pembimbing Sub-Stase";
                            subInfo = matchingSubStase?.SubStase?.Nama;
                        }
                        else if (j.Stase != null && staseKoordinatorIds.Contains(j.Stase.Id))
                        {
                            peran = "Koordinator Stase";
                        }
                        else
                        {
                            peran = "Dosen Pengampu";
                        }

                        jadwalBimbinganList.Add(new JadwalBimbinganItemDto
                        {
                            Id = j.Id,
                            IdKelompok = kel.Id,
                            NamaKelompok = kel.Nama,
                            TahunAjaran = kel.TahunAjaran != null ? $"{kel.TahunAjaran.Tahun} - {kel.TahunAjaran.Semester}" : null,
                            IdStase = j.Stase?.Id,
                            NamaStase = j.Stase?.Nama,
                            JumlahHari = j.Stase?.JumlahHari,
                            TanggalMulai = j.TanggalMulai,
                            TanggalSelesai = tglSelesai,
                            Status = status,
                            Peran = peran,
                            SubStaseInfo = subInfo,
                            DaftarMahasiswa = (kel.DaftarMahasiswa ?? Enumerable.Empty<Mahasiswa>()).Select(m => new MahasiswaRingkasItemDto
                            {
                                Id = m.Id,
                                NIM = m.NIM,
                                Nama = m.Nama
                            }).ToList()
                        });
                    }
            }
        }

            // Ambil riwayat bimbingan dari RiwayatKelompok
            var allRiwayat = await _riwayatKelompokRepository.GetAll();
            var riwayatBimbinganList = new List<RiwayatBimbinganItemDto>();

            foreach (var r in allRiwayat ?? Enumerable.Empty<RiwayatKelompok>())
            {
                if (r == null) continue;
                bool isMainSupervisor = (!string.IsNullOrEmpty(r.NipPembimbing) && !string.IsNullOrEmpty(pembimbing.NIP) && r.NipPembimbing == pembimbing.NIP) || 
                                        (!string.IsNullOrEmpty(r.NamaPembimbing) && !string.IsNullOrEmpty(pembimbing.Nama) && r.NamaPembimbing.Equals(pembimbing.Nama, StringComparison.OrdinalIgnoreCase));
                var subList = !string.IsNullOrEmpty(r.DaftarSubStaseJson) ? (JsonSerializer.Deserialize<List<SubStaseDto>>(r.DaftarSubStaseJson) ?? []) : [];
                var matchingSub = subList.FirstOrDefault(s => s != null && ((!string.IsNullOrEmpty(s.NipPembimbing) && !string.IsNullOrEmpty(pembimbing.NIP) && s.NipPembimbing == pembimbing.NIP) || 
                                                              (!string.IsNullOrEmpty(s.NamaPembimbing) && !string.IsNullOrEmpty(pembimbing.Nama) && s.NamaPembimbing.Equals(pembimbing.Nama, StringComparison.OrdinalIgnoreCase))));
                bool isSubSupervisor = matchingSub != null;
                bool isStasePengampu = !string.IsNullOrEmpty(r.NamaStase) && (staseDiampuNames.Contains(r.NamaStase) || staseKoordinatorNames.Contains(r.NamaStase));

                // CUKUP TAMPILKAN RIWAYAT YANG MEMANG DOSEN TERSEBUT ADALAH PENGAMPUNYA
                if (isMainSupervisor || isSubSupervisor || isStasePengampu)
                {
                    string peran;
                    string? subInfo = null;

                    if (isMainSupervisor)
                    {
                        peran = "Pembimbing Utama";
                    }
                    else if (isSubSupervisor)
                    {
                        peran = "Pembimbing Sub-Stase";
                        subInfo = matchingSub?.NamaSubStase;
                    }
                    else if (!string.IsNullOrEmpty(r.NamaStase) && staseKoordinatorNames.Contains(r.NamaStase))
                    {
                        peran = "Koordinator Stase";
                    }
                    else
                    {
                        peran = "Dosen Pengampu";
                    }

                    riwayatBimbinganList.Add(new RiwayatBimbinganItemDto
                    {
                        Id = r.Id,
                        IdJadwalAsal = r.IdJadwalAsal,
                        NamaKelompok = r.NamaKelompok,
                        TahunAjaran = r.TahunAjaran,
                        NamaStase = r.NamaStase,
                        TanggalMulai = r.TanggalMulai,
                        TanggalSelesai = r.TanggalSelesai,
                        Peran = peran,
                        SubStaseInfo = subInfo,
                        NamaPembimbing = r.NamaPembimbing,
                        NipPembimbing = r.NipPembimbing,
                        DaftarSubStase = subList,
                        DaftarMahasiswa = !string.IsNullOrEmpty(r.DaftarMahasiswaJson) ? (JsonSerializer.Deserialize<List<MahasiswaDto>>(r.DaftarMahasiswaJson) ?? []) : [],
                        TanggalDiarsipkan = r.TanggalDiarsipkan
                    });
                }
            }

            var sortedRiwayat = riwayatBimbinganList.OrderByDescending(x => x.TanggalMulai).ToList();
            var sortedJadwal = jadwalBimbinganList.OrderBy(x => x.TanggalMulai).ToList();

            return Ok(new
            {
                pembimbing.Id,
                pembimbing.NIP,
                pembimbing.Nama,
                user = pembimbing.User != null ? new
                {
                    pembimbing.User.Id,
                    pembimbing.User.Name,
                    pembimbing.User.Role
                } : null,
                daftarStase = staseDiampu.Select(s => s.Nama).ToList(),
                koordinatorStase = staseKoordinator.Select(s => s.Nama).ToList(),
                daftarStaseDetail = staseDiampu,
                koordinatorStaseDetail = staseKoordinator,
                jadwalBimbingan = sortedJadwal,
                riwayatBimbingan = sortedRiwayat,
                statistik = new
                {
                    totalStaseDiampu = staseDiampu.Count,
                    totalKoordinatorStase = staseKoordinator.Count,
                    totalBimbinganAktif,
                    totalBimbinganMendatang,
                    totalBimbinganSelesai = riwayatBimbinganList.Count
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = ex.Message,
                stack = ex.StackTrace
            });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var daftarPembimbing = await _pembimbingRepository.GetAll();
        var semuaStase = await _staseRepository.GetAll();

        return Ok(daftarPembimbing.Select(x => new
        {
            x.Id,
            x.NIP,
            x.Nama,
            daftarStase = x.DaftarStase.Select(s => s.Nama).ToList(),
            koordinatorStase = semuaStase.Where(s => s.Koordinator?.Id == x.Id).Select(s => s.Nama).ToList()
        }));
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Create(CreatePembimbing create)
    {
        if (await _pembimbingRepository.IsExist(create.NIP))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nip"] = $"NIP '{create.NIP}' sudah digunakan"});

        if (await _userRepository.IsExist(create.NIP))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nip"] = $"Akun dengan user name '{create.NIP}' sudah digunakan" });

        var pembimbing = new Pembimbing
        {
            NIP = create.NIP,
            Nama = create.Nama,
        };

        var user = new User
        {
            Name = create.NIP,
            PasswordHash = _passwordHasher.HashPassword(null, create.NIP),
            Role = UserRoles.Dosen,
            Pembimbing = pembimbing,
        };

        pembimbing.User = user;

        _pembimbingRepository.Add(pembimbing);
        _userRepository.Add(user);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return Created(
            $"/api/pembimbing/{pembimbing.Id}",
            new
            {
                pembimbing.Id,
                pembimbing.NIP,
                pembimbing.Nama,
                daftarStase = new List<string>(),
                koordinatorStase = new List<string>()
            });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Update(int id, UpdatePembimbing update)
    {
        if (id != update.Id) return BadRequest();

        var pembimbing = await _pembimbingRepository.Get(id);
        if (pembimbing is null) return NotFound();

        if (await _pembimbingRepository.IsExist(update.NIP, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nip"] = $"NIP '{update.NIP}' sudah digunakan" });


        if (await _userRepository.IsExist(update.NIP, pembimbing.User.Id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nip"] = $"Akun dengan user name '{update.NIP}' sudah digunakan" });

        pembimbing.NIP = update.NIP;
        pembimbing.Nama = update.Nama;
        pembimbing.User.Name = update.NIP;
        pembimbing.User.PasswordHash = _passwordHasher.HashPassword(pembimbing.User, update.NIP);

        _pembimbingRepository.Update(pembimbing);
        _userRepository.Update(pembimbing.User);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var pembimbing = await _pembimbingRepository.Get(id);
        if (pembimbing is null) return NotFound();

        _pembimbingRepository.Delete(pembimbing);
        _userRepository.Delete(pembimbing.User);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Pengelola}")]
    [HttpPost("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetUserPasswordDto dto)
    {
        var pembimbing = await _pembimbingRepository.Get(id);
        if (pembimbing is null) return NotFound();

        var newPassword = string.IsNullOrWhiteSpace(dto.Password) ? "12345" : dto.Password.Trim();
        if (newPassword.Length < 5)
        {
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["password"] = "Password minimal 5 karakter" });
        }

        var user = pembimbing.User;
        if (user is null)
        {
            user = await _userRepository.GetByName(pembimbing.NIP);
            if (user is null)
            {
                return HelpersFunctions.NotFound(new Dictionary<string, string> { ["user"] = "Akun pengguna dosen tidak ditemukan" });
            }
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
        _userRepository.Update(user);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return Ok(new { message = $"Password untuk dosen '{pembimbing.Nama}' berhasil direset.", defaultUsed = string.IsNullOrWhiteSpace(dto.Password) });
    }
}

public class JadwalBimbinganItemDto
{
    public int Id { get; set; }
    public int IdKelompok { get; set; }
    public string NamaKelompok { get; set; } = string.Empty;
    public string? TahunAjaran { get; set; }
    public int? IdStase { get; set; }
    public string? NamaStase { get; set; }
    public int? JumlahHari { get; set; }
    public DateOnly TanggalMulai { get; set; }
    public DateOnly TanggalSelesai { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Peran { get; set; } = string.Empty;
    public string? SubStaseInfo { get; set; }
    public List<MahasiswaRingkasItemDto> DaftarMahasiswa { get; set; } = [];
}

public class MahasiswaRingkasItemDto
{
    public int Id { get; set; }
    public string NIM { get; set; } = string.Empty;
    public string Nama { get; set; } = string.Empty;
}

public class RiwayatBimbinganItemDto
{
    public int Id { get; set; }
    public int IdJadwalAsal { get; set; }
    public string NamaKelompok { get; set; } = string.Empty;
    public string TahunAjaran { get; set; } = string.Empty;
    public string NamaStase { get; set; } = string.Empty;
    public DateOnly TanggalMulai { get; set; }
    public DateOnly TanggalSelesai { get; set; }
    public string Peran { get; set; } = string.Empty;
    public string? SubStaseInfo { get; set; }
    public string? NamaPembimbing { get; set; }
    public string? NipPembimbing { get; set; }
    public List<SubStaseDto> DaftarSubStase { get; set; } = [];
    public List<MahasiswaDto> DaftarMahasiswa { get; set; } = [];
    public DateTime TanggalDiarsipkan { get; set; }
}
