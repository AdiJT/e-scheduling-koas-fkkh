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
            idKoordinator = stase.Koordinator?.Id,
            namaKoordinator = stase.Koordinator?.Nama,
            nipKoordinator = stase.Koordinator?.NIP,
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
                daftarDefaultPembimbing = s.DaftarDefaultPembimbing?.Select(p => new
                {
                    p.Id,
                    p.NIP,
                    p.Nama
                }) ?? []
            }) ?? [],
            daftarPembimbing = stase.DaftarPembimbing?.Select(p => new
            {
                p.Id,
                p.NIP,
                p.Nama
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
            idKoordinator = x.Koordinator?.Id,
            namaKoordinator = x.Koordinator?.Nama,
            nipKoordinator = x.Koordinator?.NIP,
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
                daftarDefaultPembimbing = s.DaftarDefaultPembimbing?.Select(p => new
                {
                    p.Id,
                    p.NIP,
                    p.Nama
                }) ?? []
            }) ?? [],
            daftarPembimbing = x.DaftarPembimbing?.Select(p => new
            {
                p.Id,
                p.NIP,
                p.Nama
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
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["jenis"] = $"Jenis stase '{create.Jenis}' tidak valid" });

        var stase = new Stase
        {
            Nama = create.Nama,
            Waktu = create.Waktu,
            Jenis = jenis
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
                    daftarDefaultPembimbing = s.DaftarDefaultPembimbing?.Select(p => new
                    {
                        p.Id,
                        p.NIP,
                        p.Nama
                    }) ?? []
                }) ?? [],
                daftarPembimbing = stase.DaftarPembimbing?.Select(p => new
                {
                    p.Id,
                    p.NIP,
                    p.Nama
                }) ?? []
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
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["jenis"] = $"Jenis stase '{update.Jenis}' tidak valid" });

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

        subStase.DaftarDefaultPembimbing.Clear();
        if (request.IdDefaultPembimbingList is not null && request.IdDefaultPembimbingList.Count > 0)
        {
            foreach (var idPembimbing in request.IdDefaultPembimbingList)
            {
                var pembimbing = await _pembimbingRepository.Get(idPembimbing);
                if (pembimbing is not null)
                {
                    subStase.DaftarDefaultPembimbing.Add(pembimbing);
                }
            }
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

        var existingSubStases = await _subStaseRepository.GetByStase(staseId);
        var subStase = new SubStase
        {
            Nama = request.Nama,
            Urutan = request.Urutan ?? (existingSubStases.Count + 1),
            Stase = stase
        };

        if (request.IdDefaultPembimbingList is not null && request.IdDefaultPembimbingList.Count > 0)
        {
            foreach (var idPembimbing in request.IdDefaultPembimbingList)
            {
                var pembimbing = await _pembimbingRepository.Get(idPembimbing);
                if (pembimbing is not null)
                {
                    subStase.DaftarDefaultPembimbing.Add(pembimbing);
                }
            }
        }

        _subStaseRepository.Add(subStase);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return Ok(new
        {
            subStase.Id,
            subStase.Nama,
            subStase.Urutan,
            daftarDefaultPembimbing = subStase.DaftarDefaultPembimbing.Select(p => new { p.Id, p.NIP, p.Nama })
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

        subStase.DaftarDefaultPembimbing.Clear();
        if (request.IdDefaultPembimbingList is not null && request.IdDefaultPembimbingList.Count > 0)
        {
            foreach (var idPembimbing in request.IdDefaultPembimbingList)
            {
                var pembimbing = await _pembimbingRepository.Get(idPembimbing);
                if (pembimbing is not null)
                {
                    subStase.DaftarDefaultPembimbing.Add(pembimbing);
                }
            }
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

    [HttpPut("{id:int}/pembimbing")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdatePembimbingStase(int id, [FromBody] UpdatePembimbingStaseRequest request)
    {
        var stase = await _staseRepository.Get(id);
        if (stase is null) return NotFound();

        stase.DaftarPembimbing.Clear();
        if (request.IdPembimbingList is not null && request.IdPembimbingList.Count > 0)
        {
            foreach (var idPembimbing in request.IdPembimbingList)
            {
                var pembimbing = await _pembimbingRepository.Get(idPembimbing);
                if (pembimbing is not null)
                {
                    stase.DaftarPembimbing.Add(pembimbing);
                }
            }
        }

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpPut("{id:int}/koordinator")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> PilihKoordinator(int id, [FromBody] PilihKoordinatorStaseRequest request)
    {
        var stase = await _staseRepository.Get(id);
        if (stase is null) return NotFound();

        if (request.IdKoordinator.HasValue)
        {
            var pembimbing = await _pembimbingRepository.Get(request.IdKoordinator.Value);
            if (pembimbing is null)
                return HelpersFunctions.NotFound(new Dictionary<string, string> { ["idKoordinator"] = $"Dosen dengan id '{request.IdKoordinator.Value}' tidak ditemukan" });

            stase.Koordinator = pembimbing;
        }
        else
        {
            stase.Koordinator = null;
        }

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

public class PilihKoordinatorStaseRequest
{
    public int? IdKoordinator { get; set; }
}

public class PilihPembimbingSubStaseRequest
{
    public List<int> IdDefaultPembimbingList { get; set; } = [];
}

public class CreateSubStaseRequest
{
    public required string Nama { get; set; }
    public int? Urutan { get; set; }
    public List<int> IdDefaultPembimbingList { get; set; } = [];
}

public class UpdateSubStaseRequest
{
    public required string Nama { get; set; }
    public int? Urutan { get; set; }
    public List<int> IdDefaultPembimbingList { get; set; } = [];
}

public class UpdatePembimbingStaseRequest
{
    public List<int> IdPembimbingList { get; set; } = [];
}
