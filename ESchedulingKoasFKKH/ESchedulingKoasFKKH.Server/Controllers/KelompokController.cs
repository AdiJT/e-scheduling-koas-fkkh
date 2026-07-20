using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.KelompokModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/kelompok")]
[Authorize]
public class KelompokController : ControllerBase
{
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IMahasiswaRepository _mahasiswaRepository;
    private readonly IRiwayatKelompokRepository _riwayatKelompokRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHariLiburService _hariLiburService;

    public KelompokController(
        IKelompokRepository kelompokRepository,
        IMahasiswaRepository mahasiswaRepository,
        IRiwayatKelompokRepository riwayatKelompokRepository,
        IUnitOfWork unitOfWork,
        IHariLiburService hariLiburService)
    {
        _kelompokRepository = kelompokRepository;
        _mahasiswaRepository = mahasiswaRepository;
        _riwayatKelompokRepository = riwayatKelompokRepository;
        _unitOfWork = unitOfWork;
        _hariLiburService = hariLiburService;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        await AutoArchiveCompletedSchedulesAsync();
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        if (User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Pengelola) || User.IsInRole(UserRoles.Dosen) || User.IsInRole(UserRoles.Mahasiswa))
            return Ok(new
            {
                kelompok.Id,
                kelompok.Nama,
                daftarMahasiswa = kelompok.DaftarMahasiswa.Select(m => new { m.Id, m.NIM, m.Nama }),
                daftarJadwal = kelompok.DaftarJadwal.Select(j => new
                {
                    j.Id,
                    j.TanggalMulai,
                    tanggalSelesai = j.TanggalSelesai(_hariLiburService),
                    idStase = j.Stase?.Id,
                    namaStase = j.Stase?.Nama,
                    idPembimbing = j.Pembimbing?.Id,
                    namaPembimbing = j.Pembimbing?.Nama,
                    nipPembimbing = j.Pembimbing?.NIP,
                    daftarSubStase = j.DaftarJadwalSubStase.Select(sub => new
                    {
                        idSubStase = sub.SubStase?.Id,
                        urutan = sub.SubStase?.Urutan,
                        namaSubStase = sub.SubStase?.Nama,
                        idPembimbing = sub.Pembimbing?.Id,
                        namaPembimbing = sub.Pembimbing?.Nama,
                        nipPembimbing = sub.Pembimbing?.NIP
                    }).OrderBy(s => s.urutan)
                })
            });

        return Forbid();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await AutoArchiveCompletedSchedulesAsync();
        var allKelompok = await _kelompokRepository.GetAll();

