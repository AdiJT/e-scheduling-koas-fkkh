using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace ESchedulingKoasFKKH.Server.Configurations;

public class JwtBearerOptionsSetup : IPostConfigureOptions<JwtBearerOptions>
{
    private readonly JwtOptions _options;

    public JwtBearerOptionsSetup(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public void PostConfigure(string? name, JwtBearerOptions options)
    {
        options.TokenValidationParameters.ValidateIssuer = true;
        options.TokenValidationParameters.ValidateAudience = false;
        options.TokenValidationParameters.ValidateLifetime = true;
        options.TokenValidationParameters.ValidateIssuerSigningKey = true;

        options.TokenValidationParameters.ValidIssuer = _options.Issuer;
        options.TokenValidationParameters.IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SecretKey));
    }
}
