using System.Text.Json;
using System.Text.Json.Serialization;

namespace ESchedulingKoasFKKH.Server.Services;

public class GoogleTokenPayload
{
    [JsonPropertyName("sub")]
    public string Sub { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("email_verified")]
    public JsonElement? EmailVerifiedElement { get; set; }

    public bool EmailVerified =>
        EmailVerifiedElement is { ValueKind: JsonValueKind.True } ||
        (EmailVerifiedElement is { ValueKind: JsonValueKind.String } el &&
         string.Equals(el.GetString(), "true", StringComparison.OrdinalIgnoreCase));

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("picture")]
    public string? Picture { get; set; }

    [JsonPropertyName("aud")]
    public string Aud { get; set; } = string.Empty;

    [JsonPropertyName("azp")]
    public string? Azp { get; set; }
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
    Task<GoogleValidationResult> ValidateAccessTokenAsync(string accessToken, CancellationToken cancellationToken = default);
}
