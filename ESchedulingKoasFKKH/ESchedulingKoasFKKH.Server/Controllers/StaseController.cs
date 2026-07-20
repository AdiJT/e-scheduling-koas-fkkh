using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.StaseModels;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/stase")]
[Authorize]
public class StaseController : ControllerBase
{
    private readonly IStaseRepository _staseRepository;
    private readonly ISubStaseRepository _subStaseRepository;
    private readonly IPembimbingRepository _pembimbingRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHariLiburService _hariLiburService;

    public StaseController(
        IStaseRepository staseRepository,
        ISubStaseRepository subStaseRepository,
        IPembimbingRepository pembimbingRepository,
        IUnitOfWork unitOfWork,
        IHariLiburService hariLiburService)
    {
        _staseRepository = staseRepository;
        _subStaseRepository = subStaseRepository;
        _pembimbingRepository = pembimbingRepository;
        _unitOfWork = unitOfWork;
        _hariLiburService = hariLiburService;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var stase = await _staseRepository.Get(id);
        if (stase is null) return NotFound();

        return Ok(new
        {
            stase.Id,
            stase.Nama,
            stase.Waktu,
            jenis = stase.Jenis.Humanize(),
            daftarJadwal = stase.DaftarJadwal?.Select(j => new
            {
                j.Id,
                j.TanggalMulai,
                tanggalSelesai = j.TanggalSelesai(_hariLiburService),
                idKelompok = j.Kelompok?.Id,
                namaKelompok = j.Kelompok?.Nama,
                idPembimbing = j.Pembimbing?.Id,
                namaPembimbing = j.Pembimbing?.Nama
            }) ?? [],
            daftarSubStase = stase.DaftarSubStase?.OrderBy(s => s.Urutan).Select(s => new
            {
                s.Id,
                s.Nama,
                s.Urutan,
                idDefaultPembimbing = s.DefaultPembimbing?.Id,
                namaDefaultPembimbing = s.DefaultPembimbing?.Nama,
                nipDefaultPembimbing = s.DefaultPembimbing?.NIP
            }) ?? []
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok((await _staseRepository.GetAll()).Select(x => new
        {
            x.Id,
            x.Nama,
            x.Waktu,
            jenis = x.Jenis.Humanize(),
            daftarJadwal = x.DaftarJadwal?.Select(j => new
            {
                j.Id,
                j.TanggalMulai,
                tanggalSelesai = j.TanggalSelesai(_hariLiburService),
                idKelompok = j.Kelompok?.Id,
                namaKelompok = j.Kelompok?.Nama,
                idPembimbing = j.Pembimbing?.Id,
                namaPembimbing = j.Pembimbing?.Nama
            }) ?? [],
            daftarSubStase = x.DaftarSubStase?.OrderBy(s => s.Urutan).Select(s => new
            {
                s.Id,
                s.Nama,
                s.Urutan,
                idDefaultPembimbing = s.DefaultPembimbing?.Id,
                namaDefaultPembimbing = s.DefaultPembimbing?.Nama,
                nipDefaultPembimbing = s.DefaultPembimbing?.NIP
            }) ?? []
        }));
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Create(CreateStase create)
    {
        if (await _staseRepository.IsExist(create.Nama))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nama"] = $"Nama stase '{create.Nama}' sudah digunakan" });

        if (!Enum.TryParse<JenisStase>(create.Jenis, out var jenis))
            return HelpersFunctions.BadRequest(
                new Dictionary<string, string>
                {
                    ["jenis"] = $"Jenis '{create.Jenis}' tidak valid. " +
                        $"Nilai valid : {string.Join(", ", Enum.GetValues<JenisStase>().Select(x => x.Humanize()))}"
                }
            );

        var daftarStase = await _staseRepository.GetAll();
        if ((jenis == JenisStase.Seminar || jenis == JenisStase.Ujian) && daftarStase.Any(x => x.Jenis == jenis))
            return HelpersFunctions.BadRequest(
                new Dictionary<string, string>
                {
                    ["jenis"] = $"Stase dengan Jenis '{jenis}' sudah ada"
                }
            );

        var stase = new Stase
        {
            Nama = create.Nama,
            Waktu = create.Waktu,
            Jenis = jenis,
        };

        _staseRepository.Add(stase);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return CreatedAtAction(
            nameof(Get),
            new { id = stase.Id },
            new
            {
                stase.Id,
                stase.Nama,
                stase.Waktu,
                jenis = stase.Jenis.Humanize(),
                daftarJadwal = Array.Empty<string>(),
                daftarSubStase = Array.Empty<string>()
            });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Update(int id, UpdateStase update)
    {
        if (update.Id != id)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["id"] = "Id pada body tidak sesuai dengan id pada url" });

        var stase = await _staseRepository.Get(id);
        if (stase is null) return NotFound();

        if (await _staseRepository.IsExist(update.Nama, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nama"] = $"Nama stase '{update.Nama}' sudah digunakan" });

        if (!Enum.TryParse<JenisStase>(update.Jenis, out var jenis))
            return HelpersFunctions.BadRequest(
                new Dictionary<string, string>
                {
                    ["jenis"] = $"Jenis '{update.Jenis}' tidak valid. " +
                        $"Nilai valid : {string.Join(", ", Enum.GetValues<JenisStase>().Select(x => x.Humanize()))}"
                }
            );

        var daftarStase = await _staseRepository.GetAll();
        if ((jenis == JenisStase.Seminar || jenis == JenisStase.Ujian) && daftarStase.Any(x => x.Id != id && x.Jenis == jenis))
            return HelpersFunctions.BadRequest(
                new Dictionary<string, string>
                {
                    ["jenis"] = $"Stase dengan Jenis '{jenis}' sudah ada"
                }
            );

        stase.Nama = update.Nama;
        stase.Waktu = update.Waktu;
        stase.Jenis = jenis;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpPut("sub-stase/{subStaseId:int}/pilih-pembimbing")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> PilihPembimbingSubStase(int subStaseId, [FromBody] PilihPembimbingSubStaseRequest request)
    {
        var subStase = await _subStaseRepository.Get(subStaseId);
        if (subStase is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["subStaseId"] = $"Sub-stase dengan id '{subStaseId}' tidak ditemukan" });

        if (request.IdPembimbing.HasValue)
        {
            var pembimbing = await _pembimbingRepository.Get(request.IdPembimbing.Value);
            if (pembimbing is null)
                return HelpersFunctions.NotFound(new Dictionary<string, string> { ["idPembimbing"] = $"Pembimbing dengan id '{request.IdPembimbing}' tidak ditemukan" });
            subStase.DefaultPembimbing = pembimbing;
        }
        else
        {
            subStase.DefaultPembimbing = null;
        }

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpPost("{staseId:int}/sub-stase")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> CreateSubStase(int staseId, [FromBody] CreateSubStaseRequest request)
    {
        var stase = await _staseRepository.Get(staseId);
        if (stase is null) return NotFound();

        bool isKodil = stase.Id == 1 || stase.Nama.Contains("kodil", StringComparison.OrdinalIgnoreCase);
        if (!isKodil)
        {
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["stase"] = "Hanya Stase KODIL yang diperbolehkan memiliki Sub-Stase." });
        }

        Pembimbing? pembimbingDefault = null;
        if (request.IdDefaultPembimbing.HasValue)
        {
            pembimbingDefault = await _pembimbingRepository.Get(request.IdDefaultPembimbing.Value);
        }

        var existingSubStases = await _subStaseRepository.GetByStase(staseId);
        var subStase = new SubStase
        {
            Nama = request.Nama,
            Urutan = request.Urutan ?? (existingSubStases.Count + 1),
            Stase = stase,
            DefaultPembimbing = pembimbingDefault
        };

        _subStaseRepository.Add(subStase);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return Ok(new
        {
            subStase.Id,
            subStase.Nama,
            subStase.Urutan,
            idDefaultPembimbing = subStase.DefaultPembimbing?.Id,
            namaDefaultPembimbing = subStase.DefaultPembimbing?.Nama
        });
    }

    [HttpPut("sub-stase/{subStaseId:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdateSubStase(int subStaseId, [FromBody] UpdateSubStaseRequest request)
    {
        var subStase = await _subStaseRepository.Get(subStaseId);
        if (subStase is null) return NotFound();

        subStase.Nama = request.Nama;
        if (request.Urutan.HasValue) subStase.Urutan = request.Urutan.Value;

        if (request.IdDefaultPembimbing.HasValue)
        {
            subStase.DefaultPembimbing = await _pembimbingRepository.Get(request.IdDefaultPembimbing.Value);
        }
        else
        {
            subStase.DefaultPembimbing = null;
        }

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("sub-stase/{subStaseId:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> DeleteSubStase(int subStaseId)
    {
        var subStase = await _subStaseRepository.Get(subStaseId);
        if (subStase is null) return NotFound();

        _subStaseRepository.Delete(subStase);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var stase = await _staseRepository.Get(id);
        if (stase is null) return NotFound();

        _staseRepository.Delete(stase);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }
}

public class PilihPembimbingSubStaseRequest
{
    public int? IdPembimbing { get; set; }
}

public class CreateSubStaseRequest
{
    public required string Nama { get; set; }
    public int? Urutan { get; set; }
    public int? IdDefaultPembimbing { get; set; }
}

public class UpdateSubStaseRequest
{
    public required string Nama { get; set; }
    public int? Urutan { get; set; }
    public int? IdDefaultPembimbing { get; set; }
}
