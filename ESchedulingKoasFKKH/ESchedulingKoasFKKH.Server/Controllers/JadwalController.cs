using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.JadwalModels;
using ESchedulingKoasFKKH.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/jadwal")]
[Authorize]
public class JadwalController : ControllerBase
{
    private readonly IJadwalRepository _jadwalRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IStaseRepository _staseRepository;
    private readonly IHariLiburService _hariLiburService;
    private readonly IJadwalAutoScheduler _jadwalAutoScheduler;
    private readonly IMahasiswaRepository _mahasiswaRepository;
    private readonly IPembimbingRepository _pembimbingRepository;
    private readonly ISubStaseRepository _subStaseRepository;
    private readonly IJadwalSubStaseRepository _jadwalSubStaseRepository;

    public JadwalController(
        IJadwalRepository jadwalRepository,
        IUnitOfWork unitOfWork,
        IKelompokRepository kelompokRepository,
        IStaseRepository staseRepository,
        IHariLiburService hariLiburService,
        IJadwalAutoScheduler jadwalAutoScheduler,
        IMahasiswaRepository mahasiswaRepository,
        IPembimbingRepository pembimbingRepository,
        ISubStaseRepository subStaseRepository,
        IJadwalSubStaseRepository jadwalSubStaseRepository)
    {
        _jadwalRepository = jadwalRepository;
        _unitOfWork = unitOfWork;
        _kelompokRepository = kelompokRepository;
        _staseRepository = staseRepository;
        _hariLiburService = hariLiburService;
        _jadwalAutoScheduler = jadwalAutoScheduler;
        _mahasiswaRepository = mahasiswaRepository;
        _pembimbingRepository = pembimbingRepository;
        _subStaseRepository = subStaseRepository;
        _jadwalSubStaseRepository = jadwalSubStaseRepository;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var jadwal = await _jadwalRepository.Get(id);
        if (jadwal is null) return NotFound();

        if (User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Pengelola) || User.IsInRole(UserRoles.Dosen))
            return Ok(ToResponse(jadwal));

        var mahasiswa = await _mahasiswaRepository.Get(User?.Identity?.Name!);
        if (mahasiswa is not null && mahasiswa.Kelompok?.Id == jadwal.Kelompok.Id)
            return Ok(ToResponse(jadwal));

        return Forbid();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(int? idKelompok = null, int? idStase = null)
    {
        var daftarjadwal = await _jadwalRepository.GetAll();

        if (User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Pengelola))
            return Ok(daftarjadwal
                .Where(x => (idKelompok is null || x.Kelompok.Id == idKelompok) && (idStase is null || x.Stase.Id == idStase))
                .Select(ToResponse));

        if (User.IsInRole(UserRoles.Dosen))
        {
            var pembimbing = await _pembimbingRepository.Get(User?.Identity?.Name!);
            if (pembimbing is not null)
                return Ok(daftarjadwal
                    .Where(x => 
                        (x.Pembimbing?.Id == pembimbing.Id || x.Kelompok.Pembimbing?.Id == pembimbing.Id || x.DaftarJadwalSubStase.Any(s => s.Pembimbing?.Id == pembimbing.Id)) && 
                        (idKelompok is null || x.Kelompok.Id == idKelompok) && 
                        (idStase is null || x.Stase.Id == idStase))
                    .Select(ToResponse));
        }

        var mahasiswa = await _mahasiswaRepository.Get(User?.Identity?.Name!);
        if (mahasiswa is not null)
            return Ok(daftarjadwal
                .Where(x => x.Kelompok.Id == mahasiswa.Kelompok?.Id && (idStase is null || x.Stase.Id == idStase))
                .Select(ToResponse));

