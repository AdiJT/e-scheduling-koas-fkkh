using Microsoft.EntityFrameworkCore;
using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.Contracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;
using ESchedulingKoasFKKH.Domain.Auth;

namespace ESchedulingKoasFKKH.Infrastructure.Database;

internal class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes().ToList())
        {
            if (typeof(IAuditableEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder
                    .Entity(entityType.ClrType)
                    .Property(nameof(IAuditableEntity.CreatedAt))
                    .HasColumnType("timestamp without time zone");

                modelBuilder
                    .Entity(entityType.ClrType)
                    .Property(nameof(IAuditableEntity.UpdatedAt))
                    .HasColumnType("timestamp without time zone");
            }

            if (typeof(Entity<>).IsAssignableFrom(entityType.ClrType))
                modelBuilder
                    .Entity(entityType.ClrType)
                    .HasKey("Id");
        }

        modelBuilder.ApplyConfigurationsFromAssembly(AssemblyReference.Assembly);

        base.OnModelCreating(modelBuilder);
    }

    public DbSet<Mahasiswa> Mahasiswa { get; set; }
    public DbSet<Pembimbing> Pembimbing { get; set; }
    public DbSet<Stase> Stase { get; set; }
    public DbSet<Kelompok> Kelompok { get; set; }
    public DbSet<Jadwal> Jadwal { get; set; }
    public DbSet<User> User { get; set; }
}
