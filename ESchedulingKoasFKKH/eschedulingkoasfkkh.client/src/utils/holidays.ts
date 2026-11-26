/* eslint-disable prefer-const */
// ============================================================
// Holiday utility for calculating end dates & displaying calendar holidays
// Supports dynamic holiday ranges fetched from backend database,
// with default fallback data while loading or if offline.
// ============================================================

export interface Holiday {
  date: string; // "YYYY-MM-DD"
  name: string;
}

export interface HolidayRange {
  id?: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  nama: string;
  keterangan?: string | null;
}

function expandRangeEntries(mulaiStr: string, selesaiStr: string, nama: string): Holiday[] {
  const results: Holiday[] = [];
  const start = new Date(mulaiStr + 'T00:00:00');
  const end = new Date((selesaiStr || mulaiStr) + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return results;

  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 120) {
    results.push({ date: formatDate(cursor), name: nama });
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return results;
}

// Fallback default hari libur 2026 (sama dengan seed database)
const defaultHolidays2026: Holiday[] = [
  { date: '2026-01-16', name: 'Isra Mikraj Muhammad SAW' },
  { date: '2026-02-16', name: 'Cuti Bersama & Tahun Baru Imlek' },
  { date: '2026-02-17', name: 'Cuti Bersama & Tahun Baru Imlek' },
  { date: '2026-02-19', name: '1 Ramadhan' },
  ...expandRangeEntries('2026-03-16', '2026-03-30', 'Libur Ramadhan & Idul Fitri'),
  ...expandRangeEntries('2026-04-01', '2026-04-07', 'Libur Paskah'),
  { date: '2026-05-01', name: 'Hari Buruh Internasional' },
  { date: '2026-05-14', name: 'Kenaikan Isa Al Masih' },
  { date: '2026-05-15', name: 'Cuti Bersama Kenaikan Isa Al Masih' },
  { date: '2026-05-27', name: 'Hari Raya Idul Adha' },
  { date: '2026-05-28', name: 'Cuti Bersama Idul Adha' },
  { date: '2026-05-31', name: 'Hari Raya Waisak' },
  { date: '2026-06-01', name: 'Hari Lahir Pancasila' },
  { date: '2026-06-16', name: '1 Muharam (Tahun Baru Islam)' },
  { date: '2026-08-17', name: 'Hari Proklamasi Kemerdekaan RI' },
  { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW' },
  ...expandRangeEntries('2026-12-22', '2026-12-31', 'Libur Natal dan Tahun Baru'),
];

const defaultHolidays2027: Holiday[] = [
  ...expandRangeEntries('2027-01-01', '2027-01-02', 'Libur Natal dan Tahun Baru'),
];

const fallbackHolidaysByYear: Record<number, Holiday[]> = {
  2026: defaultHolidays2026,
  2027: defaultHolidays2027,
};

let dynamicHolidaysByYear: Record<number, Holiday[]> | null = null;

/**
 * Expand array of HolidayRange from API into per-day Holiday items
 */
export function expandHolidayRanges(ranges: HolidayRange[]): Holiday[] {
  const expanded: Holiday[] = [];
  for (const r of ranges) {
    expanded.push(...expandRangeEntries(r.tanggalMulai, r.tanggalSelesai, r.nama));
  }
  return expanded;
}

/**
 * Store dynamic holidays fetched from backend API into module cache
 */
export function setDynamicHolidays(ranges: HolidayRange[]): void {
  const byYear: Record<number, Holiday[]> = {};
  const expanded = expandHolidayRanges(ranges);
  for (const h of expanded) {
    const year = Number(h.date.slice(0, 4));
    if (!Number.isNaN(year)) {
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(h);
    }
  }
  dynamicHolidaysByYear = byYear;
}

function getSourceByYear(): Record<number, Holiday[]> {
  return dynamicHolidaysByYear ?? fallbackHolidaysByYear;
}

/**
 * Get set of holiday date strings for a given year
 */
function getHolidaySet(year: number, customHolidays?: Holiday[]): Set<string> {
  if (customHolidays) {
    return new Set(customHolidays.filter(h => h.date.startsWith(`${year}-`)).map(h => h.date));
  }
  const holidays = getSourceByYear()[year] || [];
  return new Set(holidays.map(h => h.date));
}

/**
 * Get holidays for a specific year
 */
export function getHolidays(year: number): Holiday[] {
  return getSourceByYear()[year] || [];
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate end date from start date + number of weeks (7 days per week)
 * Skips holidays, but includes weekends (Saturday and Sunday) as working days
 */
export function calculateEndDate(startDateStr: string, weeks: number, customHolidays?: Holiday[]): string {
  const workingDays = weeks * 7;
  const startDate = new Date(startDateStr + 'T00:00:00');
  const startYear = startDate.getFullYear();

  const holidaySet = new Set<string>();
  for (const d of getHolidaySet(startYear, customHolidays)) holidaySet.add(d);
  for (const d of getHolidaySet(startYear + 1, customHolidays)) holidaySet.add(d);

  let currentDate = new Date(startDate);
  let countedDays = 0;

  while (countedDays < workingDays) {
    if (!holidaySet.has(formatDate(currentDate))) {
      countedDays++;
    }
    if (countedDays < workingDays) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return formatDate(currentDate);
}

/**
 * Format a date string to Indonesian locale display
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get holidays that fall within a date range
 */
export function getHolidaysInRange(startStr: string, endStr: string, customHolidays?: Holiday[]): Holiday[] {
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  const source = getSourceByYear();
  const year = start.getFullYear();

  const allHolidays = customHolidays
    ? customHolidays
    : [...(source[year] || []), ...(source[year + 1] || [])];

  return allHolidays.filter(h => {
    const d = new Date(h.date + 'T00:00:00');
    return d >= start && d <= end;
  });
}
