using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using ESchedulingKoasFKKH.Domain.Shared;
using Humanizer;

namespace ESchedulingKoasFKKH.Server.Services.Api;

public partial class SinergiApi
{
    public const int IdUnitKerjaS1KedokteranHewan = 88;
    public const int IdUnitKerjaProfesiDokterHewan = 130;

    private static readonly HashSet<string> JunkTokens = new(StringComparer.OrdinalIgnoreCase)
    {
        "", "null", "undefined", "-", "--", "none", "nil", "0"
    };

    private static readonly Dictionary<string, string> FrontTitleMap = new(StringComparer.Ordinal)
    {
        ["prof"] = "Prof.",
        ["profesor"] = "Prof.",
        ["drh"] = "drh.",
        ["drg"] = "drg.",
        ["drs"] = "Drs.",
        ["dra"] = "Dra.",
        ["ir"] = "Ir.",
        ["ns"] = "Ns.",
        ["apt"] = "apt.",
        ["h"] = "H.",
        ["hj"] = "Hj.",
        ["kh"] = "K.H.",
        ["ra"] = "R.A."
    };

    private readonly HttpClient _client;
    private readonly ILogger<SinergiApi> _logger;

    private readonly JsonSerializerOptions _jsonSerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    public SinergiApi(HttpClient client, ILogger<SinergiApi> logger)
    {
        _client = client;
        _jsonSerializerOptions.Converters.Add(new CustomNumberToStringConverter());
        _logger = logger;
    }

    public static bool IsAllowedUnitKerja(int idUnitKerja) =>
        idUnitKerja is IdUnitKerjaS1KedokteranHewan or IdUnitKerjaProfesiDokterHewan;

