using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Models.StaseModels;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("stase")]
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
            stase.Jenis,
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
            x.Jenis,
            daftarJadwal = x.DaftarJadwal.Select(j => new { j.Id, j.TanggalMulai, j.TanggalSelesai, idKelompok = j.Kelompok?.Id, namaKelompok = j.Kelompok?.Nama })
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create(Create create)
    {
        if (await _staseRepository.IsExist(create.Nama))
            return BadRequest();

        var stase = new Stase
        {
            Nama = create.Nama,
            Waktu = create.Waktu,
            Jenis = create.Jenis,
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
                stase.Jenis,
                daftarJadwal = stase.DaftarJadwal?.Select(j => new { j.Id, j.TanggalMulai, j.TanggalSelesai, idKelompok = j.Kelompok?.Id, namaKelompok = j.Kelompok?.Nama })
            });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Update update)
    {
        if (update.Id != id) return BadRequest();

        var stase = await _staseRepository.Get(id);
        if (stase is null) return NotFound();

        if (await _staseRepository.IsExist(update.Nama, id))
            return BadRequest();

        stase.Nama = update.Nama;
        stase.Waktu = update.Waktu;
        stase.Jenis = update.Jenis;

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
