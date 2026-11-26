using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ESchedulingKoasFKKH.Server.Services.Api;

public record TanggalMerahHolidayItem(DateOnly Date, string Name, string Tipe);

public class TanggalMerahApi
{
    private readonly HttpClient _client;
    private readonly ILogger<TanggalMerahApi> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    public TanggalMerahApi(HttpClient client, ILogger<TanggalMerahApi> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task<List<int>> GetAvailableYearsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await _client.GetAsync("years", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Tanggal Merah API mengembalikan status {(int)response.StatusCode}.");
            }

            var payload = await response.Content.ReadAsStringAsync(cancellationToken);
            var parsed = JsonSerializer.Deserialize<YearsResponse>(payload, JsonOptions);
            if (parsed is null || !parsed.Success || parsed.Data is null)
            {
                throw new InvalidOperationException("Respons daftar tahun dari Tanggal Merah API tidak valid.");
            }

            return parsed.Data
                .Where(y => y is >= 2000 and <= 2100)
                .Distinct()
                .OrderBy(y => y)
                .ToList();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gagal mengambil daftar tahun dari Tanggal Merah API.");
            throw new InvalidOperationException("Tidak dapat terhubung ke layanan Tanggal Merah API.", ex);
        }
    }

    public async Task<List<TanggalMerahHolidayItem>> GetHolidaysByYearAsync(
        int tahun,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await _client.GetAsync($"holidays?year={tahun}", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Tanggal Merah API mengembalikan status {(int)response.StatusCode} untuk tahun {tahun}.");
            }

            var payload = await response.Content.ReadAsStringAsync(cancellationToken);
            var parsed = JsonSerializer.Deserialize<HolidaysResponse>(payload, JsonOptions);
            if (parsed is null || !parsed.Success || parsed.Data is null)
            {
                throw new InvalidOperationException($"Respons hari libur tahun {tahun} dari Tanggal Merah API tidak valid.");
            }

            var results = new List<TanggalMerahHolidayItem>();
            foreach (var item in parsed.Data)
            {
                if (string.IsNullOrWhiteSpace(item.Date) || string.IsNullOrWhiteSpace(item.Name))
                    continue;

                if (!DateOnly.TryParseExact(item.Date.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                    continue;

                var tipe = string.Equals(item.Type?.Trim(), "leave", StringComparison.OrdinalIgnoreCase)
                    ? "Cuti Bersama"
                    : "Nasional";

                results.Add(new TanggalMerahHolidayItem(date, item.Name.Trim(), tipe));
            }

            return results;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gagal menyinkronkan hari libur tahun {Tahun} dari Tanggal Merah API.", tahun);
            throw new InvalidOperationException("Tidak dapat terhubung ke layanan Tanggal Merah API. Pastikan koneksi internet aktif.", ex);
        }
    }

    private sealed class YearsResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("data")]
        public List<int>? Data { get; set; }
    }

    private sealed class HolidaysResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("data")]
        public List<HolidayItemRaw>? Data { get; set; }
    }

    private sealed class HolidayItemRaw
    {
        [JsonPropertyName("date")]
        public string? Date { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("type")]
        public string? Type { get; set; }
    }
}

