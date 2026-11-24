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
    Task<List<BroadcastItemDto>> GetAllBroadcastsAsync(int limit = 50);
    Task<BroadcastStatsDto> GetBroadcastStatsAsync();
    Task<bool> ToggleBroadcastStatusAsync(int broadcastId);
    Task<bool> DeleteBroadcastAsync(int broadcastId);
    Task<NotifikasiListResponseDto> GetUserNotificationsAsync(int userId, bool? unreadOnly = null, int limit = 50);
    Task<int> GetUnreadCountAsync(int userId);
    Task<bool> MarkAsReadAsync(int id, int userId, bool? isBroadcast = null);
    Task MarkAllAsReadAsync(int userId);
    Task<bool> DeleteNotificationAsync(int id, int userId, bool? isBroadcast = null);
    Task ClearAllAsync(int userId);
}

public class NotifikasiService : INotifikasiService
{
    private readonly INotifikasiRepository _notifikasiRepository;
    private readonly IBroadcastRepository _broadcastRepository;
    private readonly INotifikasiDibacaRepository _notifikasiDibacaRepository;
    private readonly IUserRepository _userRepository;
    private readonly IKelompokRepository _kelompokRepository;
    private readonly IStaseRepository _staseRepository;
    private readonly IHariLiburService _hariLiburService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<NotifikasiService> _logger;

    public NotifikasiService(
        INotifikasiRepository notifikasiRepository,
        IBroadcastRepository broadcastRepository,
        INotifikasiDibacaRepository notifikasiDibacaRepository,
        IUserRepository userRepository,
        IKelompokRepository kelompokRepository,
        IStaseRepository staseRepository,
        IHariLiburService hariLiburService,
        IUnitOfWork unitOfWork,
        ILogger<NotifikasiService> logger)
    {
        _notifikasiRepository = notifikasiRepository;
        _broadcastRepository = broadcastRepository;
        _notifikasiDibacaRepository = notifikasiDibacaRepository;
        _userRepository = userRepository;
        _kelompokRepository = kelompokRepository;
        _staseRepository = staseRepository;
        _hariLiburService = hariLiburService;
        _unitOfWork = unitOfWork;
        _logger = logger;
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
                .Select(m => m.User!.Id)
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
                                CreatedAt = DateTime.Now,
                                UpdatedAt = DateTime.Now
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
                                CreatedAt = DateTime.Now,
                                UpdatedAt = DateTime.Now
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
                                CreatedAt = DateTime.Now,
                                UpdatedAt = DateTime.Now
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
                                CreatedAt = DateTime.Now,
                                UpdatedAt = DateTime.Now
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
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _notifikasiRepository.Add(notif);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<BroadcastItemDto> SendBroadcastAsync(CreateBroadcastDto dto, int senderUserId, string senderName)
    {
        var allUsers = await _userRepository.GetAll();
        int targetCount = 0;
        string? targetNamaKelompok = null;

        if (dto.TargetRole.Equals("kelompok", StringComparison.OrdinalIgnoreCase) && dto.TargetKelompokId.HasValue)
        {
            var kelompok = await _kelompokRepository.Get(dto.TargetKelompokId.Value);
            if (kelompok != null)
            {
                targetNamaKelompok = kelompok.Nama;
                targetCount = (kelompok.DaftarMahasiswa ?? Enumerable.Empty<Mahasiswa>()).Count(m => m.User != null);
            }
        }
        else if (dto.TargetRole.Equals("dosen", StringComparison.OrdinalIgnoreCase))
        {
            targetCount = allUsers.Count(u => u.Role.Equals(UserRoles.Dosen, StringComparison.OrdinalIgnoreCase));
        }
        else if (dto.TargetRole.Equals("mahasiswa", StringComparison.OrdinalIgnoreCase))
        {
            targetCount = allUsers.Count(u => u.Role.Equals(UserRoles.Mahasiswa, StringComparison.OrdinalIgnoreCase));
        }
        else
        {
            // "semua" -> seluruh pengguna selain admin sistem
            targetCount = allUsers.Count(u => !u.Role.Equals(UserRoles.Admin, StringComparison.OrdinalIgnoreCase) || u.Id == senderUserId);
            if (targetCount == 0) targetCount = allUsers.Count;
        }

        // Simpan 1 baris saja ke tabel Broadcast (arsitektur terpusat SAPA)
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
            JumlahPenerima = targetCount,
            IsActive = true,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _broadcastRepository.Add(broadcast);
        await _unitOfWork.SaveChangesAsync();

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
            TotalDibaca = 0,
            IsActive = broadcast.IsActive,
            CreatedAt = broadcast.CreatedAt
        };
    }

