namespace ESchedulingKoasFKKH.Server.Controllers.Dtos;

/// <summary>
/// Response: data yang dikirim KE frontend
/// </summary>
public record StaseResponse(
    int Id,
    string Nama,
    int Waktu,
    string Jenis
);

/// <summary>
/// Request: data yang diterima DARI frontend saat create
/// </summary>
public record CreateStaseRequest(
    string Nama,
    int Waktu,
    string Jenis
);

/// <summary>
/// Request: data yang diterima DARI frontend saat update
/// </summary>
public record UpdateStaseRequest(
    string Nama,
    int Waktu,
    string Jenis
);
