using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.MahasiswaModels;
using ESchedulingKoasFKKH.Server.Models.UserModels;
using ESchedulingKoasFKKH.Server.Services;
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
    private readonly ExcelService _excelService;

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
        ExcelService excelService)
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
        _excelService = excelService;
    }

    [HttpGet("template")]
    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Pengelola}")]
    public async Task<IActionResult> DownloadTemplate()
    {
        var daftarTahunAjaran = await _tahunAjaranRepository.GetAll();
        var bytes = _excelService.GenerateMahasiswaTemplate(daftarTahunAjaran);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Template_Mahasiswa.xlsx");
    }

    [HttpGet("export")]
    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Pengelola}")]
    public async Task<IActionResult> Export([FromQuery] int? idTahunAjaran = null)
    {
        var daftarMahasiswa = await _mahasiswaRepository.GetAll();

        if (idTahunAjaran.HasValue && idTahunAjaran.Value > 0)
        {
            daftarMahasiswa = daftarMahasiswa.Where(m => m.TahunAjaran?.Id == idTahunAjaran.Value).ToList();
        }

        var data = daftarMahasiswa.Select(m => new MahasiswaExportDto
        {
            NIM = m.NIM,
            Nama = m.Nama,
            TahunAjaran = m.TahunAjaran != null ? $"{m.TahunAjaran.Tahun} - {m.TahunAjaran.Semester}" : "-",
            StatusTahunAjaran = m.TahunAjaran != null ? m.TahunAjaran.Status.ToString() : "-",
            Kelompok = m.Kelompok?.Nama ?? "-"
        }).ToList();

        var bytes = _excelService.ExportMahasiswa(data);
        var filename = $"Data_Mahasiswa_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    [HttpPost("import")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Import(IFormFile? file, [FromQuery] int? idTahunAjaran = null)
    {
        if (file == null || file.Length == 0)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["file"] = "File Excel wajib dipilih." });

        if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["file"] = "Format file harus berekstensi .xlsx" });

        using var stream = file.OpenReadStream();
        var rows = _excelService.ParseMahasiswa(stream, out var parseErrors);

        if (parseErrors.Count > 0 && rows.Count == 0)
        {
            return BadRequest(new ExcelImportResult
            {
                Success = false,
                TotalRows = 0,
                SuccessCount = 0,
                Errors = parseErrors
            });
        }

        var semuaTahunAjaran = await _tahunAjaranRepository.GetAll();
        TahunAjaran? defaultTahunAjaran = null;
        if (idTahunAjaran.HasValue && idTahunAjaran.Value > 0)
        {
            defaultTahunAjaran = semuaTahunAjaran.FirstOrDefault(t => t.Id == idTahunAjaran.Value);
        }
        defaultTahunAjaran ??= semuaTahunAjaran.FirstOrDefault(t => t.Status == StatusTahunAjaran.Berjalan)
                             ?? semuaTahunAjaran.FirstOrDefault();

        var existingNims = new HashSet<string>((await _mahasiswaRepository.GetAll()).Select(m => m.NIM), StringComparer.OrdinalIgnoreCase);
        var existingUsernames = new HashSet<string>((await _userRepository.GetAll()).Select(u => u.Name), StringComparer.OrdinalIgnoreCase);

        var errors = new List<string>(parseErrors);
        var successCount = 0;
        var fileNims = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var row in rows)
        {
            if (fileNims.Contains(row.NIM))
            {
                errors.Add($"Baris {row.RowIndex}: NIM '{row.NIM}' terduplikasi di dalam file yang diunggah.");
                continue;
            }
            fileNims.Add(row.NIM);

            if (existingNims.Contains(row.NIM))
            {
                errors.Add($"Baris {row.RowIndex}: NIM '{row.NIM}' sudah terdaftar di sistem.");
                continue;
            }

            if (existingUsernames.Contains(row.NIM))
            {
                errors.Add($"Baris {row.RowIndex}: Akun dengan username '{row.NIM}' sudah ada.");
                continue;
            }

            TahunAjaran? targetTa = defaultTahunAjaran;
            if (!string.IsNullOrWhiteSpace(row.TahunAjaran))
            {
                var match = semuaTahunAjaran.FirstOrDefault(t =>
                    $"{t.Tahun} - {t.Semester}".Equals(row.TahunAjaran, StringComparison.OrdinalIgnoreCase) ||
                    $"{t.Tahun} {t.Semester}".Equals(row.TahunAjaran, StringComparison.OrdinalIgnoreCase) ||
                    $"{t.Tahun}/{t.Semester}".Equals(row.TahunAjaran, StringComparison.OrdinalIgnoreCase));

                if (match != null)
                {
                    targetTa = match;
                }
                else
                {
                    errors.Add($"Baris {row.RowIndex}: Tahun ajaran '{row.TahunAjaran}' tidak ditemukan di database.");
                    continue;
                }
            }

            if (targetTa == null)
            {
                errors.Add($"Baris {row.RowIndex}: Tahun ajaran belum ditentukan atau tidak valid.");
                continue;
            }

            var user = new User
            {
                Name = row.NIM,
                PasswordHash = _passwordHasher.HashPassword(null, row.NIM),
                Role = UserRoles.Mahasiswa
            };

            var mahasiswa = new Mahasiswa
            {
                NIM = row.NIM,
                Nama = row.Nama,
                User = user,
                TahunAjaran = targetTa
            };

            user.Mahasiswa = mahasiswa;

            _mahasiswaRepository.Add(mahasiswa);
            _userRepository.Add(user);

            existingNims.Add(row.NIM);
            existingUsernames.Add(row.NIM);
            successCount++;
        }

        if (successCount > 0)
        {
            var result = await _unitOfWork.SaveChangesAsync();
            if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return Ok(new ExcelImportResult
        {
            Success = successCount > 0,
            TotalRows = rows.Count,
            SuccessCount = successCount,
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