    public async Task<List<BroadcastItemDto>> GetAllBroadcastsAsync(int limit = 50)
    {
        var list = await _broadcastRepository.GetAll(limit);
        var broadcastIds = list.Select(b => b.Id).ToList();
        var readCounts = await _notifikasiDibacaRepository.GetReadCountsByBroadcastIds(broadcastIds);

        return list.Select(b => new BroadcastItemDto
        {
            Id = b.Id,
            Judul = b.Judul,
            Pesan = b.Pesan,
            Tipe = b.Tipe,
            Prioritas = b.Prioritas,
            TargetRole = b.TargetRole,
            TargetKelompokId = b.TargetKelompokId,
            TargetKelompokNama = b.TargetKelompokNama,
            Tautan = b.Tautan,
            CreatedByUserId = b.CreatedByUserId,
            CreatedByName = b.CreatedByName,
            JumlahPenerima = b.JumlahPenerima,
            TotalDibaca = readCounts.TryGetValue(b.Id, out var count) ? count : 0,
            IsActive = b.IsActive,
            CreatedAt = b.CreatedAt
        }).ToList();
    }

    public async Task<BroadcastStatsDto> GetBroadcastStatsAsync()
    {
        var total = await _broadcastRepository.GetTotalCount();
        var aktif = await _broadcastRepository.GetActiveCount();
        var dibaca = await _notifikasiDibacaRepository.GetTotalReadCount();
        var bulanIni = await _broadcastRepository.GetCountThisMonth();

        return new BroadcastStatsDto
        {
            TotalBroadcast = total,
            BroadcastAktif = aktif,
            TotalDibaca = dibaca,
            BroadcastBulanIni = bulanIni
        };
    }

