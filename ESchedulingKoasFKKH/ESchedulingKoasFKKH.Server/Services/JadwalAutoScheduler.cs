using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using ESchedulingKoasFKKH.Domain.Shared;

namespace ESchedulingKoasFKKH.Server.Services;

public interface IJadwalAutoScheduler
{
    Task<Result<GenerateJadwalResult>> GenerateAsync(CancellationToken cancellationToken = default);
}

public sealed class GenerateJadwalResult
{
    public required DateOnly TanggalMulaiAcuan { get; init; }
    public int JadwalDibuat { get; set; }
    public int KelompokDiproses { get; set; }
    public List<GenerateJadwalKelompokSummary> KelompokBerhasil { get; init; } = [];
    public List<GenerateJadwalKelompokSummary> KelompokTanpaPerubahan { get; init; } = [];
    public List<GenerateJadwalKelompokSummary> KelompokDilewati { get; init; } = [];
}

public sealed class GenerateJadwalKelompokSummary
{
    public required int Id { get; init; }
    public required string Nama { get; init; }
    public int JadwalDibuat { get; init; }
    public required string Pesan { get; init; }
    public List<string> StaseDibuat { get; init; } = [];
}

internal sealed class JadwalAutoScheduler : IJadwalAutoScheduler
{
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IStaseRepository _staseRepository;
    private readonly IJadwalRepository _jadwalRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHariLiburService _hariLiburService;

    public JadwalAutoScheduler(
        IKelompokRepository kelompokRepository,
        IStaseRepository staseRepository,
        IJadwalRepository jadwalRepository,
        IUnitOfWork unitOfWork,
        IHariLiburService hariLiburService)
    {
        _kelompokRepository = kelompokRepository;
        _staseRepository = staseRepository;
        _jadwalRepository = jadwalRepository;
        _unitOfWork = unitOfWork;
        _hariLiburService = hariLiburService;
    }

    public async Task<Result<GenerateJadwalResult>> GenerateAsync(CancellationToken cancellationToken = default)
    {
        var staseList = await _staseRepository.GetAll();
        var kelompokList = await _kelompokRepository.GetAll();

        var tanggalMulaiAcuan = GeserKeHariKerja(CultureInfos.DateOnlyNow);
        var result = new GenerateJadwalResult
        {
            TanggalMulaiAcuan = tanggalMulaiAcuan,
            KelompokDiproses = kelompokList.Count,
        };

        if (staseList.Count == 0 || kelompokList.Count == 0)
            return result;

        var pemakaianStaseTerpisah = BangunPetaPemakaianStaseTerpisah(staseList);
        var idStaseSeminar = staseList
            .Where(IsSeminar)
            .Select(x => x.Id)
            .ToHashSet();

        foreach (var kelompok in kelompokList.OrderBy(x => DapatkanTanggalMulaiKelompok(x, tanggalMulaiAcuan)).ThenBy(x => x.Id))
        {
            if (kelompok.Pembimbing is null)
            {
                result.KelompokDilewati.Add(new GenerateJadwalKelompokSummary
                {
                    Id = kelompok.Id,
                    Nama = kelompok.Nama,
                    JadwalDibuat = 0,
                    Pesan = "Kelompok dilewati karena belum memiliki pembimbing.",
                });
                continue;
            }

            var staseSudahAda = kelompok.DaftarJadwal
                .Select(x => x.Stase.Id)
                .ToHashSet();

            var staseTersisa = staseList
                .Where(x => !staseSudahAda.Contains(x.Id))
                .ToList();

            if (staseTersisa.Count == 0)
            {
                result.KelompokTanpaPerubahan.Add(new GenerateJadwalKelompokSummary
                {
                    Id = kelompok.Id,
                    Nama = kelompok.Nama,
                    JadwalDibuat = 0,
                    Pesan = "Semua stase untuk kelompok ini sudah memiliki jadwal.",
                });
                continue;
            }

            var tanggalBerikutnya = DapatkanTanggalMulaiKelompok(kelompok, tanggalMulaiAcuan);
            var staseDibuat = new List<string>();

            while (staseTersisa.Count > 0)
            {
                var kandidat = PilihKandidatStaseTerbaik(
                    staseTersisa,
                    staseSudahAda,
                    tanggalBerikutnya,
                    pemakaianStaseTerpisah,
                    idStaseSeminar);

                if (kandidat is null)
                    break;

                var stase = kandidat.Stase;
                var tanggalMulai = kandidat.TanggalMulai;
                var tanggalSelesai = kandidat.TanggalSelesai;

                _jadwalRepository.Add(new Jadwal
                {
                    TanggalMulai = tanggalMulai,
                    Kelompok = kelompok,
                    Stase = stase,
                });

                if (stase.Jenis == JenisStase.Terpisah)
                    pemakaianStaseTerpisah[stase.Id].Add(new RentangTanggal(tanggalMulai, tanggalSelesai));

                staseDibuat.Add(stase.Nama);
                staseSudahAda.Add(stase.Id);
                staseTersisa.RemoveAll(x => x.Id == stase.Id);
                tanggalBerikutnya = GeserKeHariKerja(tanggalSelesai.AddDays(1));
            }

            result.JadwalDibuat += staseDibuat.Count;

            result.KelompokBerhasil.Add(new GenerateJadwalKelompokSummary
            {
                Id = kelompok.Id,
                Nama = kelompok.Nama,
                JadwalDibuat = staseDibuat.Count,
                Pesan = staseDibuat.Count == 0
                    ? "Tidak ada jadwal baru yang perlu dibuat."
                    : $"Berhasil membuat {staseDibuat.Count} jadwal otomatis.",
                StaseDibuat = staseDibuat,
            });
        }

        if (result.JadwalDibuat == 0)
            return result;

        var saveResult = await _unitOfWork.SaveChangesAsync(cancellationToken);
        if (saveResult.IsFailure)
            return saveResult.Error;

        return result;
    }

