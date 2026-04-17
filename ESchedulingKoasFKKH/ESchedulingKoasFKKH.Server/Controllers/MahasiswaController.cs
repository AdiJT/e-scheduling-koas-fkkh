using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Models.MahasiswaModels;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("mahasiswa")]
public class MahasiswaController : ControllerBase
{
    private readonly IMahasiswaRepository _mahasiswaRepository;
    private readonly IUnitOfWork _unitOfWork;

    public MahasiswaController(
        IMahasiswaRepository mahasiswaRepository,
        IUnitOfWork unitOfWork)
    {
        _mahasiswaRepository = mahasiswaRepository;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var mahasiswa = await _mahasiswaRepository.Get(id);
        if (mahasiswa is null) return NotFound();

        return Ok(new {mahasiswa.Id, mahasiswa.NIM, mahasiswa.Nama, idKelompok = mahasiswa.Kelompok?.Id});
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok((await _mahasiswaRepository.GetAll()).Select(x => new { x.Id, x.NIM, x.Nama, idKelompok = x.Kelompok?.Id }));
    }

    [HttpPost]
    public async Task<IActionResult> Create(Create create)
    {
        if (await _mahasiswaRepository.IsExist(create.NIM))
            return BadRequest();

        var mahasiswa = new Mahasiswa
        {
            NIM = create.NIM,
            Nama = create.Nama,
        };

        _mahasiswaRepository.Add(mahasiswa);

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return CreatedAtAction(
            nameof(Create), 
            new { id = mahasiswa.Id }, 
            new { mahasiswa.Id, mahasiswa.NIM, mahasiswa.Nama, idKelompok = mahasiswa.Kelompok?.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Update update)
    {
        if (update.Id != id) return BadRequest();

        var mahasiswa = await _mahasiswaRepository.Get(id);
        if (mahasiswa is null) return NotFound();

        if (await _mahasiswaRepository.IsExist(update.NIM, id))
            return BadRequest();

        mahasiswa.Nama = update.Nama;
        mahasiswa.NIM = update.NIM;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var mahasiswa = await _mahasiswaRepository.Get(id);
        if (mahasiswa is null) return NotFound();

        _mahasiswaRepository.Delete(mahasiswa);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }
}
