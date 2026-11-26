using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Infrastructure;
using ESchedulingKoasFKKH.Server.Configurations;
using ESchedulingKoasFKKH.Server.Filters;
using ESchedulingKoasFKKH.Server.Services;
using ESchedulingKoasFKKH.Server.Services.Api;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using NSwag;
using NSwag.Generation.Processors.Security;

var builder = WebApplication.CreateBuilder(args);

// Configuration
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<GoogleAuthOptions>(builder.Configuration.GetSection(GoogleAuthOptions.SectionName));
builder.Services.ConfigureOptions<JwtBearerOptionsSetup>();

// Add services to the container.
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddScoped<ActivityLogActionFilter>();
builder.Services.AddControllers(options =>
{
    options.Filters.AddService<ActivityLogActionFilter>();
});
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApiDocument(o =>
{
    o.AddSecurity("bearer", new OpenApiSecurityScheme
    {
        Type = OpenApiSecuritySchemeType.Http,
        Scheme = JwtBearerDefaults.AuthenticationScheme,
        BearerFormat = "JWT",
        Description = "Type into the textbox: {your JWT token}."
    });

    o.OperationProcessors.Add(new AspNetCoreOperationSecurityScopeProcessor("Bearer"));
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => o.IncludeErrorDetails = true);

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<IJadwalAutoScheduler, JadwalAutoScheduler>();
builder.Services.AddScoped<IAutoArchiveService, AutoArchiveService>();
builder.Services.AddScoped<INotifikasiService, NotifikasiService>();
builder.Services.AddScoped<IMahasiswaAccessService, MahasiswaAccessService>();
builder.Services.AddHttpClient<IGoogleAuthService, GoogleAuthService>();

builder.Services.AddHttpClient<SiadiknonaApi>(conf =>
{
    var baseUrl = builder.Configuration["SiadiknonaApi:BaseUrl"]?.TrimEnd('/')
        ?? throw new InvalidOperationException("Konfigurasi 'SiadiknonaApi:BaseUrl' belum diatur.");
    var appKey = builder.Configuration["SiadiknonaApi:AppKey"]
        ?? throw new InvalidOperationException("Konfigurasi 'SiadiknonaApi:AppKey' belum diatur.");
    var secretKey = builder.Configuration["SiadiknonaApi:SecretKey"]
        ?? throw new InvalidOperationException("Konfigurasi 'SiadiknonaApi:SecretKey' belum diatur.");

    conf.BaseAddress = new Uri($"{baseUrl}/siakadcloud/v1/");
    conf.DefaultRequestHeaders.Add("Accept", "application/json");
    conf.DefaultRequestHeaders.Add("X-App-Key", appKey);
    conf.DefaultRequestHeaders.Add("X-Secret-Key", secretKey);
    conf.Timeout = TimeSpan.FromSeconds(20);
});

builder.Services.AddHttpClient<TanggalMerahApi>(conf =>
{
    var baseUrl = builder.Configuration["TanggalMerahApi:BaseUrl"]?.TrimEnd('/');
    if (string.IsNullOrWhiteSpace(baseUrl))
        baseUrl = "https://tanggalmerah.upset.dev/api";

    conf.BaseAddress = new Uri($"{baseUrl}/");
    conf.DefaultRequestHeaders.Add("Accept", "application/json");
    conf.Timeout = TimeSpan.FromSeconds(15);
});

builder.Services.AddHttpClient<SinergiApi>(conf =>
{
    var baseUrl = builder.Configuration["SinergiApi:BaseUrl"]?.TrimEnd('/')
        ?? throw new InvalidOperationException("Konfigurasi 'SinergiApi:BaseUrl' belum diatur.");
    var header = builder.Configuration["SinergiApi:Header"];
    if (string.IsNullOrWhiteSpace(header))
        header = "X-Api-Key";
    var secretKey = builder.Configuration["SinergiApi:SecretKey"] ?? string.Empty;

    conf.BaseAddress = new Uri($"{baseUrl}/api/v1/integrasi/");
    conf.DefaultRequestHeaders.Add("Accept", "application/json");
    if (!string.IsNullOrWhiteSpace(secretKey))
    {
        conf.DefaultRequestHeaders.Add(header, secretKey);
    }
    conf.Timeout = TimeSpan.FromSeconds(20);
});

builder.Services.AddHttpClient<TanggalMerahApi>(conf =>
{
    var baseUrl = builder.Configuration["TanggalMerahApi:BaseUrl"]?.TrimEnd('/');
    if (string.IsNullOrWhiteSpace(baseUrl))
        baseUrl = "https://tanggalmerah.upset.dev/api";

    conf.BaseAddress = new Uri($"{baseUrl}/");
    conf.DefaultRequestHeaders.Add("Accept", "application/json");
    conf.Timeout = TimeSpan.FromSeconds(15);
});

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseOpenApi();
    app.UseSwaggerUi();
}
else
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
