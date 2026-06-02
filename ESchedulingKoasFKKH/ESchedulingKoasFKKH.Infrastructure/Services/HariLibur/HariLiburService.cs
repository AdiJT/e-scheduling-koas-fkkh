using ESchedulingKoasFKKH.Domain.Services.HariLibur;

namespace ESchedulingKoasFKKH.Infrastructure.Services.HariLibur;

internal class HariLiburService : IHariLiburService
{
    private class DateRange
    {
        private readonly DateOnly _start;
        private readonly DateOnly _end;

        public DateRange(DateOnly date)
        {
            _start = date;
            _end = date;
        }

        public DateRange(DateOnly start, DateOnly end)
        {
            _start = start;
            _end = end;
        }

        public bool InRange(DateOnly date) => date >= _start && date <= _end;
    }

    private readonly DateRange[] _daftarHariLibur = [
        new DateRange(new DateOnly(2026, 1, 16)),
        new DateRange (new DateOnly(2026, 2, 16), new DateOnly(2026, 2, 17)),
        new DateRange (new DateOnly(2026, 2, 19)),
        new DateRange (new DateOnly(2026, 3, 16), new DateOnly(2026, 3, 30)),
        new DateRange (new DateOnly(2026, 4, 1), new DateOnly(2026, 4, 7)),
        new DateRange (new DateOnly(2026, 5, 1)),
        new DateRange (new DateOnly(2026, 5, 14)),
        new DateRange (new DateOnly(2026, 5, 15)),
        new DateRange (new DateOnly(2026, 5, 27)),
        new DateRange (new DateOnly(2026, 5, 28)),
        new DateRange (new DateOnly(2026, 5, 31)),
        new DateRange (new DateOnly(2026, 6, 1)),
        new DateRange (new DateOnly(2026, 6, 16)),
        new DateRange (new DateOnly(2026, 8, 17)),
        new DateRange (new DateOnly(2026, 8, 25)),
        new DateRange (new DateOnly(2026, 12, 22), new DateOnly(2027, 1, 2)),
    ];

    public bool HariLibur(DateOnly tanggal) => _daftarHariLibur.Any(x => x.InRange(tanggal));
}
