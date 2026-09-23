using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Services.HariLibur;
using ESchedulingKoasFKKH.Server.Controllers.Dtos;

namespace ESchedulingKoasFKKH.Server.Services;

public interface INotifikasiService
{
    Task GenerateScheduleNotificationsAsync();
    Task SendNotificationAsync(int userId, string judul, string pesan, string tipe, string? kategori = null, string? tautan = null, string? metadataKey = null);
    Task<BroadcastItemDto> SendBroadcastAsync(CreateBroadcastDto dto, int senderUserId, string senderName);
    Task<NotifikasiListResponseDto> GetUserNotificationsAsync(int userId, bool? unreadOnly = null, int limit = 50);
    Task<int> GetUnreadCountAsync(int userId);
    Task<bool> MarkAsReadAsync(int notifikasiId, int userId);
    Task MarkAllAsReadAsync(int userId);
    Task<bool> DeleteNotificationAsync(int notifikasiId, int userId);
    Task ClearAllAsync(int userId);
}

public class NotifikasiService : INotifikasiService
{
    private readonly INotifikasiRepository _notifikasiRepository;
    private readonly IBroadcastRepository _broadcastRepository;
    private readonly IUserRepository _userRepository;
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IStaseRepository _staseRepository;
    private readonly IHariLiburService _hariLiburService;
    private readonly IUnitOfWork _unitOfWork;

    public NotifikasiService(
        INotifikasiRepository notifikasiRepository,
        IBroadcastRepository broadcastRepository,
        IUserRepository userRepository,
        IKelompokRepository kelompokRepository,
        IStaseRepository staseRepository,
        IHariLiburService hariLiburService,
        IUnitOfWork unitOfWork)
    {
        _notifikasiRepository = notifikasiRepository;
        _broadcastRepository = broadcastRepository;
        _userRepository = userRepository;
        _kelompokRepository = kelompokRepository;
        _staseRepository = staseRepository;
        _hariLiburService = hariLiburService;
        _unitOfWork = unitOfWork;
    }

    public async Task GenerateScheduleNotificationsAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var allKelompoks = await _kelompokRepository.GetAll();
        var allStase = await _staseRepository.GetAll();
        var staseDict = allStase.ToDictionary(s => s.Id);

        var newNotifications = new List<Notifikasi>();