    public static bool IsAllowedStatus(string? namaStatusAktifSdm)
    {
        if (string.IsNullOrWhiteSpace(namaStatusAktifSdm))
            return false;

        var status = namaStatusAktifSdm.Trim();
        return status.Equals("Aktif", StringComparison.OrdinalIgnoreCase) ||
               status.StartsWith("Tugas Belajar", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<Result<List<SinergiApiDosen>>> GetDosenKedokteranHewanAsync(
        CancellationToken cancellationToken = default)
    {
        const string path = "dosen/get-all";
        _logger.LogInformation("SINERGI GET {Path}", path);

        HttpResponseMessage response;
        try
        {
            response = await _client.GetAsync(path, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "HTTP call ke SINERGI gagal atau timeout: {Path}", path);
            return new Error(
                "Sinergi.GetAllDosen",
                "Gagal menghubungi server SINERGI (timeout atau tidak terjangkau).");
        }

        using (response)
        {
            if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden)
            {
                return new Error(
                    "Sinergi.Unauthorized",
                    $"Autentikasi API SINERGI ditolak (HTTP {(int)response.StatusCode}). Periksa konfigurasi X-Api-Key.");
            }

            if (!response.IsSuccessStatusCode)
            {
                return new Error(
                    "Sinergi.GetAllDosen",
                    $"Pemanggilan API SINERGI gagal {response.StatusCode.Humanize()} {(int)response.StatusCode}");
            }

            var allDosen = await response.Content.ReadFromJsonAsync<List<SinergiApiDosen>>(
                _jsonSerializerOptions,
                cancellationToken) ?? [];

            return allDosen
                .Where(d => IsAllowedUnitKerja(d.IdUnitKerja) && IsAllowedStatus(d.NamaStatusAktifSdm))
                .ToList();
        }
    }

    /// <summary>
    /// Menormalisasi NamaLengkap, GelarDepan, dan GelarBelakang dari SINERGI menjadi format rapi
    /// (membuang token "null", memisahkan gelar depan yang menempel, memindahkan gelar belakang dari GelarDepan).
    /// </summary>
    public static string FormatNamaGelar(string? namaLengkap, string? gelarDepan, string? gelarBelakang)
    {
        var baseName = CleanStrayJunk(namaLengkap);
        if (string.IsNullOrWhiteSpace(baseName) &&
            IsJunk(gelarDepan) &&
            IsJunk(gelarBelakang))
        {
            return string.Empty;
        }

        baseName = SeparateJoinedFrontTitles(baseName);

        string suffixFromName = string.Empty;
        var commaIdx = baseName.IndexOf(',');
        if (commaIdx >= 0)
        {
            suffixFromName = baseName[(commaIdx + 1)..].Trim();
            baseName = baseName[..commaIdx].Trim();
        }

        var frontList = new List<string>();
        var frontSeen = new HashSet<string>(StringComparer.Ordinal);
        var rearList = new List<string>();
        var rearSeen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        void AddFront(string canonical)
        {
            if (frontSeen.Add(canonical))
                frontList.Add(canonical);
        }

        void AddRear(string rawSegment)
        {
            var cleaned = rawSegment.Trim(' ', ',').Trim();
            if (IsJunk(cleaned)) return;

            var key = NormalizeKey(cleaned);
            if (!string.IsNullOrEmpty(key) && rearSeen.Add(key))
                rearList.Add(cleaned);
        }

        // Kupas gelar depan yang tertulis di awal NamaLengkap (mis. "drh. KORBINIANUS...")
        while (!string.IsNullOrWhiteSpace(baseName))
        {
            var spaceIdx = baseName.IndexOf(' ');
            if (spaceIdx <= 0) break;

            var firstTok = baseName[..spaceIdx];
            if (!firstTok.EndsWith('.') || !TryNormalizeFrontTitle(firstTok, out var canonical))
                break;

            AddFront(canonical);
            baseName = baseName[(spaceIdx + 1)..].TrimStart();
        }

        void ProcessTitleField(string? rawField)
        {
            if (IsJunk(rawField)) return;

            var normalized = SeparateJoinedFrontTitles(rawField!);
            foreach (var rawSegment in normalized.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                var segment = rawSegment.Trim();
                if (IsJunk(segment)) continue;

                // Kupas satu atau lebih gelar depan di awal segmen (mis. "Dr. Drh. MSc")
                while (!string.IsNullOrWhiteSpace(segment))
                {
                    var spaceIdx = segment.IndexOf(' ');
                    var firstTok = spaceIdx > 0 ? segment[..spaceIdx] : segment;

                    if (!TryNormalizeFrontTitle(firstTok, out var canonical))
                        break;

                    AddFront(canonical);
                    segment = spaceIdx > 0 ? segment[(spaceIdx + 1)..].TrimStart() : string.Empty;
                }

                if (!string.IsNullOrWhiteSpace(segment))
                {
                    AddRear(segment);
                }
            }
        }

        ProcessTitleField(gelarDepan);
        ProcessTitleField(suffixFromName);
        ProcessTitleField(gelarBelakang);

        var result = MultiSpaceRegex().Replace(baseName, " ").Trim();
        if (frontList.Count > 0)
        {
            result = $"{string.Join(" ", frontList)} {result}".Trim();
        }
        if (rearList.Count > 0)
        {
            result = $"{result}, {string.Join(", ", rearList)}";
        }

        return result.Trim();
    }

    private static bool TryNormalizeFrontTitle(string token, out string canonical)
    {
        canonical = string.Empty;
        var stripped = token.Replace(".", "").Replace(",", "").Trim();
        if (string.IsNullOrEmpty(stripped)) return false;

        var lower = stripped.ToLowerInvariant();
        if (lower == "dr")
        {
            // Bedakan "Dr." (Doktor, huruf awal kapital atau all-caps tidak biasa) vs "dr." (dokter medis)
            canonical = stripped == "dr" ? "dr." : "Dr.";
            return true;
        }

        if (lower == "prof")
        {
            canonical = "Prof.";
            return true;
        }

        if (FrontTitleMap.TryGetValue(lower, out var mapped))
        {
            canonical = mapped;
            return true;
        }

        return false;
    }

    private static bool IsJunk(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return true;
        return JunkTokens.Contains(value.Trim());
    }

    private static string CleanStrayJunk(string? value)
    {
        if (IsJunk(value)) return string.Empty;
        var cleaned = StrayJunkWordRegex().Replace(value!.Trim(), " ");
        cleaned = TrailingPunctuationRegex().Replace(cleaned, string.Empty);
        return MultiSpaceRegex().Replace(cleaned, " ").Trim();
    }

    private static string SeparateJoinedFrontTitles(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        return JoinedFrontTitleRegex().Replace(value, "$1. $2");
    }

    private static string NormalizeKey(string value) =>
        value.Replace(".", "").Replace(",", "").Replace(" ", "").ToLowerInvariant();

    [GeneratedRegex(@"\b(Prof|Dr|Drs|Dra|Ir|dr|drg|drh|Ns|apt|KH|K\.H|RA|R\.A)\.([A-Za-z])", RegexOptions.IgnoreCase)]
    private static partial Regex JoinedFrontTitleRegex();

    [GeneratedRegex(@"(?:^|[,\s]+)(?:null|undefined|none|nil)(?=$|[,\s]+)", RegexOptions.IgnoreCase)]
    private static partial Regex StrayJunkWordRegex();

    [GeneratedRegex(@"[,;\s]+$")]
    private static partial Regex TrailingPunctuationRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex MultiSpaceRegex();
}

public class SinergiApiDosen
{
    public string IdSdm { get; set; } = string.Empty;
    public string NIP { get; set; } = string.Empty;
    public string NamaLengkap { get; set; } = string.Empty;
    public string? GelarDepan { get; set; }
    public string? GelarBelakang { get; set; }
    public int IdUnitKerja { get; set; }
    public string NamaUnitKerja { get; set; } = string.Empty;
    public bool? StatusAktif { get; set; }
    public string NamaStatusAktifSdm { get; set; } = string.Empty;
}

public sealed class SinergiSyncResult
{
    public bool Success { get; init; }
    public List<string> UnitKerja { get; init; } = [];
    public List<string> StatusFilter { get; init; } = [];
    public int JumlahItem { get; init; }
    public int JumlahBaru { get; init; }
    public int JumlahUpdate { get; init; }
    public int JumlahTidakBerubah { get; init; }
    public int JumlahGagal { get; init; }
    public List<string> Errors { get; init; } = [];
}

