using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.StaseModels;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("stase")]
[Authorize]
public class StaseController : ControllerBase
{
    private readonly IStaseRepository _staseRepository;
    private readonly IUnitOfWork _unitOfWork;

    public StaseController(
        IStaseRepository staseRepository,
        IUnitOfWork unitOfWork)
    {
        _staseRepository = staseRepository;
        _unitOfWork = unitOfWork;
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
            daftarJadwal = stase.DaftarJadwal.Select(j => new { j.Id, j.TanggalMulai, j.TanggalSelesai, idKelompok = j.Kelompok?.Id, namaKelompok = j.Kelompok?.Nama })
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
            daftarJadwal = x.DaftarJadwal.Select(j => new { j.Id, j.TanggalMulai, j.TanggalSelesai, idKelompok = j.Kelompok?.Id, namaKelompok = j.Kelompok?.Nama })
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateStase create)
    {
        if (await _staseRepository.IsExist(create.Nama))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nama"] = $"nama stase '{create.Nama}' sudah digunakan" });

        if (!Enum.TryParse<JenisStase>(create.Jenis, out var jenis))
            return HelpersFunctions.BadRequest(
                new Dictionary<string, string>
                {
                    ["jenis"] = $"jenis '{create.Jenis}' tidak valid. " +
                    $"Nilai valid : {string.Join(", ", Enum.GetValues<JenisStase>().Select(x => x.Humanize()))}"
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
                daftarJadwal = stase.DaftarJadwal?.Select(j => new { j.Id, j.TanggalMulai, j.TanggalSelesai, idKelompok = j.Kelompok?.Id, namaKelompok = j.Kelompok?.Nama })
            });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateStase update)
    {
        if (update.Id != id)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["id"] = "id pada body tidak sesuai dengan id pada url" });

        var stase = await _staseRepository.Get(id);
        if (stase is null) return NotFound();

        if (await _staseRepository.IsExist(update.Nama, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nama"] = $"nama stase '{update.Nama}' sudah digunakan" });

        if (!Enum.TryParse<JenisStase>(update.Jenis, out var jenis))
            return HelpersFunctions.BadRequest(
                new Dictionary<string, string> { 
                    ["jenis"] = $"jenis '{update.Jenis}' tidak valid. " +
                    $"Nilai valid : {string.Join(", ", Enum.GetValues<JenisStase>().Select(x => x.Humanize()))}" 
                }
            );

        stase.Nama = update.Nama;
        stase.Waktu = update.Waktu;
        stase.Jenis = jenis;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
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
