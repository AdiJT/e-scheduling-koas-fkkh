using ESchedulingKoasFKKH.Domain.Auth;
using ESchedulingKoasFKKH.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ESchedulingKoasFKKH.Infrastructure.Auth;

internal class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasData(
             new User
             {
                 Id = 1,
                 Name = "Admin",
                 PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==",
                 Role = UserRoles.Admin
             },
            new User
            {
                Id = 2,
                Name = "Pengelola",
                PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==",
                Role = UserRoles.Pengelola
            }
        );
    }
}

internal class UserRepository : IUserRepository
{
    private readonly AppDbContext _appDbContext;

    public UserRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }

    public void Add(User user) => _appDbContext.User.Add(user);

    public void Delete(User user) => _appDbContext.User.Remove(user);

    public async Task<User?> Get(int id) => await _appDbContext.User
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<User>> GetAll() => await _appDbContext.User
        .ToListAsync();

    public async Task<User?> GetByName(string name) => await _appDbContext.User
        .FirstOrDefaultAsync(x => x.Name == name);

    public async Task<bool> IsExist(string name, int? id = null) => await _appDbContext.User
        .AnyAsync(x => x.Id != id && x.Name == name);

    public void Update(User user) => _appDbContext.User.Update(user);
}
