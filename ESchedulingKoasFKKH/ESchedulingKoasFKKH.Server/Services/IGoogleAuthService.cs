using System.Text.Json.Serialization;

namespace ESchedulingKoasFKKH.Server.Services;

public class GoogleTokenPayload
{
    [JsonPropertyName("sub")]
    public string Sub { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("email_verified")]
    public string? EmailVerifiedString { get; set; }

    public bool EmailVerified =>
        bool.TryParse(EmailVerifiedString, out var v) ? v : string.Equals(EmailVerifiedString, "true", StringComparison.OrdinalIgnoreCase);

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("picture")]
    public string? Picture { get; set; }

    [JsonPropertyName("aud")]
    public string Aud { get; set; } = string.Empty;
}

public class GoogleValidationResult
{
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
    public GoogleTokenPayload? Payload { get; set; }

    public static GoogleValidationResult Success(GoogleTokenPayload payload) =>
        new() { IsSuccess = true, Payload = payload };

    public static GoogleValidationResult Failure(string errorMessage) =>
        new() { IsSuccess = false, ErrorMessage = errorMessage };
}

public interface IGoogleAuthService
{
    Task<GoogleValidationResult> ValidateIdTokenAsync(string idToken, CancellationToken cancellationToken = default);
}
