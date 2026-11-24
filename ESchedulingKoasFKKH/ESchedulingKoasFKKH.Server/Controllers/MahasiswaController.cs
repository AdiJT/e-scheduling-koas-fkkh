using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.MahasiswaModels;
using ESchedulingKoasFKKH.Server.Models.UserModels;
using ESchedulingKoasFKKH.Server.Services;
using ESchedulingKoasFKKH.Server.Services.Api;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/mahasiswa")]
[Authorize]
public class MahasiswaController : ControllerBase
{
    private readonly IMahasiswaRepository _mahasiswaRepository;
    private readonly ITahunAjaranRepository _tahunAjaranRepository;
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IRiwayatKelompokRepository _riwayatKelompokRepository;
    private readonly IHariLiburService _hariLiburService;
    private readonly IAutoArchiveService _autoArchiveService;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly SiadiknonaApi _siadiknonaApi;

    public MahasiswaController(
        IMahasiswaRepository mahasiswaRepository,
        ITahunAjaranRepository tahunAjaranRepository,
        IKelompokRepository kelompokRepository,
        IRiwayatKelompokRepository riwayatKelompokRepository,
        IHariLiburService hariLiburService,
        IAutoArchiveService autoArchiveService,
        IUnitOfWork unitOfWork,
        IUserRepository userRepository,
        IPasswordHasher<User> passwordHasher,
        SiadiknonaApi siadiknonaApi)
    {
        _mahasiswaRepository = mahasiswaRepository;
        _tahunAjaranRepository = tahunAjaranRepository;
        _kelompokRepository = kelompokRepository;
        _riwayatKelompokRepository = riwayatKelompokRepository;
        _hariLiburService = hariLiburService;
        _autoArchiveService = autoArchiveService;
        _unitOfWork = unitOfWork;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _siadiknonaApi = siadiknonaApi;
    }