        return Forbid();
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Create(CreateJadwal create)
    {
        var kelompok = await _kelompokRepository.Get(create.IdKelompok);
        if (kelompok is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string>
            {
                ["idKelompok"] = $"Kelompok dengan id '{create.IdKelompok}' tidak ditemukan"
            });

        var stase = await _staseRepository.Get(create.IdStase);
        if (stase is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string>
            {
                ["idStase"] = $"Stase dengan id '{create.IdStase}' tidak ditemukan"
            });

        if (kelompok.DaftarJadwal.Any(x => x.Stase.Id == stase.Id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["idStase"] = $"Kelompok '{kelompok.Nama}' sudah memiliki jadwal untuk stase '{stase.Nama}'"
            });

        // Cek stase Ujian setelah stase seminar dan stase seminar sudah dijadwalkan
        if (stase.Jenis == JenisStase.Ujian)
        {
            var jadwalSeminar = kelompok.DaftarJadwal.FirstOrDefault(x => x.Stase.Jenis == JenisStase.Seminar);

            if (jadwalSeminar is null)
                return HelpersFunctions.BadRequest(new Dictionary<string, string>
                {
                    ["idStase"] = $"Kelompok '{kelompok.Nama}' harus dijadwalkan untuk stase '{JenisStase.Seminar}' terlebih dahulu."
                });

            if (jadwalSeminar.TanggalSelesai(_hariLiburService) > create.TanggalMulai)
                return HelpersFunctions.BadRequest(new Dictionary<string, string>
                {
                    ["tanggalMulai"] = $"Jadwal {JenisStase.Ujian} tidak boleh sebelum stase " +
                    $"'{JenisStase.Seminar}' selesai pada tanggal {jadwalSeminar.TanggalSelesai(_hariLiburService):M/d/yyyy}."
                });
        }

        // Cek stase Seminar setelah semua stase telah dilakukan dan dijadwalkan terakhir
        if (stase.Jenis == JenisStase.Seminar)
        {
            var daftarStase = (await _staseRepository.GetAll()).Where(x => x.Jenis == JenisStase.Terpisah || x.Jenis == JenisStase.Bersamaan);
            var jadwalTerakhir = kelompok.DaftarJadwal.OrderBy(x => x.TanggalMulai).LastOrDefault();
            if (daftarStase.Any(s => kelompok.DaftarJadwal.FirstOrDefault(y => y.Stase.Id == s.Id) == null) || jadwalTerakhir is null)
                return HelpersFunctions.BadRequest(new Dictionary<string, string>
                {
                    ["idStase"] = $"Kelompok '{kelompok.Nama}' harus dijadwalkan untuk semua " +
                    $"stase {JenisStase.Terpisah} dan {JenisStase.Bersamaan} terlebih dahulu."
                });

            if (create.TanggalMulai <= jadwalTerakhir.TanggalSelesai(_hariLiburService))
                return HelpersFunctions.BadRequest(new Dictionary<string, string>
                {
                    ["tanggalMulai"] = $"Jadwal {JenisStase.Seminar} harus dijadwalkan setelah jadwal terakhir pada " +
                    $"tanggal {jadwalTerakhir.TanggalSelesai(_hariLiburService):M/d/yyyy}"
                });
        }

        // Cek bukan hari libur
        if (_hariLiburService.HariLibur(create.TanggalMulai))
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["tanggalMulai"] = $"Tanggal {create.TanggalMulai} merupakan hari libur"
            });

        // Cek apakah jadwal bertabrakan
        var tabrakanKelompok = kelompok.DaftarJadwal.FirstOrDefault(x => create.TanggalMulai >= x.TanggalMulai && create.TanggalMulai <= x.TanggalSelesai(_hariLiburService));
        if (tabrakanKelompok is not null)
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["tanggalMulai"] = $"Jadwal bertabrakan. Kelompok '{kelompok.Nama}' memiliki jadwal pada tanggal " +
                $"{tabrakanKelompok.TanggalMulai:M/d/yyyy} - {tabrakanKelompok.TanggalSelesai(_hariLiburService):M/d/yyyy}"
            });

        if (stase.Jenis == JenisStase.Terpisah)
        {
            var tabrakanStase = stase.DaftarJadwal.FirstOrDefault(x => create.TanggalMulai >= x.TanggalMulai && create.TanggalMulai <= x.TanggalSelesai(_hariLiburService));
            if (tabrakanStase is not null)
                return HelpersFunctions.BadRequest(new Dictionary<string, string>
                {
                    ["tanggalMulai"] = $"Jadwal bertabrakan. Stase '{stase.Nama}' dijadwalkan untuk kelompok lain pada tanggal " +
                    $"{tabrakanStase.TanggalMulai:M/d/yyyy} - {tabrakanStase.TanggalSelesai(_hariLiburService):M/d/yyyy}"
                });
        }

        Pembimbing? pembimbingStase = null;
        if (create.IdPembimbing.HasValue)
        {
            pembimbingStase = await _pembimbingRepository.Get(create.IdPembimbing.Value);
        }

        var jadwal = new Jadwal
        {
            TanggalMulai = create.TanggalMulai,
            Kelompok = kelompok,
            Stase = stase,
            Pembimbing = pembimbingStase
        };

        // Jika stase memiliki sub-stase (seperti Kodil)
        var subStaseList = await _subStaseRepository.GetByStase(stase.Id);
        if (subStaseList.Count > 0)
        {
            foreach (var sub in subStaseList)
            {
                Pembimbing? pembimbingSub = null;
                var requestSub = create.DaftarSubStasePembimbing?.FirstOrDefault(x => x.IdSubStase == sub.Id);
                if (requestSub?.IdPembimbing.HasValue == true)
                {
                    pembimbingSub = await _pembimbingRepository.Get(requestSub.IdPembimbing.Value);
                }
                else if (sub.DefaultPembimbing is not null)
                {
                    pembimbingSub = sub.DefaultPembimbing;
                }

                jadwal.DaftarJadwalSubStase.Add(new JadwalSubStase
                {
                    Jadwal = jadwal,
                    SubStase = sub,
                    Pembimbing = pembimbingSub
                });
            }
        }

        _jadwalRepository.Add(jadwal);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return CreatedAtAction(
            nameof(Get),
            new { id = jadwal.Id },
            ToResponse(jadwal));
    }

    [HttpPost("generate")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Generate(GenerateJadwalOtomatis? generate, CancellationToken cancellationToken)
    {
        var result = await _jadwalAutoScheduler.GenerateAsync(generate?.TanggalMulai, cancellationToken);
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Generate jadwal otomatis gagal.",
                errors = result.Errors.Select(x => x.Message),
            });

        return Ok(result.Value);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Update(int id, UpdateJadwal update)
    {
        var jadwal = await _jadwalRepository.Get(id);
        if (jadwal is null) return NotFound();

        var kelompok = await _kelompokRepository.Get(jadwal.Kelompok.Id);
        if (kelompok is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string>
            {
                ["idKelompok"] = $"Kelompok dengan id '{jadwal.Kelompok.Id}' tidak ditemukan"
            });

        var stase = await _staseRepository.Get(jadwal.Stase.Id);
        if (stase is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string>
            {
                ["idStase"] = $"Stase dengan id '{jadwal.Stase.Id}' tidak ditemukan"
            });

        var blockingErrors = ValidasiEditJadwalPenting(jadwal, kelompok, stase, update.TanggalMulai);
        if (blockingErrors.Count > 0)
            return HelpersFunctions.BadRequest(blockingErrors);

        var warnings = ValidasiEditJadwalPeringatan(jadwal, kelompok, stase, update.TanggalMulai);
        if (warnings.Count > 0 && !update.KonfirmasiOverride)
            return HelpersFunctions.Conflict(
                warnings,
                "Tanggal baru melanggar beberapa rule penjadwalan. Centang konfirmasi jika Anda tetap ingin menyimpan perubahan.");

        jadwal.TanggalMulai = update.TanggalMulai;
        jadwal.Kelompok = kelompok;
        jadwal.Stase = stase;

        if (update.IdPembimbing.HasValue)
        {
            jadwal.Pembimbing = await _pembimbingRepository.Get(update.IdPembimbing.Value);
        }

        // Update SubStase Pembimbing jika ada
        if (update.DaftarSubStasePembimbing is not null && update.DaftarSubStasePembimbing.Count > 0)
        {
            foreach (var item in update.DaftarSubStasePembimbing)
            {
                var existingSub = jadwal.DaftarJadwalSubStase.FirstOrDefault(x => x.SubStase.Id == item.IdSubStase);
                Pembimbing? p = item.IdPembimbing.HasValue ? await _pembimbingRepository.Get(item.IdPembimbing.Value) : null;

                if (existingSub is not null)
                {
                    existingSub.Pembimbing = p;
                }
                else
                {
                    var subStaseObj = await _subStaseRepository.Get(item.IdSubStase);
                    if (subStaseObj is not null)
                    {
                        jadwal.DaftarJadwalSubStase.Add(new JadwalSubStase
                        {
                            Jadwal = jadwal,
                            SubStase = subStaseObj,
                            Pembimbing = p
                        });
                    }
                }
            }
        }

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        var responseObj = (IDictionary<string, object?>)new System.Dynamic.ExpandoObject();
        var baseRes = ToResponse(jadwal);
        foreach (var prop in baseRes.GetType().GetProperties())
        {
            responseObj[prop.Name] = prop.GetValue(baseRes, null);
        }
        responseObj["overrideDigunakan"] = warnings.Count > 0;

        return Ok(responseObj);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var jadwal = await _jadwalRepository.Get(id);
        if (jadwal is null) return NotFound();

        _jadwalRepository.Delete(jadwal);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("all")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> DeleteAll()
    {
        await _jadwalRepository.DeleteAll();
        return NoContent();
    }

    private object ToResponse(Jadwal j)
    {
        var pembimbing = j.Pembimbing ?? j.Kelompok?.Pembimbing;
        return new
        {
            j.Id,
            j.TanggalMulai,
            tanggalSelesai = j.TanggalSelesai(_hariLiburService),
            idStase = j.Stase.Id,
            namaStase = j.Stase.Nama,
            idKelompok = j.Kelompok.Id,
            namaKelompok = j.Kelompok.Nama,
            idPembimbing = pembimbing?.Id,
            namaPembimbing = pembimbing?.Nama,
            nipPembimbing = pembimbing?.NIP,
            daftarSubStase = j.DaftarJadwalSubStase?.OrderBy(s => s.SubStase.Urutan).Select(s => new
            {
                idSubStase = s.SubStase.Id,
                namaSubStase = s.SubStase.Nama,
                urutan = s.SubStase.Urutan,
                idPembimbing = s.Pembimbing?.Id,
                namaPembimbing = s.Pembimbing?.Nama,
                nipPembimbing = s.Pembimbing?.NIP
            }) ?? []
        };
    }

    private Dictionary<string, string> ValidasiEditJadwalPenting(Jadwal jadwal, Kelompok kelompok, Stase stase, DateOnly tanggalMulaiBaru)
    {
        var errors = new Dictionary<string, string>();
        var tanggalSelesaiBaru = HitungTanggalSelesai(tanggalMulaiBaru, stase);

        if (stase.Jenis == JenisStase.Terpisah)
        {
            var tabrakanStase = stase.DaftarJadwal
                .Where(x => x.Id != jadwal.Id)
                .FirstOrDefault(x => ApakahBertabrakan(
                    tanggalMulaiBaru,
                    tanggalSelesaiBaru,
                    x.TanggalMulai,
                    x.TanggalSelesai(_hariLiburService)));

            if (tabrakanStase is not null)
            {
                errors["tanggalMulai"] =
                    $"Perubahan ditolak. Stase terpisah '{stase.Nama}' sudah dipakai kelompok '{tabrakanStase.Kelompok.Nama}' pada " +
                    $"{tabrakanStase.TanggalMulai:M/d/yyyy} - {tabrakanStase.TanggalSelesai(_hariLiburService):M/d/yyyy}.";
            }
        }

        return errors;
    }

    private Dictionary<string, string> ValidasiEditJadwalPeringatan(Jadwal jadwal, Kelompok kelompok, Stase stase, DateOnly tanggalMulaiBaru)
    {
        var warnings = new Dictionary<string, string>();
        var tanggalSelesaiBaru = HitungTanggalSelesai(tanggalMulaiBaru, stase);

        if (_hariLiburService.HariLibur(tanggalMulaiBaru))
        {
            warnings["hariLibur"] = $"Tanggal {tanggalMulaiBaru:M/d/yyyy} merupakan hari libur.";
        }

        var tabrakanKelompok = kelompok.DaftarJadwal
            .Where(x => x.Id != jadwal.Id)
            .FirstOrDefault(x => ApakahBertabrakan(
                tanggalMulaiBaru,
                tanggalSelesaiBaru,
                x.TanggalMulai,
                x.TanggalSelesai(_hariLiburService)));

        if (tabrakanKelompok is not null)
        {
            warnings["tabrakanKelompok"] =
                $"Kelompok '{kelompok.Nama}' sudah memiliki stase '{tabrakanKelompok.Stase.Nama}' pada " +
                $"{tabrakanKelompok.TanggalMulai:M/d/yyyy} - {tabrakanKelompok.TanggalSelesai(_hariLiburService):M/d/yyyy}.";
        }

        if (IsUjian(stase))
        {
            var jadwalSeminar = kelompok.DaftarJadwal
                .Where(x => x.Id != jadwal.Id)
                .FirstOrDefault(x => IsSeminar(x.Stase));

            if (jadwalSeminar is null)
            {
                warnings["seminar"] = $"Kelompok '{kelompok.Nama}' belum memiliki jadwal Seminar sebelum '{stase.Nama}'.";
            }
            else if (jadwalSeminar.TanggalSelesai(_hariLiburService) > tanggalMulaiBaru)
            {
                warnings["seminar"] =
                    $"Stase '{stase.Nama}' dimulai sebelum Seminar selesai pada {jadwalSeminar.TanggalSelesai(_hariLiburService):M/d/yyyy}.";
            }
        }

        if (IsSeminar(stase))
        {
            var ujianLebihAwal = kelompok.DaftarJadwal
                .Where(x => x.Id != jadwal.Id && IsUjian(x.Stase))
                .OrderBy(x => x.TanggalMulai)
                .FirstOrDefault(x => x.TanggalMulai < tanggalSelesaiBaru);

            if (ujianLebihAwal is not null)
            {
                warnings["ujian"] =
                    $"Seminar akan selesai setelah stase '{ujianLebihAwal.Stase.Nama}' dimulai pada {ujianLebihAwal.TanggalMulai:M/d/yyyy}.";
            }
        }

        return warnings;
    }

    private DateOnly HitungTanggalSelesai(DateOnly tanggalMulai, Stase stase)
    {
        return new Jadwal
        {
            TanggalMulai = tanggalMulai,
            Stase = stase,
            Kelompok = new Kelompok { Nama = "_" }
        }.TanggalSelesai(_hariLiburService);
    }

    private bool ApakahBertabrakan(DateOnly mulaiA, DateOnly selesaiA, DateOnly mulaiB, DateOnly selesaiB)
    {
        return mulaiA <= selesaiB && mulaiB <= selesaiA;
    }

    private bool IsSeminar(Stase stase)
    {
        return stase.Nama.Contains("Seminar", StringComparison.OrdinalIgnoreCase);
    }

    private bool IsUjian(Stase stase)
    {
        return stase.Nama.Contains("Ujian", StringComparison.OrdinalIgnoreCase)
            || stase.Nama.Contains("Komprehensif", StringComparison.OrdinalIgnoreCase);
    }
}
