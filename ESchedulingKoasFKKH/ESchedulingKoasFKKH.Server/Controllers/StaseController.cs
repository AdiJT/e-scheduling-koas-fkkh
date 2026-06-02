using ESchedulingKoasFKKH.Server.Controllers.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StaseController : ControllerBase
{
    // ══════════════════════════════════════════════════════════════
    // 🔶 Data dummy sementara (in-memory)
    //    Nanti diganti dengan IStaseRepository + IUnitOfWork
    //    saat infrastructure sudah tersedia dari teman Anda.
    // ══════════════════════════════════════════════════════════════
    private static readonly List<StaseItem> _staseList =
    [
        new() { Id = 1, Nama = "Bedah", Waktu = 4, Jenis = "Terpisah" },
        new() { Id = 2, Nama = "Penyakit Dalam", Waktu = 4, Jenis = "Terpisah" },
        new() { Id = 3, Nama = "Radiologi", Waktu = 2, Jenis = "Bersamaan" },
        new() { Id = 4, Nama = "Reproduksi", Waktu = 4, Jenis = "Terpisah" },
        new() { Id = 5, Nama = "Kesmavet", Waktu = 2, Jenis = "Bersamaan" },
    ];
    private static int _nextId = 6;

    // ────────────────────────────────────────────
    // GET /api/stase → Ambil semua stase
    // ────────────────────────────────────────────
    [HttpGet]
    public IActionResult GetAll()
    {
        var response = _staseList.Select(s => new StaseResponse(
            s.Id, s.Nama, s.Waktu, s.Jenis
        )).ToList();

        return Ok(response);
    }

    // ────────────────────────────────────────────
    // GET /api/stase/{id} → Ambil stase berdasarkan ID
    // ────────────────────────────────────────────
    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var stase = _staseList.FirstOrDefault(s => s.Id == id);

        if (stase is null)
            return NotFound(new { message = $"Stase dengan ID {id} tidak ditemukan" });

        return Ok(new StaseResponse(stase.Id, stase.Nama, stase.Waktu, stase.Jenis));
    }

    // ────────────────────────────────────────────
    // POST /api/stase → Tambah stase baru
    // ────────────────────────────────────────────
    [HttpPost]
    public IActionResult Create([FromBody] CreateStaseRequest request)
    {
        // Validasi sederhana
        if (string.IsNullOrWhiteSpace(request.Nama))
            return BadRequest(new { message = "Nama stase tidak boleh kosong" });

        if (request.Waktu <= 0)
            return BadRequest(new { message = "Waktu harus lebih dari 0 minggu" });

        if (request.Jenis != "Terpisah" && request.Jenis != "Bersamaan")
            return BadRequest(new { message = "Jenis harus 'Terpisah' atau 'Bersamaan'" });

        var newStase = new StaseItem
        {
            Id = _nextId++,
            Nama = request.Nama,
            Waktu = request.Waktu,
            Jenis = request.Jenis
        };

        _staseList.Add(newStase);

        var response = new StaseResponse(newStase.Id, newStase.Nama, newStase.Waktu, newStase.Jenis);

        // CreatedAtAction → return HTTP 201 + header Location: /api/stase/{id}
        return CreatedAtAction(nameof(GetById), new { id = newStase.Id }, response);
    }

    // ────────────────────────────────────────────
    // PUT /api/stase/{id} → Update stase
    // ────────────────────────────────────────────
    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] UpdateStaseRequest request)
    {
        var stase = _staseList.FirstOrDefault(s => s.Id == id);

        if (stase is null)
            return NotFound(new { message = $"Stase dengan ID {id} tidak ditemukan" });

        if (string.IsNullOrWhiteSpace(request.Nama))
            return BadRequest(new { message = "Nama stase tidak boleh kosong" });

        if (request.Waktu <= 0)
            return BadRequest(new { message = "Waktu harus lebih dari 0 minggu" });

        // Update data
        stase.Nama = request.Nama;
        stase.Waktu = request.Waktu;
        stase.Jenis = request.Jenis;

        return Ok(new StaseResponse(stase.Id, stase.Nama, stase.Waktu, stase.Jenis));
    }

    // ────────────────────────────────────────────
    // DELETE /api/stase/{id} → Hapus stase
    // ────────────────────────────────────────────
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var stase = _staseList.FirstOrDefault(s => s.Id == id);

        if (stase is null)
            return NotFound(new { message = $"Stase dengan ID {id} tidak ditemukan" });

        _staseList.Remove(stase);

        return NoContent(); // HTTP 204 - berhasil dihapus, tanpa body
    }
}

/// <summary>
/// Model internal sementara sebagai pengganti Entity dari Domain.
/// Nanti saat infrastructure ready, class ini bisa dihapus
/// dan diganti dengan Entity Stase dari Domain layer.
/// </summary>
internal class StaseItem
{
    public int Id { get; set; }
    public string Nama { get; set; } = "";
    public int Waktu { get; set; }
    public string Jenis { get; set; } = "";
}
