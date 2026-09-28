using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;

namespace ESchedulingKoasFKKH.Server.Helpers;

public static class TahunAjaranStatusCalculator
{
    public static StatusTahunAjaran HitungStatus(
        IEnumerable<Jadwal> daftarJadwal,
        IHariLiburService hariLiburService,
        DateOnly? acuanTanggal = null)
    {
        var list = daftarJadwal.ToList();
        if (list.Count == 0)
        {
            return StatusTahunAjaran.AkanDatang;
        }

        var today = acuanTanggal ?? DateOnly.FromDateTime(DateTime.Today);
        var minTanggalMulai = list.Min(j => j.TanggalMulai);
        var maxTanggalSelesai = list.Max(j => j.TanggalSelesai(hariLiburService));

        if (today < minTanggalMulai)
        {
            return StatusTahunAjaran.AkanDatang;
        }
        else if (today <= maxTanggalSelesai)
        {
            return StatusTahunAjaran.Berjalan;
        }
        else
        {
            return StatusTahunAjaran.Selesai;
        }
    }
}
