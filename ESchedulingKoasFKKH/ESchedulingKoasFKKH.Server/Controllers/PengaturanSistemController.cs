using System.Net.Mail;
using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Server.Helpers;
using ESchedulingKoasFKKH.Server.Models.PengaturanSistemModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/pengaturan-sistem")]
public class PengaturanSistemController : ControllerBase
{
    private readonly IFaqRepository _faqRepository;
    private readonly IKontakSettingRepository _kontakRepository;
    private readonly IHariLiburRepository _hariLiburRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PengaturanSistemController(
        IFaqRepository faqRepository,
        IKontakSettingRepository kontakRepository,
        IHariLiburRepository hariLiburRepository,
        IUnitOfWork unitOfWork)
    {
        _faqRepository = faqRepository;
        _kontakRepository = kontakRepository;
        _hariLiburRepository = hariLiburRepository;
        _unitOfWork = unitOfWork;
    }

    // =========================================================
    // FAQ
    // =========================================================

    [HttpGet("faq")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFaq([FromQuery] bool includeInactive = false)
    {
        var isAdmin = User.IsInRole(UserRoles.Admin);
        var hanyaAktif = !(includeInactive && isAdmin);
        var items = await _faqRepository.GetAll(hanyaAktif);

        return Ok(items.Select(MapFaqDto));
    }

    [HttpPost("faq")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> CreateFaq([FromBody] FaqItemRequest request)
    {
        var errors = ValidateFaqRequest(request);
        if (errors.Count > 0)
        {
            return HelpersFunctions.BadRequest(errors);
        }

        var urutan = request.Urutan;
        if (urutan <= 0)
        {
            var existing = await _faqRepository.GetAll();
            urutan = existing.Count > 0 ? existing.Max(x => x.Urutan) + 1 : 1;
        }

        var now = DateTime.Now;
        var entity = new FaqItem
        {
            Pertanyaan = request.Pertanyaan.Trim(),
            Jawaban = request.Jawaban.Trim(),
            Urutan = urutan,
            IsAktif = request.IsAktif,
            CreatedAt = now,
            UpdatedAt = now
        };

        _faqRepository.Add(entity);
        await _unitOfWork.SaveChangesAsync();

        return Created($"/api/pengaturan-sistem/faq/{entity.Id}", MapFaqDto(entity));
    }

    [HttpPut("faq/{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdateFaq(int id, [FromBody] FaqItemRequest request)
    {
        var existing = await _faqRepository.Get(id);
        if (existing is null)
        {
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["id"] = "Data FAQ tidak ditemukan." });
        }

        var errors = ValidateFaqRequest(request);
        if (errors.Count > 0)
        {
            return HelpersFunctions.BadRequest(errors);
        }

        existing.Pertanyaan = request.Pertanyaan.Trim();
        existing.Jawaban = request.Jawaban.Trim();
        existing.Urutan = request.Urutan > 0 ? request.Urutan : existing.Urutan;
        existing.IsAktif = request.IsAktif;
        existing.UpdatedAt = DateTime.Now;

        _faqRepository.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        return Ok(MapFaqDto(existing));
    }

    [HttpDelete("faq/{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> DeleteFaq(int id)
    {
        var existing = await _faqRepository.Get(id);
        if (existing is null)
        {
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["id"] = "Data FAQ tidak ditemukan." });
        }

        _faqRepository.Delete(existing);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }

    // =========================================================
    // KONTAK
    // =========================================================

    [HttpGet("kontak")]
    [AllowAnonymous]
    public async Task<IActionResult> GetKontak()
    {
        var kontak = await _kontakRepository.GetDefault();
        if (kontak is null)
        {
            return Ok(new
            {
                id = 0,
                judul = "Kontak Administrator",
                subJudul = "Layanan Bantuan Sistem E-Scheduling KOAS FKKH UNDANA",
                lokasi = "Gedung Dekanat FKKH Universitas Nusa Cendana",
                email = "fkkh@undana.ac.id",
                telepon = (string?)null,
                whatsApp = (string?)null,
                jamPelayanan = "Senin - Jumat, 08:00 - 16:00 WITA",
                catatan = (string?)null,
                updatedAt = (DateTime?)null
            });
        }

        return Ok(MapKontakDto(kontak));
    }

    [HttpPut("kontak")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdateKontak([FromBody] KontakSettingRequest request)
    {
        var errors = new Dictionary<string, string>();

        if (string.IsNullOrWhiteSpace(request.Judul))
            errors["judul"] = "Judul kontak wajib diisi.";
        if (string.IsNullOrWhiteSpace(request.SubJudul))
            errors["subJudul"] = "Sub judul kontak wajib diisi.";
        if (string.IsNullOrWhiteSpace(request.Lokasi))
            errors["lokasi"] = "Lokasi sekretariat wajib diisi.";
        if (string.IsNullOrWhiteSpace(request.JamPelayanan))
            errors["jamPelayanan"] = "Jam pelayanan wajib diisi.";

        var emailTrimmed = request.Email?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(emailTrimmed))
        {
            errors["email"] = "Email akademik wajib diisi.";
        }
        else if (!IsValidEmail(emailTrimmed))
        {
            errors["email"] = "Format email akademik tidak valid.";
        }

        if (errors.Count > 0)
        {
            return HelpersFunctions.BadRequest(errors);
        }

        var existing = await _kontakRepository.GetDefault();
        var now = DateTime.Now;

        if (existing is null)
        {
            existing = new KontakSetting
            {
                Judul = request.Judul.Trim(),
                SubJudul = request.SubJudul.Trim(),
                Lokasi = request.Lokasi.Trim(),
                Email = emailTrimmed,
                Telepon = NormalizeOptional(request.Telepon),
                WhatsApp = NormalizeOptional(request.WhatsApp),
                JamPelayanan = request.JamPelayanan.Trim(),
                Catatan = NormalizeOptional(request.Catatan),
                CreatedAt = now,
                UpdatedAt = now
            };
            _kontakRepository.Add(existing);
        }
        else
        {
            existing.Judul = request.Judul.Trim();
            existing.SubJudul = request.SubJudul.Trim();
            existing.Lokasi = request.Lokasi.Trim();
            existing.Email = emailTrimmed;
            existing.Telepon = NormalizeOptional(request.Telepon);
            existing.WhatsApp = NormalizeOptional(request.WhatsApp);
            existing.JamPelayanan = request.JamPelayanan.Trim();
            existing.Catatan = NormalizeOptional(request.Catatan);
            existing.UpdatedAt = now;
            _kontakRepository.Update(existing);
        }

        await _unitOfWork.SaveChangesAsync();
        return Ok(MapKontakDto(existing));
    }

    // =========================================================
    // HARI LIBUR (KALENDER)
    // =========================================================

    [HttpGet("hari-libur")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHariLibur([FromQuery] int? tahun = null)
    {
        if (tahun.HasValue && (tahun.Value < 2000 || tahun.Value > 2100))
        {
            return HelpersFunctions.BadRequest(new Dictionary<string, string>
            {
                ["tahun"] = "Filter tahun harus berada di antara 2000 dan 2100."
            });
        }

        var items = await _hariLiburRepository.GetAll(tahun);
        return Ok(items.Select(MapHariLiburDto));
    }

    [HttpPost("hari-libur")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> CreateHariLibur([FromBody] HariLiburRequest request)
    {
        var (errors, tanggalSelesai) = ValidateHariLiburRequest(request);
        if (errors.Count > 0)
        {
            return HelpersFunctions.BadRequest(errors);
        }

        var now = DateTime.Now;
        var entity = new HariLibur
        {
            TanggalMulai = request.TanggalMulai,
            TanggalSelesai = tanggalSelesai,
            Nama = request.Nama.Trim(),
            Keterangan = NormalizeOptional(request.Keterangan),
            CreatedAt = now,
            UpdatedAt = now
        };

        _hariLiburRepository.Add(entity);
        await _unitOfWork.SaveChangesAsync();

        return Created($"/api/pengaturan-sistem/hari-libur/{entity.Id}", MapHariLiburDto(entity));
    }

    [HttpPut("hari-libur/{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdateHariLibur(int id, [FromBody] HariLiburRequest request)
    {
        var existing = await _hariLiburRepository.Get(id);
        if (existing is null)
        {
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["id"] = "Data hari libur tidak ditemukan." });
        }

        var (errors, tanggalSelesai) = ValidateHariLiburRequest(request);
        if (errors.Count > 0)
        {
            return HelpersFunctions.BadRequest(errors);
        }

        existing.TanggalMulai = request.TanggalMulai;
        existing.TanggalSelesai = tanggalSelesai;
        existing.Nama = request.Nama.Trim();
        existing.Keterangan = NormalizeOptional(request.Keterangan);
        existing.UpdatedAt = DateTime.Now;

        _hariLiburRepository.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        return Ok(MapHariLiburDto(existing));
    }

    [HttpDelete("hari-libur/{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> DeleteHariLibur(int id)
    {
        var existing = await _hariLiburRepository.Get(id);
        if (existing is null)
        {
            return HelpersFunctions.NotFound(new Dictionary<string, string> { ["id"] = "Data hari libur tidak ditemukan." });
        }

        _hariLiburRepository.Delete(existing);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private static Dictionary<string, string> ValidateFaqRequest(FaqItemRequest request)
    {
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(request.Pertanyaan))
            errors["pertanyaan"] = "Pertanyaan FAQ wajib diisi.";
        if (string.IsNullOrWhiteSpace(request.Jawaban))
            errors["jawaban"] = "Jawaban FAQ wajib diisi.";
        return errors;
    }

    private static (Dictionary<string, string> Errors, DateOnly TanggalSelesai) ValidateHariLiburRequest(HariLiburRequest request)
    {
        var errors = new Dictionary<string, string>();
        var tanggalSelesai = request.TanggalSelesai ?? request.TanggalMulai;

        if (request.TanggalMulai == default)
            errors["tanggalMulai"] = "Tanggal mulai libur wajib diisi.";

        if (string.IsNullOrWhiteSpace(request.Nama))
            errors["nama"] = "Nama hari libur wajib diisi.";

        if (request.TanggalMulai != default && tanggalSelesai < request.TanggalMulai)
        {
            errors["tanggalSelesai"] = "Tanggal selesai harus sama atau setelah tanggal mulai.";
        }
        else if (request.TanggalMulai != default && (tanggalSelesai.DayNumber - request.TanggalMulai.DayNumber + 1) > 90)
        {
            errors["tanggalSelesai"] = "Rentang hari libur maksimal 90 hari per entri.";
        }

        return (errors, tanggalSelesai);
    }

    private static bool IsValidEmail(string email)
    {
        if (!MailAddress.TryCreate(email, out var addr) || !string.Equals(addr.Address, email, StringComparison.OrdinalIgnoreCase))
            return false;

        var parts = email.Split('@');
        return parts.Length == 2 && parts[1].Contains('.');
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static object MapFaqDto(FaqItem item) => new
    {
        id = item.Id,
        pertanyaan = item.Pertanyaan,
        jawaban = item.Jawaban,
        urutan = item.Urutan,
        isAktif = item.IsAktif,
        updatedAt = item.UpdatedAt
    };

    private static object MapKontakDto(KontakSetting setting) => new
    {
        id = setting.Id,
        judul = setting.Judul,
        subJudul = setting.SubJudul,
        lokasi = setting.Lokasi,
        email = setting.Email,
        telepon = setting.Telepon,
        whatsApp = setting.WhatsApp,
        jamPelayanan = setting.JamPelayanan,
        catatan = setting.Catatan,
        updatedAt = setting.UpdatedAt
    };

    private static object MapHariLiburDto(HariLibur item) => new
    {
        id = item.Id,
        tanggalMulai = item.TanggalMulai,
        tanggalSelesai = item.TanggalSelesai,
        nama = item.Nama,
        keterangan = item.Keterangan,
        jumlahHari = (item.TanggalSelesai.DayNumber - item.TanggalMulai.DayNumber) + 1,
        updatedAt = item.UpdatedAt
    };
}
