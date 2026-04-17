using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Infrastructure.ModulUtama;

namespace ESchedulingKoasFKKH.Infrastructure;

public static class DepedencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new NullReferenceException("connection string 'Default' is null");

        services.AddDbContext<AppDbContext>(options => options
            .UseNpgsql(connectionString, o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery))
            .EnableSensitiveDataLogging());

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<IMahasiswaRepository, MahasiswaRepository>();
        services.AddScoped<IPembimbingRepository, PembimbingRepository>();
        services.AddScoped<IStaseRepository, StaseRepository>();
        services.AddScoped<IKelompokRepository, KelompokRepository>();
        services.AddScoped<IJadwalRepository, JadwalRepository>();

        return services;
    }
}
