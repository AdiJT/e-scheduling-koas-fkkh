namespace ESchedulingKoasFKKH.Server.Configurations;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
}
