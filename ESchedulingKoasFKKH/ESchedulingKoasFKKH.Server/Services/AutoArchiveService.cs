using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using System.Text.Json;

namespace ESchedulingKoasFKKH.Server.Services;

public interface IAutoArchiveService
{
    Task AutoArchiveCompletedSchedulesAsync();
}

public class AutoArchiveService : IAutoArchiveService
{
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IRiwayatKelompokRepository _riwayatKelompokRepository;
    private readonly IHariLiburService _hariLiburService;
    private readonly IUnitOfWork _unitOfWork;

    public AutoArchiveService(
        IKelompokRepository kelompokRepository,
        IRiwayatKelompokRepository riwayatKelompokRepository,
        IHariLiburService hariLiburService,
        IUnitOfWork unitOfWork)
    {
        _kelompokRepository = kelompokRepository;
        _riwayatKelompokRepository = riwayatKelompokRepository;
        _hariLiburService = hariLiburService;
        _unitOfWork = unitOfWork;
    }

    public async Task AutoArchiveCompletedSchedulesAsync()
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
                    // Extract Tahun Ajaran from students or kelompok
                    string tahunAjaranStr = "N/A";
                    if (kel.TahunAjaran is not null)
                    {
                        tahunAjaranStr = $"{kel.TahunAjaran.Tahun} - {kel.TahunAjaran.Semester}";
                    }
                    else if (kel.DaftarMahasiswa.Count > 0)
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

                    var mhsJson = JsonSerializer.Serialize(mhsList);
                    var subStaseJson = JsonSerializer.Serialize(subStasesList);

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
