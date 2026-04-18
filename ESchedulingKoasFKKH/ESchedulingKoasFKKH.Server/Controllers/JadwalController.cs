using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.JadwalModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("Jadwal")]
[Authorize]
public class JadwalController : ControllerBase
{
    private readonly IJadwalRepository _jadwalRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IStaseRepository _staseRepository;

    public JadwalController(
        IJadwalRepository jadwalRepository,
        IUnitOfWork unitOfWork,
        IKelompokRepository kelompokRepository,
        IStaseRepository staseRepository)
    {
        _jadwalRepository = jadwalRepository;
        _unitOfWork = unitOfWork;
        _kelompokRepository = kelompokRepository;
        _staseRepository = staseRepository;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var jadwal = await _jadwalRepository.Get(id);
        if (jadwal is null) return NotFound();

        return Ok(new
        {
            jadwal.Id,
            jadwal.TanggalMulai,
            jadwal.TanggalSelesai,
            idStase = jadwal.Stase.Id,
            namaStase = jadwal.Stase.Nama,
            idKelompok = jadwal.Kelompok.Id,
            namaKelompok = jadwal.Kelompok.Nama
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var daftarjadwal = await _jadwalRepository.GetAll();
        
        return Ok(daftarjadwal.Select(x => new {
            x.Id,
            x.TanggalMulai,
            x.TanggalSelesai,
            idStase = x.Stase.Id,
            namaStase = x.Stase.Nama,
            idKelompok = x.Kelompok.Id,
            namaKelompok = x.Kelompok.Nama
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateJadwal create)
    {
        var kelompok = await _kelompokRepository.Get(create.IdKelompok);
        if (kelompok is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string> 
            { 
                ["idKelompok"] = $"kelompok dengan id '{create.IdKelompok}' tidak ditemukan" 
            });

        var stase = await _staseRepository.Get(create.IdStase);
        if (stase is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string>
            {
                ["idStase"] = $"stase dengan id '{create.IdStase}' tidak ditemukan"
            });

        if (kelompok.Pembimbing is null)
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["idKelompok"] = $"kelompok '{kelompok.Nama}' belum memiliki pembimbing"
            });

        if (kelompok.DaftarJadwal.Any(x => x.Stase == stase))
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["idStase"] = $"kelompok '{kelompok.Nama}' sudah memiliki jadwal untuk stase '{stase.Nama}'"
            });
        
        // Cek apakah jadwal bertabrakan
        if (kelompok.DaftarJadwal.Any(x => create.TanggalMulai >= x.TanggalMulai && create.TanggalMulai <= x.TanggalSelesai))
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["tanggalMulai"] = $"Jadwal bertabrakan. Kelompok '{kelompok.Nama}' memiliki jadwal di tanggal {create.TanggalMulai}"
            });

        if (stase.Jenis == JenisStase.Terpisah)
            if (stase.DaftarJadwal.Any(x => create.TanggalMulai >= x.TanggalMulai && create.TanggalMulai <= x.TanggalSelesai))
                return HelpersFunctions.BadRequest(new Dictionary<string, string>
                {
                    ["tanggalMulai"] = $"Jadwal bertabrakan. Stase '{stase.Nama}' dijadwalkan untuk kelompok lain pada tanggal {create.TanggalMulai}"
                });

        var jadwal = new Jadwal
        {
            TanggalMulai = create.TanggalMulai,
            Kelompok = kelompok,
            Stase = stase,
        };

        _jadwalRepository.Add(jadwal);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError);

        return CreatedAtAction(
            nameof(Get),
            new { id = jadwal.Id },
            new
            {
                jadwal.Id,
                jadwal.TanggalMulai,
                jadwal.TanggalSelesai,
                idStase = jadwal.Stase.Id,
                namaStase = jadwal.Stase.Nama,
                idKelompok = jadwal.Kelompok.Id,
                namaKelompok = jadwal.Kelompok.Nama
            });
    }

    [HttpDelete("{id:int}")]
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
}
