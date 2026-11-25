using System.Net.Http.Headers;
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
        if (string.IsNullOrWhiteSpace(_googleAuthOptions.ClientId))
        {
            return GoogleValidationResult.Failure("Konfigurasi Google Client ID belum diatur di server.");
        }

        if (string.IsNullOrWhiteSpace(idToken))
        {
            return GoogleValidationResult.Failure("Token Google ID tidak boleh kosong.");
        }

        try
        {
            var url = $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken.Trim())}";
            using var response = await _httpClient.GetAsync(url, cancellationToken);

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

            if (!string.Equals(payload.Aud, _googleAuthOptions.ClientId, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Google Token audience mismatch: token aud '{Aud}' != configured '{ClientId}'",
                    payload.Aud, _googleAuthOptions.ClientId);
                return GoogleValidationResult.Failure("Audience token Google tidak cocok dengan konfigurasi aplikasi.");
            }

            if (!payload.EmailVerified)
            {
                return GoogleValidationResult.Failure("Email akun Google Anda belum terverifikasi.");
            }

            return GoogleValidationResult.Success(payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception when validating Google ID token.");
            return GoogleValidationResult.Failure($"Terjadi kesalahan saat memverifikasi akun Google: {ex.Message}");
        }
    }

    public async Task<GoogleValidationResult> ValidateAccessTokenAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_googleAuthOptions.ClientId))
        {
            return GoogleValidationResult.Failure("Konfigurasi Google Client ID belum diatur di server.");
        }

        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return GoogleValidationResult.Failure("Token Google tidak boleh kosong.");
        }

        var trimmedToken = accessToken.Trim();

        try
        {
            var tokenInfoUrl = $"https://oauth2.googleapis.com/tokeninfo?access_token={Uri.EscapeDataString(trimmedToken)}";
            using var tokenInfoResp = await _httpClient.GetAsync(tokenInfoUrl, cancellationToken);

            if (!tokenInfoResp.IsSuccessStatusCode)
            {
                var errorBody = await tokenInfoResp.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Google AccessToken tokeninfo failed: {StatusCode} - {Body}", tokenInfoResp.StatusCode, errorBody);
                return GoogleValidationResult.Failure("Token Google tidak valid atau sudah kedaluwarsa.");
            }

            var tokenInfo = await tokenInfoResp.Content.ReadFromJsonAsync<GoogleTokenPayload>(cancellationToken);
            if (tokenInfo is null)
            {
                return GoogleValidationResult.Failure("Gagal membaca informasi token Google.");
            }

            var audienceMatches =
                string.Equals(tokenInfo.Aud, _googleAuthOptions.ClientId, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(tokenInfo.Azp, _googleAuthOptions.ClientId, StringComparison.OrdinalIgnoreCase);

            if (!audienceMatches)
            {
                _logger.LogWarning("Google AccessToken audience mismatch: aud '{Aud}', azp '{Azp}' != '{ClientId}'",
                    tokenInfo.Aud, tokenInfo.Azp, _googleAuthOptions.ClientId);
                return GoogleValidationResult.Failure("Audience token Google tidak cocok dengan konfigurasi aplikasi.");
            }

            using var userInfoReq = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
            userInfoReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", trimmedToken);
            using var userInfoResp = await _httpClient.SendAsync(userInfoReq, cancellationToken);

            if (userInfoResp.IsSuccessStatusCode)
            {
                var userInfo = await userInfoResp.Content.ReadFromJsonAsync<GoogleTokenPayload>(cancellationToken);
                if (userInfo is not null)
                {
                    if (string.IsNullOrWhiteSpace(tokenInfo.Sub) && !string.IsNullOrWhiteSpace(userInfo.Sub))
                        tokenInfo.Sub = userInfo.Sub;
                    if (string.IsNullOrWhiteSpace(tokenInfo.Email) && !string.IsNullOrWhiteSpace(userInfo.Email))
                        tokenInfo.Email = userInfo.Email;
                    if (string.IsNullOrWhiteSpace(tokenInfo.Name) && !string.IsNullOrWhiteSpace(userInfo.Name))
                        tokenInfo.Name = userInfo.Name;
                    if (string.IsNullOrWhiteSpace(tokenInfo.Picture) && !string.IsNullOrWhiteSpace(userInfo.Picture))
                        tokenInfo.Picture = userInfo.Picture;
                    if (!tokenInfo.EmailVerified && userInfo.EmailVerified)
                        tokenInfo.EmailVerifiedElement = userInfo.EmailVerifiedElement;
                }
            }

            if (string.IsNullOrWhiteSpace(tokenInfo.Email))
            {
                return GoogleValidationResult.Failure("Gagal membaca informasi profil email dari akun Google.");
            }

            if (!tokenInfo.EmailVerified)
            {
                return GoogleValidationResult.Failure("Email akun Google Anda belum terverifikasi.");
            }

            return GoogleValidationResult.Success(tokenInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception when validating Google access token.");
            return GoogleValidationResult.Failure($"Terjadi kesalahan saat memverifikasi akun Google: {ex.Message}");
        }
    }
}
