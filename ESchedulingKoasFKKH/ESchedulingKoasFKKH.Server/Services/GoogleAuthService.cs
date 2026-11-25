using System.Net.Http.Json;
using ESchedulingKoasFKKH.Server.Configurations;
using Microsoft.Extensions.Options;

namespace ESchedulingKoasFKKH.Server.Services;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly HttpClient _httpClient;
    private readonly GoogleAuthOptions _googleAuthOptions;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(
        HttpClient httpClient,
        IOptions<GoogleAuthOptions> googleAuthOptions,
        ILogger<GoogleAuthService> logger)
    {
        _httpClient = httpClient;
        _googleAuthOptions = googleAuthOptions.Value;
        _logger = logger;
    }

    public async Task<GoogleValidationResult> ValidateIdTokenAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(idToken))
        {
            return GoogleValidationResult.Failure("Token Google ID tidak boleh kosong.");
        }

        try
        {
            var url = $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken.Trim())}";
            var response = await _httpClient.GetAsync(url, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Google TokenInfo validation failed: {StatusCode} - {Body}", response.StatusCode, errorBody);
                return GoogleValidationResult.Failure("Token Google tidak valid atau sudah kedaluwarsa.");
            }

            var payload = await response.Content.ReadFromJsonAsync<GoogleTokenPayload>(cancellationToken);
            if (payload is null || string.IsNullOrWhiteSpace(payload.Email))
            {
                return GoogleValidationResult.Failure("Gagal membaca informasi profil email dari token Google.");
            }

            // Verify audience if ClientId is configured
            if (!string.IsNullOrWhiteSpace(_googleAuthOptions.ClientId) &&
                !string.Equals(payload.Aud, _googleAuthOptions.ClientId, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Google Token audience mismatch: token aud '{Aud}' != configured '{ClientId}'",
                    payload.Aud, _googleAuthOptions.ClientId);
                return GoogleValidationResult.Failure("Audience token Google tidak cocok dengan konfigurasi aplikasi.");
            }

            return GoogleValidationResult.Success(payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception when validating Google ID token.");
            return GoogleValidationResult.Failure($"Terjadi kesalahan saat memverifikasi akun Google: {ex.Message}");
        }
    }
}
