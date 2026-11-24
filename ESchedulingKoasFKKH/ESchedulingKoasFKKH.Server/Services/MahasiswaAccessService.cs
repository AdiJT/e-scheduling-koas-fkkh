using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;

namespace ESchedulingKoasFKKH.Server.Services;

public sealed class MahasiswaAccessStatusDto
{
    public int MahasiswaId { get; set; }
    public string Nim { get; set; } = string.Empty;
    public string Nama { get; set; } = string.Empty;
    public int? IdKelompok { get; set; }
    public string? NamaKelompok { get; set; }
    public int? IdTahunAjaran { get; set; }
    public string? TahunAjaran { get; set; }
    public DateOnly? TanggalMulaiPeriode { get; set; }
    public DateOnly? TanggalSelesaiPeriode { get; set; }
    public string StatusPeriode { get; set; } = "Belum Ditentukan";
    public bool IsDalamPeriodeAktif { get; set; }
    public bool IsRotasiSelesai { get; set; }
    public bool SudahSelesaiAtauTerlewat { get; set; }
    public bool CanViewJadwalDanKelompok { get; set; }
    public string? AlasanPembatasan { get; set; }
}

public interface IMahasiswaAccessService
{
    Task<MahasiswaAccessStatusDto?> EvaluateByUsernameAsync(string? username);
    Task<MahasiswaAccessStatusDto> EvaluateAsync(Mahasiswa mahasiswa);
    Task<HashSet<int>> GetActiveTahunAjaranIdsAsync(DateOnly? acuanTanggal = null);
    TahunAjaran? ResolveTahunAjaranKelompok(Kelompok? kelompok);
    bool IsKelompokInActivePeriod(Kelompok? kelompok, HashSet<int> activeTahunAjaranIds, DateOnly today);
}

public class MahasiswaAccessService : IMahasiswaAccessService
{
    private readonly IMahasiswaRepository _mahasiswaRepository;
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IStaseRepository _staseRepository;
    private readonly ITahunAjaranRepository _tahunAjaranRepository;
    private readonly IHariLiburService _hariLiburService;

    public MahasiswaAccessService(
        IMahasiswaRepository mahasiswaRepository,
        IKelompokRepository kelompokRepository,
        IStaseRepository staseRepository,
        ITahunAjaranRepository tahunAjaranRepository,
        IHariLiburService hariLiburService)
    {
        _mahasiswaRepository = mahasiswaRepository;
        _kelompokRepository = kelompokRepository;
        _staseRepository = staseRepository;
        _tahunAjaranRepository = tahunAjaranRepository;
        _hariLiburService = hariLiburService;
    }

    public async Task<MahasiswaAccessStatusDto?> EvaluateByUsernameAsync(string? username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return null;

        var mahasiswa = await _mahasiswaRepository.Get(username.Trim());
        if (mahasiswa is null)
            return null;

        return await EvaluateAsync(mahasiswa);
    }

    public async Task<MahasiswaAccessStatusDto> EvaluateAsync(Mahasiswa mahasiswa)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var kelompok = mahasiswa.Kelompok;

        if (kelompok is not null && (kelompok.DaftarJadwal.Any(j => j.Stase is null) || kelompok.TahunAjaran is null))
        {
            kelompok = await _kelompokRepository.Get(kelompok.Id) ?? kelompok;
        }

        var periode = mahasiswa.TahunAjaran ?? kelompok?.TahunAjaran;
        var semuaStase = await _staseRepository.GetAll();

        bool isRotasiSelesai = false;
        if (kelompok is not null && kelompok.DaftarJadwal.Count > 0)
        {
            var semuaJadwalSudahLewat = kelompok.DaftarJadwal.All(j =>
                j.Stase is not null && j.TanggalSelesai(_hariLiburService) < today);
            var sudahCapaiUjian = kelompok.DaftarJadwal.Any(j => j.Stase?.Jenis == JenisStase.Ujian);
            var semuaStaseTerjadwal = semuaStase.Count > 0 &&
                semuaStase.All(s => kelompok.DaftarJadwal.Any(j => j.Stase?.Id == s.Id));

            isRotasiSelesai = semuaJadwalSudahLewat && (sudahCapaiUjian || semuaStaseTerjadwal);
        }

