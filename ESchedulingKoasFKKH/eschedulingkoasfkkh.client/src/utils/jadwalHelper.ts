import { type Jadwal, type JadwalSubStase } from '../services/api';

/**
 * Checks whether a given Dosen (identified by profileId) is supervising the schedule,
 * either as the main stase pembimbing or as a sub-stase pembimbing (e.g. Kodil).
 */
export function isDosenSupervising(jadwal: Jadwal, profileId?: number | null): boolean {
  if (!profileId) return false;

  // 1. Direct main supervisor check
  if (jadwal.idPembimbing === profileId) {
    return true;
  }

  // 2. Sub-stase supervisor check (e.g. Kodil 5 sub-stase)
  if (jadwal.daftarSubStase && jadwal.daftarSubStase.length > 0) {
    return jadwal.daftarSubStase.some(
      (sub: JadwalSubStase) =>
        sub.idPembimbing === profileId ||
        (sub as any).daftarPembimbing?.some((dp: any) => dp.id === profileId)
    );
  }

  return false;
}

/**
 * Retrieves the specific sub-stase assigned to this Dosen, if any.
 */
export function getDosenSubStase(jadwal: Jadwal, profileId?: number | null): JadwalSubStase | null {
  if (!profileId || !jadwal.daftarSubStase) return null;
  return (
    jadwal.daftarSubStase.find(
      (sub: JadwalSubStase) =>
        sub.idPembimbing === profileId ||
        (sub as any).daftarPembimbing?.some((dp: any) => dp.id === profileId)
    ) || null
  );
}
