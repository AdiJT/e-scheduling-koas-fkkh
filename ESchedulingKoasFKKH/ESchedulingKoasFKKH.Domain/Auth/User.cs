using ESchedulingKoasFKKH.Domain.Abstracts;
using ESchedulingKoasFKKH.Domain.ModulUtama;

namespace ESchedulingKoasFKKH.Domain.Auth;

public class User : Entity<int>
{
    public required string Name { get; set; }
    public required string PasswordHash { get; set; }
    public required string Role { get; set; }

    public Mahasiswa? Mahasiswa { get; set; }
    public Pembimbing? Pembimbing { get; set; }
}

public static class UserRoles
{
    public const string Admin = "admin";
    public const string Pengelola = "pengelola";
    public const string Mahasiswa = "mahasiswa";
    public const string Dosen = "dosen";
}

public interface IUserRepository
{
    Task<User?> Get(int id);
    Task<User?> GetByName(string name);
    Task<List<User>> GetAll();
    Task<bool> IsExist(string name, int? id = null);

    void Add(User user);
    void Update(User user);
    void Delete(User user);
}