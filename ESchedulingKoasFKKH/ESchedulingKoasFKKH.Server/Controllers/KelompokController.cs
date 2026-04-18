using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Models.KelompokModels;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("kelompok")]
public class KelompokController : ControllerBase
{
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IUnitOfWork _unitOfWork;

    public KelompokController(
        IKelompokRepository kelompokRepository,
        IUnitOfWork unitOfWork)
    {
        _kelompokRepository = kelompokRepository;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        return Ok(new
        {
            kelompok.Id,
            kelompok.Nama,
            idPembimbing = kelompok.Pembimbing?.Id,
            daftarMahasiswa = kelompok.DaftarMahasiswa.Select(m => new { m.Id, m.NIM, m.Nama }),
            daftarJadwal = kelompok.DaftarJadwal.Select(j => new { j.Id, j.TanggalMulai, j.TanggalSelesai, idStase = j.Stase?.Id, namaStase = j.Stase?.Nama })
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok((await _kelompokRepository.GetAll()).Select(x => new
        {
            x.Id,
            x.Nama,
            idPembimbing = x.Pembimbing?.Id,
            daftarMahasiswa = x.DaftarMahasiswa.Select(m => new { m.Id, m.NIM, m.Nama }),
            daftarJadwal = x.DaftarJadwal.Select(j => new { j.Id, j.TanggalMulai, j.TanggalSelesai, idStase = j.Stase?.Id, namaStase = j.Stase?.Nama })
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create(Create create)
    {
        if (await _kelompokRepository.IsExist(create.Nama))
            return BadRequest();

        var kelompok = new Kelompok
        {
            Nama = create.Nama,
        };

        _kelompokRepository.Add(kelompok);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return CreatedAtAction(
            nameof(Get),
            new { id = kelompok.Id },
            new
            {
                kelompok.Id,
                kelompok.Nama,
                idPembimbing = kelompok.Pembimbing?.Id,
                daftarMahasiswa = kelompok.DaftarMahasiswa.Select(m => new { m.Id, m.NIM, m.Nama }),
                daftarJadwal = kelompok.DaftarJadwal.Select(j => new { j.Id, j.TanggalMulai, j.TanggalSelesai, idStase = j.Stase?.Id, namaStase = j.Stase?.Nama })
            });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Update update)
    {
        if (update.Id != id) return BadRequest();

        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        if (await _kelompokRepository.IsExist(update.Nama, id))
            return BadRequest();

        kelompok.Nama = update.Nama;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        _kelompokRepository.Delete(kelompok);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }
}
