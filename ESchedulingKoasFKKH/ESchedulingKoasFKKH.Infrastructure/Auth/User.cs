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
            },
            new User { Id = 3, Name = "2201001", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 4, Name = "2201002", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 5, Name = "2201003", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 6, Name = "2201004", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 7, Name = "2201005", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 8, Name = "2201006", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 9, Name = "2201007", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 10, Name = "2201008", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 11, Name = "2201009", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 12, Name = "2201010", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 13, Name = "2201011", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 14, Name = "2201012", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 15, Name = "2201013", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 16, Name = "2201014", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 17, Name = "2201015", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 18, Name = "2201016", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 19, Name = "2201017", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 20, Name = "2201018", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 21, Name = "2201019", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 22, Name = "2201020", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Mahasiswa },
            new User { Id = 23, Name = "198501012010011001", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Dosen },
            new User { Id = 24, Name = "198602022011012002", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Dosen },
            new User { Id = 25, Name = "197803032009011003", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Dosen },
            new User { Id = 26, Name = "198204042012012004", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Dosen },
            new User { Id = 27, Name = "197905052010011005", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Dosen },
            new User { Id = 28, Name = "198306062013012006", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Dosen },
            new User { Id = 29, Name = "197607072008011007", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Dosen },
            new User { Id = 30, Name = "198408082014012008", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Dosen },
            new User { Id = 31, Name = "197709092007011009", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Dosen },
            new User { Id = 32, Name = "198510102015012010", PasswordHash = "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", Role = UserRoles.Dosen }
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
        .Include(x => x.Mahasiswa)
        .Include(x => x.Pembimbing)
        .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<User>> GetAll() => await _appDbContext.User
        .Include(x => x.Mahasiswa)
        .Include(x => x.Pembimbing)
        .ToListAsync();

    public async Task<User?> GetByName(string name) => await _appDbContext.User
        .Include(x => x.Mahasiswa)
        .Include(x => x.Pembimbing)
        .FirstOrDefaultAsync(x => x.Name == name);

    public async Task<bool> IsExist(string name, int? id = null) => await _appDbContext.User
        .AnyAsync(x => x.Id != id && x.Name == name);

    public void Update(User user) => _appDbContext.User.Update(user);
}
