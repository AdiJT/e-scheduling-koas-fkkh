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
[Route("Jadwal")]
[Authorize]
public class JadwalController : ControllerBase
{
    private readonly IJadwalRepository _jadwalRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IStaseRepository _staseRepository;
    private readonly IHariLiburService _hariLiburService;
    private readonly IJadwalAutoScheduler _jadwalAutoScheduler;

    public JadwalController(
        IJadwalRepository jadwalRepository,
        IUnitOfWork unitOfWork,
        IKelompokRepository kelompokRepository,
        IStaseRepository staseRepository,
        IHariLiburService hariLiburService,
        IJadwalAutoScheduler jadwalAutoScheduler)
    {
        _jadwalRepository = jadwalRepository;
        _unitOfWork = unitOfWork;
        _kelompokRepository = kelompokRepository;
        _staseRepository = staseRepository;
        _hariLiburService = hariLiburService;
        _jadwalAutoScheduler = jadwalAutoScheduler;
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
            tanggalSelesai = jadwal.TanggalSelesai(_hariLiburService),
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
            tanggalSelesai = x.TanggalSelesai(_hariLiburService),
            idStase = x.Stase.Id,
            namaStase = x.Stase.Nama,
            idKelompok = x.Kelompok.Id,
            namaKelompok = x.Kelompok.Nama
        }));
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

        if (kelompok.Pembimbing is null)
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["idKelompok"] = $"Kelompok '{kelompok.Nama}' belum memiliki pembimbing"
            });

        if (kelompok.DaftarJadwal.Any(x => x.Stase == stase))
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["idStase"] = $"Kelompok '{kelompok.Nama}' sudah memiliki jadwal untuk stase '{stase.Nama}'"
            });

        if (stase.Nama.Contains("Ujian", StringComparison.OrdinalIgnoreCase) || stase.Nama.Contains("Komprehensif", StringComparison.OrdinalIgnoreCase))
        {
            var jadwalSeminar = kelompok.DaftarJadwal.FirstOrDefault(x => x.Stase.Nama.Contains("Seminar", StringComparison.OrdinalIgnoreCase));
            
            if (jadwalSeminar is null)
                return HelpersFunctions.BadRequest(new Dictionary<string, string>
                {
                    ["idStase"] = $"Kelompok '{kelompok.Nama}' harus dijadwalkan untuk stase 'Seminar' terlebih dahulu."
                });

            if (jadwalSeminar.TanggalSelesai(_hariLiburService) > create.TanggalMulai)
                return HelpersFunctions.BadRequest(new Dictionary<string, string>
                {
                    ["tanggalMulai"] = $"Jadwal ujian tidak boleh sebelum stase 'Seminar' selesai pada tanggal {jadwalSeminar.TanggalSelesai(_hariLiburService):M/d/yyyy}."
                });
        }

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
                tanggalSelesai = jadwal.TanggalSelesai(_hariLiburService),
                idStase = jadwal.Stase.Id,
                namaStase = jadwal.Stase.Nama,
                idKelompok = jadwal.Kelompok.Id,
                namaKelompok = jadwal.Kelompok.Nama
            });
    }

    [HttpPost("generate")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Generate(CancellationToken cancellationToken)
    {
        var result = await _jadwalAutoScheduler.GenerateAsync(cancellationToken);
        if (result.IsFailure)
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Generate jadwal otomatis gagal.",
                errors = result.Errors.Select(x => x.Message),
            });

        return Ok(result.Value);
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
}
