using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.MahasiswaModels;
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
    private readonly IMahasiswaAccessService _mahasiswaAccessService;
    private readonly SiadiknonaApi _siadiknonaApi;

    private static readonly JsonSerializerOptions CaseInsensitiveJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

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
        IMahasiswaAccessService mahasiswaAccessService,
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
        _mahasiswaAccessService = mahasiswaAccessService;
        _siadiknonaApi = siadiknonaApi;
    }

    [HttpGet("me/akses")]
    [Authorize(Roles = UserRoles.Mahasiswa)]
    public async Task<IActionResult> GetMyAccess()
    {
        await _autoArchiveService.AutoArchiveCompletedSchedulesAsync();
        var access = await _mahasiswaAccessService.EvaluateByUsernameAsync(User?.Identity?.Name);
        if (access is null) return NotFound();
        return Ok(access);
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
            .Where(m => !string.IsNullOrWhiteSpace(m.NIM))
            .GroupBy(m => m.NIM.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var existingByEmail = existingMahasiswaList
            .Where(m => !string.IsNullOrWhiteSpace(m.Email))
            .GroupBy(m => m.Email!.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var existingUsersByName = (await _userRepository.GetAll())
            .Where(u => !string.IsNullOrWhiteSpace(u.Name))
            .GroupBy(u => u.Name.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

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
            var email = attr.email?.Trim().ToLowerInvariant() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(nim) || string.IsNullOrWhiteSpace(nama) ||
                string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            {
                jumlahItem++;
                jumlahGagal++;
                errors.Add($"Data mahasiswa tidak lengkap (NIM: '{attr.nim}', Nama: '{attr.nama}', Email: '{attr.email}').");
                continue;
            }

            if (!seenNims.Add(nim))
                continue;

            jumlahItem++;

            if (existingByNim.TryGetValue(nim, out var existing))
            {
                var namaBerubah = !string.Equals(existing.Nama, nama, StringComparison.Ordinal);
                var tahunAjaranBerubah = existing.TahunAjaran?.Id != targetTa.Id;
                var emailBerubah = !string.Equals(existing.Email, email, StringComparison.OrdinalIgnoreCase);
                var userBerubah = existing.User is not null && !string.Equals(existing.User.Name, email, StringComparison.OrdinalIgnoreCase);

                if (emailBerubah || userBerubah)
                {
                    if (existingByEmail.TryGetValue(email, out var otherMhs) && otherMhs.Id != existing.Id)
                    {
                        jumlahGagal++;
                        errors.Add($"NIM '{nim}' ({nama}): email '{email}' sudah dipakai oleh mahasiswa lain ({otherMhs.NIM}).");
                        continue;
                    }

                    if (existingUsersByName.TryGetValue(email, out var otherUser) && otherUser.Id != existing.User?.Id)
                    {
                        jumlahGagal++;
                        errors.Add($"NIM '{nim}' ({nama}): email/username '{email}' sudah dipakai akun lain (role: {otherUser.Role}).");
                        continue;
                    }
                }

                if (namaBerubah || tahunAjaranBerubah || emailBerubah || userBerubah)
                {
                    if (!string.IsNullOrWhiteSpace(existing.Email) &&
                        !string.Equals(existing.Email, email, StringComparison.OrdinalIgnoreCase))
                    {
                        existingByEmail.Remove(existing.Email.Trim());
                    }

                    existing.Nama = nama;
                    existing.Email = email;
                    existing.TahunAjaran = targetTa;
                    _mahasiswaRepository.Update(existing);
                    existingByEmail[email] = existing;

                    if (existing.User is not null && userBerubah)
                    {
                        if (!string.IsNullOrWhiteSpace(existing.User.Name))
                        {
                            existingUsersByName.Remove(existing.User.Name.Trim());
                        }
                        existing.User.Name = email;
                        _userRepository.Update(existing.User);
                        existingUsersByName[email] = existing.User;
                    }

                    jumlahUpdate++;
                }
                else
                {
                    jumlahTidakBerubah++;
                }
            }
            else
            {
                if (existingByEmail.TryGetValue(email, out var conflictMhs))
                {
                    jumlahGagal++;
                    errors.Add($"NIM '{nim}' ({nama}): email '{email}' sudah terdaftar pada mahasiswa lain ({conflictMhs.NIM}).");
                    continue;
                }

                if (existingUsersByName.TryGetValue(email, out var existingUser))
                {
                    jumlahGagal++;
                    errors.Add($"NIM '{nim}' ({nama}): email/username '{email}' sudah dipakai oleh akun lain (role: {existingUser.Role}).");
                    continue;
                }

                var user = new User
                {
                    Name = email,
                    PasswordHash = _passwordHasher.HashPassword(null!, nim),
                    Role = UserRoles.Mahasiswa
                };

                var mahasiswa = new Mahasiswa
                {
                    NIM = nim,
                    Nama = nama,
                    Email = email,
                    User = user,
                    TahunAjaran = targetTa
                };

                user.Mahasiswa = mahasiswa;

                _mahasiswaRepository.Add(mahasiswa);
                _userRepository.Add(user);

                existingByNim[nim] = mahasiswa;
                existingByEmail[email] = mahasiswa;
                existingUsersByName[email] = user;
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
            var currentName = User?.Identity?.Name?.Trim();
            var isOwner = !string.IsNullOrWhiteSpace(currentName) && (
                string.Equals(mahasiswa.User?.Name, currentName, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(mahasiswa.Email, currentName, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(mahasiswa.NIM, currentName, StringComparison.OrdinalIgnoreCase));
            if (!isOwner) return Forbid();
        }

        // Jalankan pengarsipan otomatis agar jadwal yang lewat terarsip
        await _autoArchiveService.AutoArchiveCompletedSchedulesAsync();

        bool canViewJadwalDanKelompok = true;
        if (User.IsInRole(UserRoles.Mahasiswa))
        {
            var access = await _mahasiswaAccessService.EvaluateAsync(mahasiswa);
            canViewJadwalDanKelompok = access.CanViewJadwalDanKelompok;
        }

        var today = DateOnly.FromDateTime(DateTime.Today);

        // Ambil detail kelompok aktif saat ini jika mahasiswa terdaftar di kelompok dan masih berhak mengakses
        object? kelompokDetail = null;
        int totalStaseSedangBerjalan = 0;
        int totalStaseMendatang = 0;

        if (canViewJadwalDanKelompok && mahasiswa.Kelompok != null)
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
                var mhsList = JsonSerializer.Deserialize<List<MahasiswaDto>>(r.DaftarMahasiswaJson, CaseInsensitiveJsonOptions);
                return mhsList != null && mhsList.Any(m => string.Equals(m.NIM, mahasiswa.NIM, StringComparison.OrdinalIgnoreCase));
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
            daftarSubStase = JsonSerializer.Deserialize<List<SubStaseDto>>(r.DaftarSubStaseJson, CaseInsensitiveJsonOptions) ?? [],
            daftarMahasiswa = JsonSerializer.Deserialize<List<MahasiswaDto>>(r.DaftarMahasiswaJson, CaseInsensitiveJsonOptions) ?? [],
            r.TanggalDiarsipkan
        }).ToList();

        int totalStaseSelesai = studentRiwayat.Count;

        return Ok(new
        {
            mahasiswa.Id,
            mahasiswa.NIM,
            mahasiswa.Nama,
            mahasiswa.Email,
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
        var allMahasiswa = await _mahasiswaRepository.GetAll();

        if (User.IsInRole(UserRoles.Mahasiswa))
        {
            var access = await _mahasiswaAccessService.EvaluateByUsernameAsync(User?.Identity?.Name);
            if (access is null) return Forbid();

            if (!access.CanViewJadwalDanKelompok)
            {
                return Ok(allMahasiswa
                    .Where(m => m.Id == access.MahasiswaId || string.Equals(m.NIM, access.Nim, StringComparison.OrdinalIgnoreCase))
                    .Select(ToResponse));
            }

            var today = DateOnly.FromDateTime(DateTime.Today);
            var activeTaIds = await _mahasiswaAccessService.GetActiveTahunAjaranIdsAsync(today);
            return Ok(allMahasiswa
                .Where(m =>
                {
                    var ta = m.TahunAjaran ?? m.Kelompok?.TahunAjaran;
                    if (ta is not null)
                        return ta.IsAktif(today) || activeTaIds.Contains(ta.Id);
                    return m.Kelompok?.IdTahunAjaran.HasValue == true && activeTaIds.Contains(m.Kelompok.IdTahunAjaran.Value);
                })
                .Select(ToResponse));
        }

        return Ok(allMahasiswa.Select(ToResponse));
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Create(CreateMahasiswa create)
    {
        var nim = create.NIM.Trim();
        var email = create.Email.Trim().ToLowerInvariant();

        if (await _mahasiswaRepository.IsExist(nim))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nim"] = $"NIM '{nim}' sudah digunakan" });

        if (await _mahasiswaRepository.IsEmailExist(email))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["email"] = $"Email '{email}' sudah digunakan" });

        if (await _userRepository.IsExist(email))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["email"] = $"Akun dengan email/username '{email}' sudah digunakan" });

        var tahunAjaran = await _tahunAjaranRepository.Get(create.IdTahunAjaran);
        if (tahunAjaran is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string>
            {
                ["idTahunAjaran"] = $"Tahun ajaran dengan id '{create.IdTahunAjaran}' tidak ditemukan"
            });

        var user = new User
        {
            Name = email,
            PasswordHash = _passwordHasher.HashPassword(null!, nim),
            Role = UserRoles.Mahasiswa
        };

        var mahasiswa = new Mahasiswa
        {
            NIM = nim,
            Nama = create.Nama.Trim(),
            Email = email,
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

        var nim = update.NIM.Trim();
        var email = update.Email.Trim().ToLowerInvariant();

        if (await _mahasiswaRepository.IsExist(nim, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nim"] = $"NIM '{nim}' sudah digunakan" });

        if (await _mahasiswaRepository.IsEmailExist(email, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["email"] = $"Email '{email}' sudah digunakan" });

        if (await _userRepository.IsExist(email, mahasiswa.User.Id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["email"] = $"Akun dengan email/username '{email}' sudah digunakan" });

        var tahunAjaran = await _tahunAjaranRepository.Get(update.IdTahunAjaran);
        if (tahunAjaran is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string>
            {
                ["idTahunAjaran"] = $"Tahun ajaran dengan id '{update.IdTahunAjaran}' tidak ditemukan"
            });

        mahasiswa.Nama = update.Nama.Trim();
        mahasiswa.NIM = nim;
        mahasiswa.Email = email;
        mahasiswa.TahunAjaran = tahunAjaran;
        mahasiswa.User.Name = email;

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
            mahasiswa.Email,
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

    [Authorize(Roles = UserRoles.Admin)]
    [HttpPost("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id)
    {
        var mahasiswa = await _mahasiswaRepository.Get(id);
        if (mahasiswa is null) return NotFound();

        const string defaultPassword = "123456";

        var user = mahasiswa.User;
        if (user is null && !string.IsNullOrWhiteSpace(mahasiswa.Email))
        {
            user = await _userRepository.GetByName(mahasiswa.Email);
        }
        if (user is null)
        {
            user = await _userRepository.GetByName(mahasiswa.NIM);
            if (user is null)
            {
                return HelpersFunctions.NotFound(new Dictionary<string, string> { ["user"] = "Akun pengguna mahasiswa tidak ditemukan" });
            }
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, defaultPassword);
        _userRepository.Update(user);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return Ok(new { message = $"Password untuk mahasiswa '{mahasiswa.Nama}' berhasil direset ke 123456." });
    }
}