        var isPeriodeTerlewat = periode is not null && today > periode.TanggalSelesai;
        var isPeriodeBerjalan = periode is not null && periode.IsAktif(today);
        var sudahSelesaiAtauTerlewat = isPeriodeTerlewat || isRotasiSelesai;
        var isDalamPeriodeAktif = isPeriodeBerjalan && !sudahSelesaiAtauTerlewat;
        var canViewJadwalDanKelompok = isDalamPeriodeAktif;
        var statusPeriode = isRotasiSelesai
            ? "Selesai"
            : (periode?.GetStatusLabel(today) ?? "Belum Ditentukan");

        string? alasanPembatasan = null;
        if (!canViewJadwalDanKelompok)
        {
            if (isRotasiSelesai)
            {
                alasanPembatasan = "Seluruh rangkaian jadwal stase KOAS kelompok Anda telah selesai. Anda hanya dapat melihat riwayat kelompok Anda.";
            }
            else if (isPeriodeTerlewat && periode is not null)
            {
                alasanPembatasan = $"Periode KOAS Anda ({periode.Tahun} - {periode.Semester}) telah berakhir pada {periode.TanggalSelesai:dd/MM/yyyy}. Anda hanya dapat melihat riwayat kelompok Anda.";
            }
            else if (periode is not null && today < periode.TanggalMulai)
            {
                alasanPembatasan = $"Periode KOAS Anda ({periode.Tahun} - {periode.Semester}) belum dimulai (mulai {periode.TanggalMulai:dd/MM/yyyy}). Menu Jadwal dan Kelompok aktif akan tersedia saat periode berjalan.";
            }
            else
            {
                alasanPembatasan = "Periode tahun ajaran KOAS Anda belum ditentukan. Silakan hubungi pengelola atau administrator.";
            }
        }

        return new MahasiswaAccessStatusDto
        {
            MahasiswaId = mahasiswa.Id,
            Nim = mahasiswa.NIM,
            Nama = mahasiswa.Nama,
            IdKelompok = kelompok?.Id,
            NamaKelompok = kelompok?.Nama,
            IdTahunAjaran = periode?.Id ?? kelompok?.IdTahunAjaran,
            TahunAjaran = periode is not null ? $"{periode.Tahun} - {periode.Semester}" : null,
            TanggalMulaiPeriode = periode?.TanggalMulai,
            TanggalSelesaiPeriode = periode?.TanggalSelesai,
            StatusPeriode = statusPeriode,
            IsDalamPeriodeAktif = isDalamPeriodeAktif,
            IsRotasiSelesai = isRotasiSelesai,
            SudahSelesaiAtauTerlewat = sudahSelesaiAtauTerlewat,
            CanViewJadwalDanKelompok = canViewJadwalDanKelompok,
            AlasanPembatasan = alasanPembatasan
        };
    }

    public async Task<HashSet<int>> GetActiveTahunAjaranIdsAsync(DateOnly? acuanTanggal = null)
    {
        var today = acuanTanggal ?? DateOnly.FromDateTime(DateTime.Today);
        var allTahunAjaran = await _tahunAjaranRepository.GetAll();
        return allTahunAjaran
            .Where(ta => ta.IsAktif(today))
            .Select(ta => ta.Id)
            .ToHashSet();
    }

    public TahunAjaran? ResolveTahunAjaranKelompok(Kelompok? kelompok)
    {
        return kelompok?.TahunAjaran
            ?? kelompok?.DaftarMahasiswa?.FirstOrDefault(m => m.TahunAjaran is not null)?.TahunAjaran;
    }

    public bool IsKelompokInActivePeriod(Kelompok? kelompok, HashSet<int> activeTahunAjaranIds, DateOnly today)
    {
        if (kelompok is null)
            return false;

        var ta = ResolveTahunAjaranKelompok(kelompok);
        if (ta is not null)
            return ta.IsAktif(today) || activeTahunAjaranIds.Contains(ta.Id);

        if (kelompok.IdTahunAjaran.HasValue)
            return activeTahunAjaranIds.Contains(kelompok.IdTahunAjaran.Value);

        return false;
    }
}
