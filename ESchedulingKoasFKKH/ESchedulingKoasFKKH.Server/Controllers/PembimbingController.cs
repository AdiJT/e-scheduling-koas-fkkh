using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.PembimbingModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("pembimbing")]
[Authorize]
public class PembimbingController : ControllerBase
{
    private readonly IPembimbingRepository _pembimbingRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PembimbingController(
        IPembimbingRepository pembimbingRepository,
        IUnitOfWork unitOfWork)
    {
        _pembimbingRepository = pembimbingRepository;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var pembimbing = await _pembimbingRepository.Get(id);
        if (pembimbing is null) return NotFound();

        return Ok(new 
        { 
            pembimbing.Id, 
            pembimbing.NIP, 
            pembimbing.Nama, 
            daftarKelompok = pembimbing.DaftarKelompok.Select(x => x.Id) 
        });
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var daftarPembimbing = await _pembimbingRepository.GetAll();

        return Ok(daftarPembimbing.Select(x => new
        {
            x.Id,
            x.NIP,
            x.Nama,
            daftarKelompok = x.DaftarKelompok.Select(x => x.Id)
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePembimbing create)
    {
        if (await _pembimbingRepository.IsExist(create.NIP))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nip"] = $"nip '{create.NIP}' sudah digunakan"});

        var pembimbing = new Pembimbing
        {
            NIP = create.NIP,
            Nama = create.Nama,
        };

        _pembimbingRepository.Add(pembimbing);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return CreatedAtAction(
            nameof(Get),
            new { id = pembimbing.Id },
            new
            {
                pembimbing.Id,
                pembimbing.NIP,
                pembimbing.Nama,
                daftarKelompok = pembimbing.DaftarKelompok.Select(x => x.Id)
            });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdatePembimbing update)
    {
        if (id != update.Id) return BadRequest();

        var pembimbing = await _pembimbingRepository.Get(id);
        if (pembimbing is null) return NotFound();

        if (await _pembimbingRepository.IsExist(update.NIP, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nip"] = $"nip '{update.NIP}' sudah digunakan" });

        pembimbing.NIP = update.NIP;
        pembimbing.Nama = update.Nama;

        _pembimbingRepository.Update(pembimbing);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var pembimbing = await _pembimbingRepository.Get(id);
        if (pembimbing is null) return NotFound();

        _pembimbingRepository.Delete(pembimbing);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }
}