    [HttpPost("sinkron-siadiknona")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> SinkronSiadiknona(
        [FromQuery] int? idTahunAjaran = null,
        CancellationToken cancellationToken = default)
    {
        TahunAjaran? targetTa;
        if (idTahunAjaran.HasValue && idTahunAjaran.Value > 0)
        {
            targetTa = await _tahunAjaranRepository.Get(idTahunAjaran.Value);
            if (targetTa is null)
            {
                return HelpersFunctions.NotFound(new Dictionary<string, string>
                {
                    ["idTahunAjaran"] = $"Tahun ajaran dengan id '{idTahunAjaran.Value}' tidak ditemukan"
                });
            }
        }
        else
        {
            var semuaTahunAjaran = (await _tahunAjaranRepository.GetAll())
                .OrderByDescending(t => t.Tahun)
                .ThenByDescending(t => t.Semester)
                .ThenByDescending(t => t.TanggalMulai)
                .ToList();
            var today = DateOnly.FromDateTime(DateTime.Today);
            targetTa = semuaTahunAjaran.FirstOrDefault(t => t.IsAktif(today))
                ?? semuaTahunAjaran.FirstOrDefault(t => t.Status == StatusTahunAjaran.Berjalan)
                ?? semuaTahunAjaran.FirstOrDefault();

            if (targetTa is null)
            {
                return HelpersFunctions.BadRequest(new Dictionary<string, string>
                {
                    ["idTahunAjaran"] = "Belum ada data Tahun Ajaran yang terdaftar di sistem."
                });
            }
        }

        var idPeriode = $"{targetTa.Tahun}{(int)targetTa.Semester}";
        var apiResult = await _siadiknonaApi.GetAllMahasiswaProfesiDokterHewanAktifAsync(idPeriode, cancellationToken);
        if (apiResult.IsFailure)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                message = apiResult.Error.Message
            });
        }

        var existingMahasiswaList = await _mahasiswaRepository.GetAll();
        var existingByNim = existingMahasiswaList
            .GroupBy(m => m.NIM, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var existingUsernames = new HashSet<string>(
            (await _userRepository.GetAll()).Select(u => u.Name),
            StringComparer.OrdinalIgnoreCase);

        var seenNims = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var errors = new List<string>();
        var jumlahItem = 0;
        var jumlahBaru = 0;
        var jumlahUpdate = 0;
        var jumlahTidakBerubah = 0;
        var jumlahGagal = 0;

        foreach (var item in apiResult.Value)
        {
            var attr = item.Attributes;
            if (attr is null || string.Equals(attr.is_deleted?.Trim(), "1", StringComparison.Ordinal))
                continue;

            var nim = attr.nim?.Trim() ?? string.Empty;
            var nama = attr.nama?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(nim) || string.IsNullOrWhiteSpace(nama))
            {
                jumlahItem++;
                jumlahGagal++;
                errors.Add("Terdapat data mahasiswa SIADIKNONA dengan NIM atau Nama kosong.");
                continue;
            }

            if (!seenNims.Add(nim))
                continue;

            jumlahItem++;

            if (existingByNim.TryGetValue(nim, out var existing))
            {
                var namaBerubah = !string.Equals(existing.Nama, nama, StringComparison.Ordinal);
                var tahunAjaranBerubah = existing.TahunAjaran?.Id != targetTa.Id;

                if (namaBerubah || tahunAjaranBerubah)
                {
                    existing.Nama = nama;
                    existing.TahunAjaran = targetTa;
                    _mahasiswaRepository.Update(existing);
                    jumlahUpdate++;
                }
                else
                {
                    jumlahTidakBerubah++;
                }
            }
            else
            {
                if (existingUsernames.Contains(nim))
                {
                    jumlahGagal++;
                    errors.Add($"NIM '{nim}' ({nama}): username '{nim}' sudah digunakan oleh akun lain.");
                    continue;
                }

                var user = new User
                {
                    Name = nim,
                    PasswordHash = _passwordHasher.HashPassword(null!, nim),
                    Role = UserRoles.Mahasiswa
                };

                var mahasiswa = new Mahasiswa
                {
                    NIM = nim,
                    Nama = nama,
                    User = user,
                    TahunAjaran = targetTa
                };

                user.Mahasiswa = mahasiswa;

                _mahasiswaRepository.Add(mahasiswa);
                _userRepository.Add(user);

                existingByNim[nim] = mahasiswa;
                existingUsernames.Add(nim);
                jumlahBaru++;
            }
        }

        if (jumlahBaru > 0 || jumlahUpdate > 0)
        {
            var saveResult = await _unitOfWork.SaveChangesAsync();
            if (saveResult.IsFailure)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Gagal menyimpan hasil sinkronisasi mahasiswa ke database."
                });
            }
        }

        return Ok(new SiadiknonaSyncResult
        {
            Success = true,
            IdTahunAjaran = targetTa.Id,
            TahunAjaran = $"{targetTa.Tahun} - {targetTa.Semester}",
            IdPeriode = idPeriode,
            KodeProdi = SiadiknonaApi.IdProgramStudiProfesiDokterHewan,
            NamaProdi = SiadiknonaApi.NamaProgramStudiProfesiDokterHewan,
            StatusMahasiswa = SiadiknonaApi.StatusMahasiswaAktif,
            JumlahItem = jumlahItem,
            JumlahBaru = jumlahBaru,
            JumlahUpdate = jumlahUpdate,
            JumlahTidakBerubah = jumlahTidakBerubah,
            JumlahGagal = jumlahGagal,
            Errors = errors
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var mahasiswa = await _mahasiswaRepository.Get(id);
        if (mahasiswa is null) return NotFound();

        if (!User.IsInRole(UserRoles.Admin) && !User.IsInRole(UserRoles.Pengelola) && !User.IsInRole(UserRoles.Dosen)) 
        {
            if (mahasiswa.NIM != User?.Identity?.Name) return Forbid();
        }

        // Jalankan pengarsipan otomatis agar jadwal yang lewat terarsip
        await _autoArchiveService.AutoArchiveCompletedSchedulesAsync();

        var today = DateOnly.FromDateTime(DateTime.Today);

        // Ambil detail kelompok aktif saat ini jika mahasiswa terdaftar di kelompok
        object? kelompokDetail = null;
        int totalStaseSedangBerjalan = 0;
        int totalStaseMendatang = 0;

        if (mahasiswa.Kelompok != null)
        {
            var kelompok = await _kelompokRepository.Get(mahasiswa.Kelompok.Id);
            if (kelompok != null)
            {
                var jadwals = (kelompok.DaftarJadwal ?? Enumerable.Empty<Jadwal>()).Select(j =>
                {
                    var tglSelesai = j.Stase != null ? j.TanggalSelesai(_hariLiburService) : j.TanggalMulai;
                    string status = tglSelesai < today ? "Selesai" : (j.TanggalMulai <= today && today <= tglSelesai ? "Sedang Berjalan" : "Mendatang");

                    if (status == "Sedang Berjalan") totalStaseSedangBerjalan++;
                    else if (status == "Mendatang") totalStaseMendatang++;

                    return new
                    {
                        j.Id,
                        j.TanggalMulai,
                        tanggalSelesai = tglSelesai,
                        status,
                        idStase = j.Stase?.Id,
                        namaStase = j.Stase?.Nama,
                        jumlahHari = j.Stase?.JumlahHari,
                        idPembimbing = j.Pembimbing?.Id,
                        namaPembimbing = j.Pembimbing?.Nama,
                        nipPembimbing = j.Pembimbing?.NIP,
                        daftarSubStase = (j.DaftarJadwalSubStase ?? Enumerable.Empty<JadwalSubStase>()).Select(sub => new
                        {
                            idSubStase = sub.SubStase?.Id,
                            namaSubStase = sub.SubStase?.Nama,
                            urutan = sub.SubStase?.Urutan,
                            idPembimbing = sub.Pembimbing?.Id,
                            namaPembimbing = sub.Pembimbing?.Nama,
                            nipPembimbing = sub.Pembimbing?.NIP
                        }).OrderBy(s => s.urutan).ToList()
                    };
                }).OrderBy(j => j.TanggalMulai).ToList();

                kelompokDetail = new
                {
                    kelompok.Id,
                    kelompok.Nama,
                    idTahunAjaran = kelompok.IdTahunAjaran,
                    tahunAjaran = kelompok.TahunAjaran != null ? $"{kelompok.TahunAjaran.Tahun} - {kelompok.TahunAjaran.Semester}" : null,
                    daftarAnggota = (kelompok.DaftarMahasiswa ?? Enumerable.Empty<Mahasiswa>()).Select(m => new
                    {
                        m.Id,
                        m.NIM,
                        m.Nama
                    }).ToList(),
                    daftarJadwal = jadwals
                };
            }
        }

        // Ambil riwayat stase dari RiwayatKelompok di mana mahasiswa ini ikut serta
        var allRiwayat = await _riwayatKelompokRepository.GetAll();
        var studentRiwayat = allRiwayat.Where(r =>
        {
            try
            {
                var mhsList = JsonSerializer.Deserialize<List<MahasiswaDto>>(r.DaftarMahasiswaJson);
                return mhsList != null && mhsList.Any(m => m.NIM == mahasiswa.NIM);
            }
            catch
            {
                return false;
            }
        }).OrderByDescending(r => r.TanggalMulai).Select(r => new
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
            daftarSubStase = JsonSerializer.Deserialize<List<SubStaseDto>>(r.DaftarSubStaseJson) ?? [],
            daftarMahasiswa = JsonSerializer.Deserialize<List<MahasiswaDto>>(r.DaftarMahasiswaJson) ?? [],
            r.TanggalDiarsipkan
        }).ToList();

        int totalStaseSelesai = studentRiwayat.Count;

        return Ok(new
        {
            mahasiswa.Id,
            mahasiswa.NIM,
            mahasiswa.Nama,
            idKelompok = mahasiswa.Kelompok?.Id,
            namaKelompok = mahasiswa.Kelompok?.Nama,
            kelompok = mahasiswa.Kelompok is null ? null : new
            {
                mahasiswa.Kelompok.Id,
                mahasiswa.Kelompok.Nama
            },
            idTahunAjaran = mahasiswa.TahunAjaran?.Id,
            tahunAjaran = mahasiswa.TahunAjaran is null ? null : new
            {
                mahasiswa.TahunAjaran.Id,
                mahasiswa.TahunAjaran.Tahun,
                semester = mahasiswa.TahunAjaran.Semester.ToString()
            },
            user = new
            {
                mahasiswa.User.Id,
                mahasiswa.User.Name,
                mahasiswa.User.Role
            },
            kelompokDetail,
            riwayatStase = studentRiwayat,
            statistik = new
            {
                totalStaseSelesai,
                totalStaseSedangBerjalan,
                totalStaseMendatang
            }
        });
    }

    [HttpGet]
    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Pengelola},{UserRoles.Dosen},{UserRoles.Mahasiswa}")]
    public async Task<IActionResult> GetAll()
    {
        return Ok((await _mahasiswaRepository.GetAll()).Select(ToResponse));
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Create(CreateMahasiswa create)
    {
        if (await _mahasiswaRepository.IsExist(create.NIM))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nim"] = $"NIM '{create.NIM}' sudah digunakan" });

        if (await _userRepository.IsExist(create.NIM))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nim"] = $"Akun dengan user name '{create.NIM}' sudah digunakan" });

        var tahunAjaran = await _tahunAjaranRepository.Get(create.IdTahunAjaran);
        if (tahunAjaran is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string>
            {
                ["idTahunAjaran"] = $"Tahun ajaran dengan id '{create.IdTahunAjaran}' tidak ditemukan"
            });

        var user = new User
        {
            Name = create.NIM,
            PasswordHash = _passwordHasher.HashPassword(null, create.NIM),
            Role = UserRoles.Mahasiswa
        };

        var mahasiswa = new Mahasiswa
        {
            NIM = create.NIM,
            Nama = create.Nama,
            User = user,
            TahunAjaran = tahunAjaran
        };

        user.Mahasiswa = mahasiswa;

        _mahasiswaRepository.Add(mahasiswa);
        _userRepository.Add(user);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return Created(
            $"/api/mahasiswa/{mahasiswa.Id}", 
            ToResponse(mahasiswa));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Update(int id, UpdateMahasiswa update)
    {
        if (update.Id != id) return BadRequest();

        var mahasiswa = await _mahasiswaRepository.Get(id);
        if (mahasiswa is null) return NotFound();

        if (await _mahasiswaRepository.IsExist(update.NIM, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nim"] = $"NIM '{update.NIM}' sudah digunakan" });

        if (await _userRepository.IsExist(update.NIM, mahasiswa.User.Id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nim"] = $"Akun dengan user name '{update.NIM}' sudah digunakan" });

        var tahunAjaran = await _tahunAjaranRepository.Get(update.IdTahunAjaran);
        if (tahunAjaran is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string>
            {
                ["idTahunAjaran"] = $"Tahun ajaran dengan id '{update.IdTahunAjaran}' tidak ditemukan"
            });

        mahasiswa.Nama = update.Nama;
        mahasiswa.NIM = update.NIM;
        mahasiswa.TahunAjaran = tahunAjaran;
        mahasiswa.User.Name = update.NIM;
        mahasiswa.User.PasswordHash = _passwordHasher.HashPassword(mahasiswa.User, update.NIM);

        _mahasiswaRepository.Update(mahasiswa);
        _userRepository.Update(mahasiswa.User);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var mahasiswa = await _mahasiswaRepository.Get(id);
        if (mahasiswa is null) return NotFound();

        _mahasiswaRepository.Delete(mahasiswa);
        _userRepository.Delete(mahasiswa.User);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    private static object ToResponse(Mahasiswa mahasiswa)
    {
        return new
        {
            mahasiswa.Id,
            mahasiswa.NIM,
            mahasiswa.Nama,
            idKelompok = mahasiswa.Kelompok?.Id,
            namaKelompok = mahasiswa.Kelompok?.Nama,
            kelompok = mahasiswa.Kelompok is null ? null : new
            {
                mahasiswa.Kelompok.Id,
                mahasiswa.Kelompok.Nama
            },
            idTahunAjaran = mahasiswa.TahunAjaran?.Id,
            tahunAjaran = mahasiswa.TahunAjaran is null ? null : new
            {
                mahasiswa.TahunAjaran.Id,
                mahasiswa.TahunAjaran.Tahun,
                semester = mahasiswa.TahunAjaran.Semester.ToString()
            },
            user = new
            {
                mahasiswa.User.Id,
                mahasiswa.User.Name,
                mahasiswa.User.Role
            }
        };
    }

    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Pengelola}")]
    [HttpPost("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetUserPasswordDto dto)
    {
        var mahasiswa = await _mahasiswaRepository.Get(id);
        if (mahasiswa is null) return NotFound();

        var newPassword = string.IsNullOrWhiteSpace(dto.Password) ? "12345" : dto.Password.Trim();
        if (newPassword.Length < 5)
        {
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["password"] = "Password minimal 5 karakter" });
        }

        var user = mahasiswa.User;
        if (user is null)
        {
            user = await _userRepository.GetByName(mahasiswa.NIM);
            if (user is null)
            {
                return HelpersFunctions.NotFound(new Dictionary<string, string> { ["user"] = "Akun pengguna mahasiswa tidak ditemukan" });
            }
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
        _userRepository.Update(user);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return Ok(new { message = $"Password untuk mahasiswa '{mahasiswa.Nama}' berhasil direset.", defaultUsed = string.IsNullOrWhiteSpace(dto.Password) });
    }
}

