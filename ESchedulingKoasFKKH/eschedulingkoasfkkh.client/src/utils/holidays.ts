/* eslint-disable prefer-const */
// ============================================================
// Holiday utility for calculating end dates
// Holidays are defined per year and can be updated annually
// ============================================================

export interface Holiday {
  date: string; // "YYYY-MM-DD"
  name: string;
}

// Hari libur nasional 2026 (sesuai jadwal dari user)
// Perlu di-update setiap tahun karena hari libur bisa berubah
const holidays2026: Holiday[] = [
  // Januari
  { date: '2026-01-16', name: 'Isra Mikraj Muhammad SAW' },
  // Februari
  { date: '2026-02-16', name: 'Cuti Bersama Tahun Baru Imlek' },
  { date: '2026-02-17', name: 'Tahun Baru Imlek' },
  { date: '2026-02-19', name: '1 Ramadhan' },
  // Maret (16-30 Ramadhan)
  { date: '2026-03-16', name: 'Ramadhan' },
  { date: '2026-03-17', name: 'Ramadhan' },
  { date: '2026-03-18', name: 'Ramadhan' },
  { date: '2026-03-19', name: 'Ramadhan' },
  { date: '2026-03-20', name: 'Ramadhan' },
  { date: '2026-03-21', name: 'Ramadhan' },
  { date: '2026-03-22', name: 'Ramadhan' },
  { date: '2026-03-23', name: 'Ramadhan' },
  { date: '2026-03-24', name: 'Ramadhan' },
  { date: '2026-03-25', name: 'Ramadhan' },
  { date: '2026-03-26', name: 'Ramadhan' },
  { date: '2026-03-27', name: 'Ramadhan' },
  { date: '2026-03-28', name: 'Ramadhan' },
  { date: '2026-03-29', name: 'Ramadhan' },
  { date: '2026-03-30', name: 'Ramadhan' },
  // April (1-7 Paskah)
  { date: '2026-04-01', name: 'Paskah' },
  { date: '2026-04-02', name: 'Paskah' },
  { date: '2026-04-03', name: 'Paskah' },
  { date: '2026-04-04', name: 'Paskah' },
  { date: '2026-04-05', name: 'Paskah' },
  { date: '2026-04-06', name: 'Paskah' },
  { date: '2026-04-07', name: 'Paskah' },
  // Mei
  { date: '2026-05-01', name: 'Hari Buruh Internasional' },
  { date: '2026-05-14', name: 'Kenaikan Isa Al Masih' },
  { date: '2026-05-15', name: 'Cuti Bersama Kenaikan Isa Al Masih' },
  { date: '2026-05-27', name: 'Idul Adha' },
  { date: '2026-05-28', name: 'Idul Adha' },
  { date: '2026-05-31', name: 'Hari Raya Waisak' },
  // Juni
  { date: '2026-06-01', name: 'Hari Lahir Pancasila' },
  { date: '2026-06-16', name: '1 Muharam' },
  // Agustus
  { date: '2026-08-17', name: 'Hari Proklamasi' },
  { date: '2026-08-25', name: 'Maulid Nabi Muhammad' },
  // November - Desember (22 Nov - 2 Jan = Natal dan Tahun Baru)
  { date: '2026-11-22', name: 'Natal dan Tahun Baru' },
  { date: '2026-11-23', name: 'Natal dan Tahun Baru' },
  { date: '2026-11-24', name: 'Natal dan Tahun Baru' },
  { date: '2026-11-25', name: 'Natal dan Tahun Baru' },
  { date: '2026-11-26', name: 'Natal dan Tahun Baru' },
  { date: '2026-11-27', name: 'Natal dan Tahun Baru' },
  { date: '2026-11-28', name: 'Natal dan Tahun Baru' },
  { date: '2026-11-29', name: 'Natal dan Tahun Baru' },
  { date: '2026-11-30', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-01', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-02', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-03', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-04', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-05', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-06', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-07', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-08', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-09', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-10', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-11', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-12', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-13', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-14', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-15', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-16', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-17', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-18', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-19', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-20', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-21', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-22', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-23', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-24', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-25', name: 'Natal' },
  { date: '2026-12-26', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-27', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-28', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-29', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-30', name: 'Natal dan Tahun Baru' },
  { date: '2026-12-31', name: 'Tahun Baru' },
];

// Combine all holidays by year
const holidaysByYear: Record<number, Holiday[]> = {
  2026: holidays2026,
};

/**
 * Get set of holiday date strings for a given year
 */
function getHolidaySet(year: number): Set<string> {
  const holidays = holidaysByYear[year] || [];
  return new Set(holidays.map(h => h.date));
}

/**
 * Get holidays for a specific year
 */
export function getHolidays(year: number): Holiday[] {
  return holidaysByYear[year] || [];
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
 * 
 * @param startDateStr - Start date in "YYYY-MM-DD" format
 * @param weeks - Duration in weeks (e.g., 1 means 7 days)
 * @returns End date in "YYYY-MM-DD" format
 */
export function calculateEndDate(startDateStr: string, weeks: number): string {
  const workingDays = weeks * 7; // 7 working days per week
  const startDate = new Date(startDateStr + 'T00:00:00');
  const startYear = startDate.getFullYear();
  
  // Build holiday sets for start year and next year (in case schedule spans years)
  const holidaySet = new Set<string>();
  for (const d of getHolidaySet(startYear)) holidaySet.add(d);
  for (const d of getHolidaySet(startYear + 1)) holidaySet.add(d);
  
  let currentDate = new Date(startDate);
  let countedDays = 0;
  
  // Start from the start date - count it as day 1 if it's a working day
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
export function getHolidaysInRange(startStr: string, endStr: string): Holiday[] {
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  const year = start.getFullYear();
  
  const allHolidays = [...(holidaysByYear[year] || []), ...(holidaysByYear[year + 1] || [])];
  
  return allHolidays.filter(h => {
    const d = new Date(h.date + 'T00:00:00');
    return d >= start && d <= end;
  });
}
