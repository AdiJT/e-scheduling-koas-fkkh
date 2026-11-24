using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using ESchedulingKoasFKKH.Domain.Shared;
using Humanizer;

namespace ESchedulingKoasFKKH.Server.Services.Api;

public class SiadiknonaApi
{
    public const string IdProgramStudiProfesiDokterHewan = "54961";
    public const string NamaProgramStudiProfesiDokterHewan = "Profesi Dokter Hewan";
    public const string StatusMahasiswaAktif = "A";

    private const int MaxPagesGuard = 50;

    private readonly HttpClient _client;
    private readonly ILogger<SiadiknonaApi> _logger;

    private readonly JsonSerializerOptions _jsonSerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    public SiadiknonaApi(HttpClient client, ILogger<SiadiknonaApi> logger)
    {
        _client = client;
        _jsonSerializerOptions.Converters.Add(new CustomNumberToStringConverter());
        _logger = logger;
    }

    private HttpRequestMessage CreateRequest(string path)
    {
        return new HttpRequestMessage(HttpMethod.Get, path)
        {
            Content = new StringContent(string.Empty, new MediaTypeHeaderValue("application/json"))
        };
    }

    private async Task<HttpResponseMessage> SendAsync(string path, CancellationToken cancellationToken)
    {
        _logger.LogInformation("SIADIKNONA GET {Path}", path);
        try
        {
            using var request = CreateRequest(path);
            return await _client.SendAsync(request, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "HTTP call ke Siadiknona gagal atau timeout: {Path}", path);
            return new HttpResponseMessage(HttpStatusCode.RequestTimeout)
            {
                ReasonPhrase = "Siadiknona API timeout or unreachable"
            };
        }
    }

    public async Task<Result<SiadikApiGetListModel<SiadikApiMahasiswa>>> GetMahasiswaProfesiDokterHewanAktifAsync(
        string idPeriode,
        int page = 1,
        CancellationToken cancellationToken = default)
    {
        var path = $"mahasiswa?f-id_program_studi={IdProgramStudiProfesiDokterHewan}&f-id_status_mahasiswa={StatusMahasiswaAktif}&f-id_periode={idPeriode}&page={page}";
        using var response = await SendAsync(path, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return new Error(
                "Siadiknona.GetMahasiswaProfesiDokterHewanAktif",
                $"Pemanggilan API Siadiknona gagal {response.StatusCode.Humanize()} {(int)response.StatusCode}");
        }

        var result = await response.Content.ReadFromJsonAsync<SiadikApiGetListModel<SiadikApiMahasiswa>>(
            _jsonSerializerOptions,
            cancellationToken);

        return result ?? new SiadikApiGetListModel<SiadikApiMahasiswa>();
    }

    public async Task<Result<List<SiadikApiGetModel<SiadikApiMahasiswa>>>> GetAllMahasiswaProfesiDokterHewanAktifAsync(
        string idPeriode,
        CancellationToken cancellationToken = default)
    {
        var firstPage = await GetMahasiswaProfesiDokterHewanAktifAsync(idPeriode, 1, cancellationToken);
        if (firstPage.IsFailure)
            return firstPage.Error;

        var items = new List<SiadikApiGetModel<SiadikApiMahasiswa>>(firstPage.Value.Data);
        var lastPage = Math.Min(firstPage.Value.Meta?.LastPage ?? 1, MaxPagesGuard);

        for (int page = 2; page <= lastPage; page++)
        {
            var nextPage = await GetMahasiswaProfesiDokterHewanAktifAsync(idPeriode, page, cancellationToken);
            if (nextPage.IsFailure)
                return nextPage.Error;

            items.AddRange(nextPage.Value.Data);
        }

        return items;
    }
}

public class SiadikApiGetListMeta
{
    public int Total { get; set; }
    public int CurrentPage { get; set; }
    public int PerPage { get; set; }
    public int LastPage { get; set; }
}

public class SiadikApiGetListModel<TData> where TData : ISiadikApiDataModel
{
    public SiadikApiGetListMeta? Meta { get; set; }
    public object? Urls { get; set; }
    public List<SiadikApiGetModel<TData>> Data { get; set; } = [];
}

public class SiadikApiGetModel<TData> where TData : ISiadikApiDataModel
{
    public string Type { get; set; } = string.Empty;
    public Uri? Url { get; set; }
    public string Id { get; set; } = string.Empty;
    public List<Dictionary<string, Uri>>? Relationships { get; set; }
    public TData? Attributes { get; set; }
}

public interface ISiadikApiDataModel { }

public class SiadikApiMahasiswa : ISiadikApiDataModel
{
    public string nim { get; set; } = string.Empty;
    public string nama { get; set; } = string.Empty;
    public string id_program_studi { get; set; } = string.Empty;
    public string program_studi { get; set; } = string.Empty;
    public string id_jenjang { get; set; } = string.Empty;
    public string id_periode { get; set; } = string.Empty;
    public string id_periode_terakhir { get; set; } = string.Empty;
    public string id_status_mahasiswa { get; set; } = string.Empty;
    public string status_mahasiswa { get; set; } = string.Empty;
    public string email { get; set; } = string.Empty;
    public string email_kampus { get; set; } = string.Empty;
    public string is_deleted { get; set; } = string.Empty;
}

public sealed class SiadiknonaSyncResult
{
    public bool Success { get; init; }
    public int IdTahunAjaran { get; init; }
    public required string TahunAjaran { get; init; }
    public required string IdPeriode { get; init; }
    public required string KodeProdi { get; init; }
    public required string NamaProdi { get; init; }
    public required string StatusMahasiswa { get; init; }
    public int JumlahItem { get; init; }
    public int JumlahBaru { get; init; }
    public int JumlahUpdate { get; init; }
    public int JumlahTidakBerubah { get; init; }
    public int JumlahGagal { get; init; }
    public List<string> Errors { get; init; } = [];
}

public class CustomNumberToStringConverter : JsonConverter<string>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            if (reader.TryGetSByte(out var valueSByte))
                return valueSByte.ToString();

            if (reader.TryGetByte(out var valueByte))
                return valueByte.ToString();

            if (reader.TryGetInt16(out var valueShort))
                return valueShort.ToString();

            if (reader.TryGetInt32(out var valueInt))
                return valueInt.ToString();

            if (reader.TryGetInt64(out var valueLong))
                return valueLong.ToString();

            if (reader.TryGetUInt16(out var valueUInt16))
                return valueUInt16.ToString();

            if (reader.TryGetUInt32(out var valueUInt32))
                return valueUInt32.ToString();

            if (reader.TryGetUInt64(out var valueUInt64))
                return valueUInt64.ToString();

            if (reader.TryGetSingle(out var valueSingle))
                return valueSingle.ToString();

            if (reader.TryGetDouble(out var valueDouble))
                return valueDouble.ToString();
        }

        if (reader.TokenType == JsonTokenType.String)
            return reader.GetString();

        return null;
    }

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value);
    }
}