    private Dictionary<int, List<RentangTanggal>> BangunPetaPemakaianStaseTerpisah(IEnumerable<Stase> staseList)
    {
        return staseList
            .Where(x => x.Jenis == JenisStase.Terpisah)
            .ToDictionary(
                x => x.Id,
                x => x.DaftarJadwal
                    .Select(j => new RentangTanggal(j.TanggalMulai, j.TanggalSelesai(_hariLiburService)))
                    .OrderBy(r => r.Mulai)
                    .ToList());
    }

    private KandidatJadwal? PilihKandidatStaseTerbaik(
        IEnumerable<Stase> staseTersisa,
        HashSet<int> staseSudahAda,
        DateOnly tanggalMulaiMinimal,
        Dictionary<int, List<RentangTanggal>> pemakaianStaseTerpisah,
        HashSet<int> idStaseSeminar)
    {
        return staseTersisa
            .Where(stase => !IsUjian(stase) || idStaseSeminar.Count == 0 || idStaseSeminar.Overlaps(staseSudahAda))
            .Select(stase =>
            {
                var tanggalMulai = stase.Jenis == JenisStase.Terpisah
                    ? CariSlotTerdekatUntukStaseTerpisah(stase, tanggalMulaiMinimal, pemakaianStaseTerpisah[stase.Id])
                    : GeserKeHariKerja(tanggalMulaiMinimal);

                return new KandidatJadwal(
                    stase,
                    tanggalMulai,
                    HitungTanggalSelesai(tanggalMulai, stase));
            })
            .OrderBy(x => x.TanggalMulai)
            .ThenBy(x => x.Stase.Jenis == JenisStase.Bersamaan)
            .ThenByDescending(x => x.Stase.Waktu)
            .ThenBy(x => x.TanggalSelesai)
            .ThenBy(x => x.Stase.Nama)
            .FirstOrDefault();
    }

    private DateOnly DapatkanTanggalMulaiKelompok(Kelompok kelompok, DateOnly tanggalMulaiAcuan)
    {
        if (kelompok.DaftarJadwal.Count == 0)
            return tanggalMulaiAcuan;

        var tanggalSelesaiTerakhir = kelompok.DaftarJadwal
            .Max(x => x.TanggalSelesai(_hariLiburService));

        var tanggalMulaiBerikutnya = tanggalSelesaiTerakhir.AddDays(1);

        if (tanggalMulaiBerikutnya < tanggalMulaiAcuan)
            tanggalMulaiBerikutnya = tanggalMulaiAcuan;

        return GeserKeHariKerja(tanggalMulaiBerikutnya);
    }

    private DateOnly CariSlotTerdekatUntukStaseTerpisah(Stase stase, DateOnly tanggalMulaiMinimal, List<RentangTanggal> daftarPemakaian)
    {
        var kandidatMulai = GeserKeHariKerja(tanggalMulaiMinimal);

        while (true)
        {
            var kandidatSelesai = HitungTanggalSelesai(kandidatMulai, stase);
            var tabrakan = daftarPemakaian
                .OrderBy(x => x.Mulai)
                .FirstOrDefault(x => ApakahBertabrakan(kandidatMulai, kandidatSelesai, x.Mulai, x.Selesai));

            if (tabrakan is null)
                return kandidatMulai;

            kandidatMulai = GeserKeHariKerja(tabrakan.Selesai.AddDays(1));
        }
    }

    private DateOnly HitungTanggalSelesai(DateOnly tanggalMulai, Stase stase)
    {
        return new Jadwal
        {
            TanggalMulai = tanggalMulai,
            Stase = stase,
            Kelompok = new Kelompok { Nama = "_" }
        }.TanggalSelesai(_hariLiburService);
    }

    private DateOnly GeserKeHariKerja(DateOnly tanggal)
    {
        var hasil = tanggal;

        while (_hariLiburService.HariLibur(hasil))
            hasil = hasil.AddDays(1);

        return hasil;
    }

    private static bool ApakahBertabrakan(DateOnly mulaiA, DateOnly selesaiA, DateOnly mulaiB, DateOnly selesaiB)
    {
        return mulaiA <= selesaiB && mulaiB <= selesaiA;
    }

    private static bool IsSeminar(Stase stase)
    {
        return stase.Nama.Contains("Seminar", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsUjian(Stase stase)
    {
        return stase.Nama.Contains("Ujian", StringComparison.OrdinalIgnoreCase)
            || stase.Nama.Contains("Komprehensif", StringComparison.OrdinalIgnoreCase);
    }

    private sealed record KandidatJadwal(Stase Stase, DateOnly TanggalMulai, DateOnly TanggalSelesai);
    private sealed record RentangTanggal(DateOnly Mulai, DateOnly Selesai);
}