        if (User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Pengelola) || User.IsInRole(UserRoles.Dosen) || User.IsInRole(UserRoles.Mahasiswa))
        {
            return Ok(allKelompok.Select(x => new
            {
                x.Id,
                x.Nama,
                daftarMahasiswa = x.DaftarMahasiswa.Select(m => new { m.Id, m.NIM, m.Nama }),
                daftarJadwal = x.DaftarJadwal.Select(j => new
                {
                    j.Id,
                    j.TanggalMulai,
                    tanggalSelesai = j.TanggalSelesai(_hariLiburService),
                    idStase = j.Stase?.Id,
                    namaStase = j.Stase?.Nama,
                    idPembimbing = j.Pembimbing?.Id,
                    namaPembimbing = j.Pembimbing?.Nama,
                    nipPembimbing = j.Pembimbing?.NIP,
                    daftarSubStase = j.DaftarJadwalSubStase.Select(sub => new
                    {
                        idSubStase = sub.SubStase?.Id,
                        urutan = sub.SubStase?.Urutan,
                        namaSubStase = sub.SubStase?.Nama,
                        idPembimbing = sub.Pembimbing?.Id,
                        namaPembimbing = sub.Pembimbing?.Nama,
                        nipPembimbing = sub.Pembimbing?.NIP
                    }).OrderBy(s => s.urutan)
                })
            }));
        }

        return Forbid();
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Create(CreateKelompok create)
    {
        if (await _kelompokRepository.IsExist(create.Nama))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nama"] = $"Nama kelompok '{create.Nama}' sudah digunakan" });

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
                daftarMahasiswa = kelompok.DaftarMahasiswa.Select(m => new { m.Id, m.NIM, m.Nama }),
                daftarJadwal = kelompok.DaftarJadwal.Select(j => new
                {
                    j.Id,
                    j.TanggalMulai,
                    tanggalSelesai = j.TanggalSelesai(_hariLiburService),
                    idStase = j.Stase?.Id,
                    namaStase = j.Stase?.Nama,
                    idPembimbing = j.Pembimbing?.Id,
                    namaPembimbing = j.Pembimbing?.Nama,
                    nipPembimbing = j.Pembimbing?.NIP,
                    daftarSubStase = j.DaftarJadwalSubStase.Select(sub => new
                    {
                        idSubStase = sub.SubStase?.Id,
                        urutan = sub.SubStase?.Urutan,
                        namaSubStase = sub.SubStase?.Nama,
                        idPembimbing = sub.Pembimbing?.Id,
                        namaPembimbing = sub.Pembimbing?.Nama,
                        nipPembimbing = sub.Pembimbing?.NIP
                    }).OrderBy(s => s.urutan)
                })
            });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Update(int id, UpdateKelompok update)
    {
        if (update.Id != id)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["id"] = "Id pada body tidak sesuai dengan id pada url" });

        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        if (await _kelompokRepository.IsExist(update.Nama, id))
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["nama"] = $"Nama kelompok '{update.Nama}' sudah digunakan" });

        kelompok.Nama = update.Nama;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        _kelompokRepository.Delete(kelompok);
        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpPut("{id:int}/tambah-anggota")]
    [Authorize(Roles = UserRoles.Pengelola)]
    public async Task<IActionResult> TambahAnggota(int id, TambahAnggota tambahAnggota)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        var mahasiswa = await _mahasiswaRepository.Get(tambahAnggota.IdMahasiswa);
        if (mahasiswa is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["idMahasiswa"] = $"Mahasiswa dengan id '{tambahAnggota.IdMahasiswa}' tidak ditemukan" });

        if (mahasiswa.Kelompok is not null)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["idMahasiswa"] = $"Mahasiswa '{mahasiswa.Nama}' sudah terdaftar di kelompok lain" });

        mahasiswa.Kelompok = kelompok;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    [HttpPost("{id:int}/hapus-anggota")]
    [Authorize(Roles = UserRoles.Pengelola)]
    public async Task<IActionResult> HapusAnggota(int id, HapusAnggota hapusAnggota)
    {
        var kelompok = await _kelompokRepository.Get(id);
        if (kelompok is null) return NotFound();

        var mahasiswa = await _mahasiswaRepository.Get(hapusAnggota.IdMahasiswa);
        if (mahasiswa is null)
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["idMahasiswa"] = $"Mahasiswa dengan id '{hapusAnggota.IdMahasiswa}' tidak ditemukan" });

        if (mahasiswa.Kelompok is null || mahasiswa.Kelompok.Id != id)
            return HelpersFunctions.BadRequest(new Dictionary<string, string> { ["idMahasiswa"] = $"Mahasiswa '{mahasiswa.Nama}' bukan anggota kelompok ini" });

        mahasiswa.Kelompok = null;

        var result = await _unitOfWork.SaveChangesAsync();
        if (result.IsFailure) return StatusCode(StatusCodes.Status500InternalServerError);

        return NoContent();
    }

    private async Task AutoArchiveCompletedSchedulesAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var allKelompoks = await _kelompokRepository.GetAll();
        var allRiwayat = await _riwayatKelompokRepository.GetAll();
        var riwayatDict = allRiwayat.ToDictionary(r => r.IdJadwalAsal);

        bool dataChanged = false;
        foreach (var kel in allKelompoks)
        {
            foreach (var j in kel.DaftarJadwal)
            {
                var tglSelesai = j.TanggalSelesai(_hariLiburService);
                if (tglSelesai < today)
                {
                    // Extract Tahun Ajaran from students
                    string tahunAjaranStr = "N/A";
                    if (kel.DaftarMahasiswa.Count > 0)
                    {
                        var firstStudent = kel.DaftarMahasiswa.First();
                        if (firstStudent.TahunAjaran is not null)
                        {
                            tahunAjaranStr = $"{firstStudent.TahunAjaran.Tahun} - {firstStudent.TahunAjaran.Semester}";
                        }
                    }

                    var mhsList = kel.DaftarMahasiswa.Select(m => new { m.NIM, m.Nama }).ToList();
                    var subStasesList = j.DaftarJadwalSubStase.Select(sub => new
                    {
                        namaSubStase = sub.SubStase?.Nama,
                        namaPembimbing = sub.Pembimbing?.Nama,
                        nipPembimbing = sub.Pembimbing?.NIP
                    }).ToList();

                    var mhsJson = System.Text.Json.JsonSerializer.Serialize(mhsList);
                    var subStaseJson = System.Text.Json.JsonSerializer.Serialize(subStasesList);

                    if (!riwayatDict.TryGetValue(j.Id, out var riwayat))
                    {
                        riwayat = new RiwayatKelompok
                        {
                            IdJadwalAsal = j.Id,
                            NamaKelompok = kel.Nama,
                            TahunAjaran = tahunAjaranStr,
                            NamaStase = j.Stase?.Nama ?? "N/A",
                            TanggalMulai = j.TanggalMulai,
                            TanggalSelesai = tglSelesai,
                            NamaPembimbing = j.Pembimbing?.Nama,
                            NipPembimbing = j.Pembimbing?.NIP,
                            DaftarMahasiswaJson = mhsJson,
                            DaftarSubStaseJson = subStaseJson,
                            TanggalDiarsipkan = DateTime.UtcNow
                        };

                        _riwayatKelompokRepository.Add(riwayat);
                        riwayatDict[j.Id] = riwayat;
                        dataChanged = true;
                    }
                    else
                    {
                        bool changed = false;
                        if (riwayat.NamaKelompok != kel.Nama) { riwayat.NamaKelompok = kel.Nama; changed = true; }
                        if (riwayat.TahunAjaran != tahunAjaranStr) { riwayat.TahunAjaran = tahunAjaranStr; changed = true; }
                        if (riwayat.NamaPembimbing != j.Pembimbing?.Nama) { riwayat.NamaPembimbing = j.Pembimbing?.Nama; changed = true; }
                        if (riwayat.NipPembimbing != j.Pembimbing?.NIP) { riwayat.NipPembimbing = j.Pembimbing?.NIP; changed = true; }
                        if (riwayat.DaftarMahasiswaJson != mhsJson) { riwayat.DaftarMahasiswaJson = mhsJson; changed = true; }
                        if (riwayat.DaftarSubStaseJson != subStaseJson) { riwayat.DaftarSubStaseJson = subStaseJson; changed = true; }

                        if (changed)
                        {
                            _riwayatKelompokRepository.Update(riwayat);
                            dataChanged = true;
                        }
                    }
                }
            }
        }

        if (dataChanged)
        {
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