    public async Task<bool> ToggleBroadcastStatusAsync(int broadcastId)
    {
        var broadcast = await _broadcastRepository.Get(broadcastId);
        if (broadcast == null) return false;

        broadcast.IsActive = !broadcast.IsActive;
        broadcast.UpdatedAt = DateTime.Now;
        _broadcastRepository.Update(broadcast);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteBroadcastAsync(int broadcastId)
    {
        var broadcast = await _broadcastRepository.Get(broadcastId);
        if (broadcast == null) return false;

        _broadcastRepository.Delete(broadcast);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<NotifikasiListResponseDto> GetUserNotificationsAsync(int userId, bool? unreadOnly = null, int limit = 50)
    {
        var user = await _userRepository.Get(userId);
        if (user == null)
        {
            return new NotifikasiListResponseDto { Items = [], TotalCount = 0, UnreadCount = 0 };
        }

        string userRole = user.Role.ToLowerInvariant();
        int? userKelompokId = user.Mahasiswa?.Kelompok?.Id;
        bool isAdminOrPengelola = userRole == "admin" || userRole == "pengelola";

        // 1. Ambil siaran aktif yang sesuai target peran user
        var activeBroadcasts = await _broadcastRepository.GetActiveBroadcasts();
        var relevantBroadcasts = activeBroadcasts.Where(b =>
        {
            if (isAdminOrPengelola) return true; // Admin & Pengelola melihat seluruh siaran
            var target = b.TargetRole.ToLowerInvariant();
            if (target == "semua") return true;
            if (target == "dosen" && userRole == "dosen") return true;
            if (target == "mahasiswa" && userRole == "mahasiswa") return true;
            if (target == "kelompok" && userKelompokId.HasValue && b.TargetKelompokId == userKelompokId.Value) return true;
            return false;
        }).ToList();

        // 2. Ambil catatan ID siaran yang telah dibaca user
        var readBroadcastIds = (await _notifikasiDibacaRepository.GetReadBroadcastIdsByUser(userId)).ToHashSet();

        // 3. Ambil notifikasi personal user
        var personalNotifs = await _notifikasiRepository.GetByUserId(userId, limit: 100);

        // 4. Merge kedua sumber notifikasi
        var mergedList = new List<NotifikasiDto>();

        foreach (var b in relevantBroadcasts)
        {
            bool isRead = readBroadcastIds.Contains(b.Id);
            mergedList.Add(new NotifikasiDto
            {
                Id = b.Id,
                UserId = userId,
                Judul = b.Judul,
                Pesan = b.Pesan,
                Tipe = "broadcast",
                Kategori = b.Tipe,
                Tautan = b.Tautan,
                IsRead = isRead,
                ReadAt = isRead ? b.CreatedAt : null,
                BroadcastId = b.Id,
                IsBroadcast = true,
                SenderName = b.CreatedByName,
                Prioritas = b.Prioritas,
                CreatedAt = b.CreatedAt,
                TimeAgo = GetRelativeTime(b.CreatedAt)
            });
        }

        foreach (var p in personalNotifs)
        {
            mergedList.Add(new NotifikasiDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Judul = p.Judul,
                Pesan = p.Pesan,
                Tipe = p.Tipe,
                Kategori = p.Kategori ?? "Akademik",
                Tautan = p.Tautan,
                IsRead = p.IsRead,
                ReadAt = p.ReadAt,
                BroadcastId = null,
                IsBroadcast = false,
                SenderName = "Sistem Penjadwalan",
                Prioritas = p.Tipe.Contains("selesai") ? "Penting" : "Normal",
                CreatedAt = p.CreatedAt,
                TimeAgo = GetRelativeTime(p.CreatedAt)
            });
        }

        // Hitung unread count sebelum limit
        int totalUnread = mergedList.Count(x => !x.IsRead);

        if (unreadOnly.HasValue && unreadOnly.Value)
        {
            mergedList = mergedList.Where(x => !x.IsRead).ToList();
        }

        var finalItems = mergedList
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToList();

        return new NotifikasiListResponseDto
        {
            Items = finalItems,
            UnreadCount = totalUnread,
            TotalCount = mergedList.Count
        };
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        var user = await _userRepository.Get(userId);
        if (user == null) return 0;

        string userRole = user.Role.ToLowerInvariant();
        int? userKelompokId = user.Mahasiswa?.Kelompok?.Id;
        bool isAdminOrPengelola = userRole == "admin" || userRole == "pengelola";

        var activeBroadcasts = await _broadcastRepository.GetActiveBroadcasts();
        var relevantBroadcastIds = activeBroadcasts.Where(b =>
        {
            if (isAdminOrPengelola) return true;
            var target = b.TargetRole.ToLowerInvariant();
            if (target == "semua") return true;
            if (target == "dosen" && userRole == "dosen") return true;
            if (target == "mahasiswa" && userRole == "mahasiswa") return true;
            if (target == "kelompok" && userKelompokId.HasValue && b.TargetKelompokId == userKelompokId.Value) return true;
            return false;
        }).Select(b => b.Id).ToList();

        var readBroadcastIds = (await _notifikasiDibacaRepository.GetReadBroadcastIdsByUser(userId)).ToHashSet();
        int unreadBroadcastCount = relevantBroadcastIds.Count(id => !readBroadcastIds.Contains(id));

        int unreadPersonalCount = await _notifikasiRepository.GetUnreadCount(userId);

        return unreadBroadcastCount + unreadPersonalCount;
    }

    public async Task<bool> MarkAsReadAsync(int id, int userId, bool? isBroadcast = null)
    {
        // 1. Jika secara eksplisit dinyatakan sebagai broadcast
        if (isBroadcast == true)
        {
            if (await _broadcastRepository.Get(id) != null && !await _notifikasiDibacaRepository.IsRead(id, userId))
            {
                _notifikasiDibacaRepository.Add(new NotifikasiDibaca
                {
                    BroadcastId = id,
                    UserId = userId,
                    TanggalDibaca = DateTime.Now
                });
                await _unitOfWork.SaveChangesAsync();
            }
            return true;
        }

        // 2. Jika secara eksplisit bukan broadcast (personal notif)
        if (isBroadcast == false)
        {
            var personalNotif = await _notifikasiRepository.Get(id);
            if (personalNotif != null && personalNotif.UserId == userId)
            {
                if (!personalNotif.IsRead)
                {
                    personalNotif.IsRead = true;
                    personalNotif.ReadAt = DateTime.Now;
                    _notifikasiRepository.Update(personalNotif);
                    await _unitOfWork.SaveChangesAsync();
                }
                return true;
            }
            return false;
        }

        // 3. Fallback jika isBroadcast null: Cek personal notifikasi terlebih dahulu karena spesifik ke userId
        var fallbackPersonal = await _notifikasiRepository.Get(id);
        if (fallbackPersonal != null && fallbackPersonal.UserId == userId)
        {
            if (!fallbackPersonal.IsRead)
            {
                fallbackPersonal.IsRead = true;
                fallbackPersonal.ReadAt = DateTime.Now;
                _notifikasiRepository.Update(fallbackPersonal);
                await _unitOfWork.SaveChangesAsync();
            }
            return true;
        }

        // Jika tidak ada di personal, cek apakah ada di broadcast
        if (await _broadcastRepository.Get(id) != null)
        {
            if (!await _notifikasiDibacaRepository.IsRead(id, userId))
            {
                _notifikasiDibacaRepository.Add(new NotifikasiDibaca
                {
                    BroadcastId = id,
                    UserId = userId,
                    TanggalDibaca = DateTime.Now
                });
                await _unitOfWork.SaveChangesAsync();
            }
            return true;
        }

        return false;
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var user = await _userRepository.Get(userId);
        if (user == null) return;

        string userRole = user.Role.ToLowerInvariant();
        int? userKelompokId = user.Mahasiswa?.Kelompok?.Id;
        bool isAdminOrPengelola = userRole == "admin" || userRole == "pengelola";

        // 1. Tandai semua siaran relevan yang belum dibaca
        var activeBroadcasts = await _broadcastRepository.GetActiveBroadcasts();
        var relevantBroadcastIds = activeBroadcasts.Where(b =>
        {
            if (isAdminOrPengelola) return true;
            var target = b.TargetRole.ToLowerInvariant();
            if (target == "semua") return true;
            if (target == "dosen" && userRole == "dosen") return true;
            if (target == "mahasiswa" && userRole == "mahasiswa") return true;
            if (target == "kelompok" && userKelompokId.HasValue && b.TargetKelompokId == userKelompokId.Value) return true;
            return false;
        }).Select(b => b.Id).ToList();

        var readBroadcastIds = (await _notifikasiDibacaRepository.GetReadBroadcastIdsByUser(userId)).ToHashSet();
        var unreadBroadcastIds = relevantBroadcastIds.Where(id => !readBroadcastIds.Contains(id)).ToList();

        if (unreadBroadcastIds.Count > 0)
        {
            var readRecords = unreadBroadcastIds.Select(bId => new NotifikasiDibaca
            {
                BroadcastId = bId,
                UserId = userId,
                TanggalDibaca = DateTime.Now
            });
            _notifikasiDibacaRepository.AddRange(readRecords);
        }

        // 2. Tandai semua notifikasi personal yang belum dibaca (tanpa batasan limit kecil)
        var unreadPersonalList = await _notifikasiRepository.GetByUserId(userId, unreadOnly: true, limit: 1000);
        foreach (var p in unreadPersonalList)
        {
            p.IsRead = true;
            p.ReadAt = DateTime.Now;
            _notifikasiRepository.Update(p);
        }

        var saveResult = await _unitOfWork.SaveChangesAsync();
        if (saveResult.IsFailure)
        {
            _logger.LogError("Gagal menyimpan perubahan MarkAllAsRead: {Error}", saveResult.Error.Message);
        }
    }

    public async Task<bool> DeleteNotificationAsync(int id, int userId, bool? isBroadcast = null)
    {
        if (isBroadcast == true)
        {
            // Jika siaran, tandai dibaca agar tidak muncul lagi di unread user
            await MarkAsReadAsync(id, userId, isBroadcast: true);
            return true;
        }

        if (isBroadcast == false)
        {
            var notif = await _notifikasiRepository.Get(id);
            if (notif == null || notif.UserId != userId) return false;

            _notifikasiRepository.Delete(notif);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        // Fallback jika isBroadcast null
        var fallbackNotif = await _notifikasiRepository.Get(id);
        if (fallbackNotif != null && fallbackNotif.UserId == userId)
        {
            _notifikasiRepository.Delete(fallbackNotif);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        if (await _broadcastRepository.Get(id) != null)
        {
            await MarkAsReadAsync(id, userId, isBroadcast: true);
            return true;
        }

        return false;
    }

    public async Task ClearAllAsync(int userId)
    {
        // Tandai semua broadcast dibaca
        await MarkAllAsReadAsync(userId);

        // Hapus seluruh notifikasi personal user
        await _notifikasiRepository.DeleteAllByUserId(userId);
        await _unitOfWork.SaveChangesAsync();
    }

    private static string GetRelativeTime(DateTime dateTime)
    {
        var span = DateTime.Now - dateTime;
        if (span.TotalMinutes < 1) return "Baru saja";
        if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} mnt lalu";
        if (span.TotalHours < 24) return $"{(int)span.TotalHours} jam lalu";
        if (span.TotalDays < 7) return $"{(int)span.TotalDays} hari lalu";
        return dateTime.ToString("dd MMM yyyy");
    }
}
