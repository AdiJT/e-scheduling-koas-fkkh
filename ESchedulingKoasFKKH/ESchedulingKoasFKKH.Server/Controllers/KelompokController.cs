using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.KelompokModels;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("kelompok")]
public class KelompokController : ControllerBase
{
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IMahasiswaRepository _mahasiswaRepository;
    private readonly IPembimbingRepository _pembimbingRepository;
    private readonly IUnitOfWork _unitOfWork;

    public KelompokController(
        IKelompokRepository kelompokRepository,
        IMahasiswaRepository mahasiswaRepository,
        IPembimbingRepository pembimbingRepository,
        IUnitOfWork unitOfWork)
    {
        _kelompokRepository = kelompokRepository;
        _mahasiswaRepository = mahasiswaRepository;
        _pembimbingRepository = pembimbingRepository;
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
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nama"] = $"nama kelompok '{create.Nama}' sudah digunakan" });

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
        if (update.Id != id)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["id"] = "id pada body tidak sesuai dengan id pada url" });

        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        if (await _kelompokRepository.IsExist(update.Nama, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nama"] = $"nama kelompok '{update.Nama}' sudah digunakan" });

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

    [HttpPost("{id:int}/tambah-anggota")]
    public async Task<IActionResult> TambahAnggota(int id, TambahAnggota tambahAnggota)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        var mahasiswa = await _mahasiswaRepository.Get(tambahAnggota.IdMahasiswa);
        if (mahasiswa is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["idMahasiswa"] = $"mahasiswa dengan id '{tambahAnggota.IdMahasiswa}' tidak ditemukan" });

        if (mahasiswa.Kelompok is not null)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["idMahasiswa"] = $"mahasiswa '{mahasiswa.Nama}' sudah terdaftar di kelompok lain" });

        mahasiswa.Kelompok = kelompok;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpPost("{id:int}/hapus-anggota")]
    public async Task<IActionResult> HapusAnggota(int id, HapusAnggota hapusAnggota)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        var mahasiswa = await _mahasiswaRepository.Get(hapusAnggota.IdMahasiswa);
        if (mahasiswa is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["idMahasiswa"] = $"mahasiswa dengan id '{hapusAnggota.IdMahasiswa}' tidak ditemukan" });

        if (mahasiswa.Kelompok is null || mahasiswa.Kelompok.Id != id)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["idMahasiswa"] = $"mahasiswa '{mahasiswa.Nama}' bukan anggota kelompok ini" });

        mahasiswa.Kelompok = null;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpPost("{id:int}/pilih-pembimbing")]
    public async Task<IActionResult> PilihPembimbing(int id, PilihPembimbing pilihPembimbing)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        if (kelompok.Pembimbing is not null)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["idPembimbing"] = "kelompok ini sudah memiliki pembimbing" });

        var pembimbing = await _pembimbingRepository.Get(pilihPembimbing.IdPembimbing);
        if (pembimbing is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["idPembimbing"] = $"pembimbing dengan id '{pilihPembimbing.IdPembimbing}' tidak ditemukan" });

        kelompok.Pembimbing = pembimbing;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpPut("{id:int}/ganti-pembimbing")]
    public async Task<IActionResult> GantiPembimbing(int id, GantiPembimbing gantiPembimbing)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        if (kelompok.Pembimbing is null)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["idPembimbing"] = "kelompok ini belum memiliki pembimbing, gunakan endpoint pilih-pembimbing" });

        var pembimbing = await _pembimbingRepository.Get(gantiPembimbing.IdPembimbing);
        if (pembimbing is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["idPembimbing"] = $"pembimbing dengan id '{gantiPembimbing.IdPembimbing}' tidak ditemukan" });

        kelompok.Pembimbing = pembimbing;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }
}