        foreach (var kel in allKelompoks ?? Enumerable.Empty<Kelompok>())
        {
            if (kel.DaftarJadwal == null || kel.DaftarJadwal.Count == 0) continue;

            // Kumpulkan user ID mahasiswa kelompok
            var studentUserIds = (kel.DaftarMahasiswa ?? Enumerable.Empty<Mahasiswa>())
                .Where(m => m.User != null)
                .Select(m => m.User.Id)
                .Distinct()
                .ToList();

            foreach (var j in kel.DaftarJadwal)
            {
                if (j == null) continue;

                var stase = j.Stase ?? (staseDict.TryGetValue(j.Stase?.Id ?? 0, out var sVal) ? sVal : null);
                string namaStase = stase?.Nama ?? "Stase Klinis";

                DateOnly tglSelesai = j.TanggalMulai;
                try
                {
                    tglSelesai = stase != null ? j.TanggalSelesai(_hariLiburService) : j.TanggalMulai;
                }
                catch
                {
                    tglSelesai = stase != null ? j.TanggalMulai.AddDays(stase.JumlahHari) : j.TanggalMulai;
                }

                // Kumpulkan user ID dosen pengampu/pembimbing
                var lecturerUserIds = new HashSet<int>();
                if (j.Pembimbing?.User != null)
                    lecturerUserIds.Add(j.Pembimbing.User.Id);
                if (stase?.Koordinator?.User != null)
                    lecturerUserIds.Add(stase.Koordinator.User.Id);
                if (stase?.DaftarPembimbing != null)
                {
                    foreach (var p in stase.DaftarPembimbing)
                    {
                        if (p.User != null) lecturerUserIds.Add(p.User.Id);
                    }
                }
                if (j.DaftarJadwalSubStase != null)
                {
                    foreach (var sub in j.DaftarJadwalSubStase)
                    {
                        if (sub.Pembimbing?.User != null)
                            lecturerUserIds.Add(sub.Pembimbing.User.Id);
                    }
                }

                // 1. KEGIATAN AKAN SEGERA DIMULAI (H-3 s/d Hari-H)
                int daysUntilStart = j.TanggalMulai.DayNumber - today.DayNumber;
                if (daysUntilStart >= 0 && daysUntilStart <= 3)
                {
                    string metaKey = $"jadwal_{j.Id}_mulai_{j.TanggalMulai:yyyyMMdd}";
                    string timingText = daysUntilStart == 0
                        ? "hari ini resmi dimulai"
                        : (daysUntilStart == 1 ? "akan dimulai besok" : $"akan segera dimulai dalam {daysUntilStart} hari ({j.TanggalMulai:dd MMM yyyy})");

                    string mhsPesan = $"Stase {namaStase} untuk Kelompok {kel.Nama} {timingText}. Harap mempersiapkan perlengkapan dan jadwal rotasi.";
                    string dosenPesan = $"Stase pengampuan {namaStase} untuk Kelompok {kel.Nama} {timingText}. Harap memeriksa kesiapan bimbingan.";

                    // Mahasiswa
                    foreach (var uId in studentUserIds)
                    {
                        if (!await _notifikasiRepository.ExistsByMetadataKey(uId, metaKey))
                        {
                            newNotifications.Add(new Notifikasi
                            {
                                UserId = uId,
                                Judul = $"Stase Segera Dimulai: {namaStase}",
                                Pesan = mhsPesan,
                                Tipe = "kegiatan_mulai",
                                Kategori = "Jadwal",
                                Tautan = "/jadwal",
                                MetadataKey = metaKey,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            });
                        }
                    }

                    // Dosen
                    foreach (var uId in lecturerUserIds)
                    {
                        if (!await _notifikasiRepository.ExistsByMetadataKey(uId, metaKey))
                        {
                            newNotifications.Add(new Notifikasi
                            {
                                UserId = uId,
                                Judul = $"Stase Segera Dimulai: {namaStase}",
                                Pesan = dosenPesan,
                                Tipe = "kegiatan_mulai",
                                Kategori = "Jadwal",
                                Tautan = "/jadwal",
                                MetadataKey = metaKey,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }

                // 2. KEGIATAN AKAN SEGERA BERAKHIR (H-2 s/d Hari-H)
                int daysUntilEnd = tglSelesai.DayNumber - today.DayNumber;
                if (today <= tglSelesai && daysUntilEnd <= 2 && daysUntilEnd >= 0)
                {
                    string metaKey = $"jadwal_{j.Id}_selesai_{tglSelesai:yyyyMMdd}";
                    string timingText = daysUntilEnd == 0
                        ? "berakhir hari ini"
                        : (daysUntilEnd == 1 ? "akan berakhir besok" : $"akan berakhir dalam {daysUntilEnd} hari ({tglSelesai:dd MMM yyyy})");

                    string mhsPesan = $"Stase {namaStase} untuk Kelompok {kel.Nama} {timingText}. Pastikan seluruh tugas, evaluasi, dan logbook telah diselesaikan.";
                    string dosenPesan = $"Stase {namaStase} untuk Kelompok {kel.Nama} {timingText}. Mohon melakukan penilaian dan evaluasi akhir mahasiswa.";

                    // Mahasiswa
                    foreach (var uId in studentUserIds)
                    {
                        if (!await _notifikasiRepository.ExistsByMetadataKey(uId, metaKey))
                        {
                            newNotifications.Add(new Notifikasi
                            {
                                UserId = uId,
                                Judul = $"Stase Segera Berakhir: {namaStase}",
                                Pesan = mhsPesan,
                                Tipe = "kegiatan_selesai",
                                Kategori = "Jadwal",
                                Tautan = "/jadwal",
                                MetadataKey = metaKey,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            });
                        }
                    }

                    // Dosen
                    foreach (var uId in lecturerUserIds)
                    {
                        if (!await _notifikasiRepository.ExistsByMetadataKey(uId, metaKey))
                        {
                            newNotifications.Add(new Notifikasi
                            {
                                UserId = uId,
                                Judul = $"Stase Segera Berakhir: {namaStase}",
                                Pesan = dosenPesan,
                                Tipe = "kegiatan_selesai",
                                Kategori = "Jadwal",
                                Tautan = "/jadwal",
                                MetadataKey = metaKey,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }
            }
        }

        if (newNotifications.Count > 0)
        {
            _notifikasiRepository.AddRange(newNotifications);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task SendNotificationAsync(int userId, string judul, string pesan, string tipe, string? kategori = null, string? tautan = null, string? metadataKey = null)
    {
        if (!string.IsNullOrEmpty(metadataKey))
        {
            if (await _notifikasiRepository.ExistsByMetadataKey(userId, metadataKey))
                return;
        }

        var notif = new Notifikasi
        {
            UserId = userId,
            Judul = judul,
            Pesan = pesan,
            Tipe = tipe,
            Kategori = kategori ?? "Informasi",
            Tautan = tautan,
            MetadataKey = metadataKey,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _notifikasiRepository.Add(notif);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<BroadcastItemDto> SendBroadcastAsync(CreateBroadcastDto dto, int senderUserId, string senderName)
    {
        var allUsers = await _userRepository.GetAll();
        var targetUsers = new List<User>();

        string targetNamaKelompok = null;
        if (dto.TargetRole.Equals("kelompok", StringComparison.OrdinalIgnoreCase) && dto.TargetKelompokId.HasValue)
        {
            var kelompok = await _kelompokRepository.Get(dto.TargetKelompokId.Value);
            if (kelompok != null)
            {
                targetNamaKelompok = kelompok.Nama;
                var studentUserIds = (kelompok.DaftarMahasiswa ?? Enumerable.Empty<Mahasiswa>())
                    .Where(m => m.User != null)
                    .Select(m => m.User.Id)
                    .ToHashSet();

                targetUsers = allUsers.Where(u => studentUserIds.Contains(u.Id)).ToList();
            }
        }
        else if (dto.TargetRole.Equals("dosen", StringComparison.OrdinalIgnoreCase))
        {
            targetUsers = allUsers.Where(u => u.Role.Equals(UserRoles.Dosen, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        else if (dto.TargetRole.Equals("mahasiswa", StringComparison.OrdinalIgnoreCase))
        {
            targetUsers = allUsers.Where(u => u.Role.Equals(UserRoles.Mahasiswa, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        else
        {
            // "semua" -> semua dosen dan mahasiswa serta pengelola
            targetUsers = allUsers.Where(u => !u.Role.Equals(UserRoles.Admin, StringComparison.OrdinalIgnoreCase) || u.Id == senderUserId).ToList();
            if (targetUsers.Count == 0) targetUsers = allUsers; // fallback
        }

        var broadcast = new Broadcast
        {
            Judul = dto.Judul,
            Pesan = dto.Pesan,
            Tipe = dto.Tipe,
            Prioritas = dto.Prioritas,
            TargetRole = dto.TargetRole,
            TargetKelompokId = dto.TargetKelompokId,
            TargetKelompokNama = targetNamaKelompok,
            Tautan = dto.Tautan,
            CreatedByUserId = senderUserId,
            CreatedByName = senderName,
            JumlahPenerima = targetUsers.Count,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _broadcastRepository.Add(broadcast);
        await _unitOfWork.SaveChangesAsync();

        var notifikasiList = targetUsers.Select(u => new Notifikasi
        {
            UserId = u.Id,
            Judul = dto.Judul,
            Pesan = dto.Pesan,
            Tipe = "broadcast",
            Kategori = dto.Tipe,
            Tautan = dto.Tautan,
            BroadcastId = broadcast.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();

        if (notifikasiList.Count > 0)
        {
            _notifikasiRepository.AddRange(notifikasiList);
            await _unitOfWork.SaveChangesAsync();
        }

        return new BroadcastItemDto
        {
            Id = broadcast.Id,
            Judul = broadcast.Judul,
            Pesan = broadcast.Pesan,
            Tipe = broadcast.Tipe,
            Prioritas = broadcast.Prioritas,
            TargetRole = broadcast.TargetRole,
            TargetKelompokId = broadcast.TargetKelompokId,
            TargetKelompokNama = broadcast.TargetKelompokNama,
            Tautan = broadcast.Tautan,
            CreatedByUserId = broadcast.CreatedByUserId,
            CreatedByName = broadcast.CreatedByName,
            JumlahPenerima = broadcast.JumlahPenerima,
            CreatedAt = broadcast.CreatedAt
        };
    }

    public async Task<NotifikasiListResponseDto> GetUserNotificationsAsync(int userId, bool? unreadOnly = null, int limit = 50)
    {
        var items = await _notifikasiRepository.GetByUserId(userId, unreadOnly, limit);
        var unreadCount = await _notifikasiRepository.GetUnreadCount(userId);

        return new NotifikasiListResponseDto
        {
            Items = items.Select(x => new NotifikasiDto
            {
                Id = x.Id,
                UserId = x.UserId,
                Judul = x.Judul,
                Pesan = x.Pesan,
                Tipe = x.Tipe,
                Kategori = x.Kategori,
                Tautan = x.Tautan,
                IsRead = x.IsRead,
                ReadAt = x.ReadAt,
                BroadcastId = x.BroadcastId,
                CreatedAt = x.CreatedAt
            }).ToList(),
            UnreadCount = unreadCount,
            TotalCount = items.Count
        };
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _notifikasiRepository.GetUnreadCount(userId);
    }

    public async Task<bool> MarkAsReadAsync(int notifikasiId, int userId)
    {
        var notif = await _notifikasiRepository.Get(notifikasiId);
        if (notif == null || notif.UserId != userId) return false;

        if (!notif.IsRead)
        {
            notif.IsRead = true;
            notif.ReadAt = DateTime.UtcNow;
            _notifikasiRepository.Update(notif);
            await _unitOfWork.SaveChangesAsync();
        }

        return true;
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var list = await _notifikasiRepository.GetByUserId(userId, unreadOnly: true, limit: 200);
        foreach (var item in list)
        {
            item.IsRead = true;
            item.ReadAt = DateTime.UtcNow;
            _notifikasiRepository.Update(item);
        }
        if (list.Count > 0)
        {
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task<bool> DeleteNotificationAsync(int notifikasiId, int userId)
    {
        var notif = await _notifikasiRepository.Get(notifikasiId);
        if (notif == null || notif.UserId != userId) return false;

        _notifikasiRepository.Delete(notif);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task ClearAllAsync(int userId)
    {
        await _notifikasiRepository.DeleteAllByUserId(userId);
        await _unitOfWork.SaveChangesAsync();
    }
}
