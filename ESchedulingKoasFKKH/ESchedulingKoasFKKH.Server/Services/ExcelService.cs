using ClosedXML.Excel;
using ESchedulingKoasFKKH.Domain.ModulUtama;

namespace ESchedulingKoasFKKH.Server.Services;

public class DosenExportDto
{
    public string NIP { get; set; } = string.Empty;
    public string Nama { get; set; } = string.Empty;
    public List<string> DaftarStase { get; set; } = [];
    public List<string> KoordinatorStase { get; set; } = [];
}

public class MahasiswaExportDto
{
    public string NIM { get; set; } = string.Empty;
    public string Nama { get; set; } = string.Empty;
    public string TahunAjaran { get; set; } = string.Empty;
    public string StatusTahunAjaran { get; set; } = string.Empty;
    public string Kelompok { get; set; } = string.Empty;
}

public class DosenImportRow
{
    public int RowIndex { get; set; }
    public string NIP { get; set; } = string.Empty;
    public string Nama { get; set; } = string.Empty;
}

public class MahasiswaImportRow
{
    public int RowIndex { get; set; }
    public string NIM { get; set; } = string.Empty;
    public string Nama { get; set; } = string.Empty;
    public string? TahunAjaran { get; set; }
}

public class ExcelImportResult
{
    public bool Success { get; set; }
    public int TotalRows { get; set; }
    public int SuccessCount { get; set; }
    public List<string> Errors { get; set; } = [];
}

public class ExcelService
{
    private static readonly XLColor HeaderBgColor = XLColor.FromArgb(30, 64, 175); // Deep Blue (#1E40AF)
    private static readonly XLColor HeaderTextColor = XLColor.White;

    public byte[] GenerateDosenTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Template Dosen");

        // Headers
        ws.Cell(1, 1).Value = "NIP";
        ws.Cell(1, 2).Value = "Nama Lengkap";

        // Format NIP column as Text to preserve leading zeros & avoid scientific notation
        ws.Column(1).Style.NumberFormat.Format = "@";
        ws.Column(2).Style.NumberFormat.Format = "@";

        // Sample Data
        ws.Cell(2, 1).SetValue("198001012005011001");
        ws.Cell(2, 2).SetValue("drh. Budi Setiawan, M.Sc");

        ws.Cell(3, 1).SetValue("198502022010012002");
        ws.Cell(3, 2).SetValue("drh. Siti Aminah, Ph.D");

        StyleHeader(ws.Range(1, 1, 1, 2));
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public byte[] GenerateMahasiswaTemplate(List<TahunAjaran> daftarTahunAjaran)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Template Mahasiswa");

        // Headers
        ws.Cell(1, 1).Value = "NIM";
        ws.Cell(1, 2).Value = "Nama Mahasiswa";
        ws.Cell(1, 3).Value = "Tahun Ajaran (Opsional)";

        // Set Text format
        ws.Column(1).Style.NumberFormat.Format = "@";
        ws.Column(2).Style.NumberFormat.Format = "@";
        ws.Column(3).Style.NumberFormat.Format = "@";

        // Sample Data
        var defaultTa = daftarTahunAjaran.FirstOrDefault(x => x.Status == StatusTahunAjaran.Berjalan)
                        ?? daftarTahunAjaran.FirstOrDefault();
        var sampleTaLabel = defaultTa != null ? $"{defaultTa.Tahun} - {defaultTa.Semester}" : "2026 - Ganjil";

        ws.Cell(2, 1).SetValue("200101001");
        ws.Cell(2, 2).SetValue("Ahmad Fauzi");
        ws.Cell(2, 3).SetValue(sampleTaLabel);

        ws.Cell(3, 1).SetValue("200101002");
        ws.Cell(3, 2).SetValue("Dewi Sartika");
        ws.Cell(3, 3).SetValue(sampleTaLabel);

        StyleHeader(ws.Range(1, 1, 1, 3));
        ws.Columns().AdjustToContents();

        // Optional Reference Sheet: Daftar Tahun Ajaran
        if (daftarTahunAjaran.Count > 0)
        {
            var wsRef = workbook.Worksheets.Add("Referensi Tahun Ajaran");
            wsRef.Cell(1, 1).Value = "Tahun";
            wsRef.Cell(1, 2).Value = "Semester";
            wsRef.Cell(1, 3).Value = "Status";
            wsRef.Cell(1, 4).Value = "Format Input";

            int r = 2;
            foreach (var ta in daftarTahunAjaran.OrderByDescending(x => x.Tahun).ThenBy(x => x.Semester))
            {
                wsRef.Cell(r, 1).SetValue(ta.Tahun);
                wsRef.Cell(r, 2).SetValue(ta.Semester.ToString());
                wsRef.Cell(r, 3).SetValue(ta.Status.ToString());
                wsRef.Cell(r, 4).SetValue($"{ta.Tahun} - {ta.Semester}");
                r++;
            }

            StyleHeader(wsRef.Range(1, 1, 1, 4));
            wsRef.Columns().AdjustToContents();
        }

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public byte[] ExportDosen(List<DosenExportDto> data)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Data Dosen");

        // Headers: langsung NIP, tidak menggunakan kolom No
        ws.Cell(1, 1).Value = "NIP";
        ws.Cell(1, 2).Value = "Nama Lengkap";
        ws.Cell(1, 3).Value = "Stase yang Diampu";
        ws.Cell(1, 4).Value = "Koordinator Stase";

        ws.Column(1).Style.NumberFormat.Format = "@";
        ws.Column(2).Style.NumberFormat.Format = "@";

        int row = 2;
        for (int i = 0; i < data.Count; i++)
        {
            var d = data[i];
            ws.Cell(row, 1).SetValue(d.NIP);
            ws.Cell(row, 2).SetValue(d.Nama);
            ws.Cell(row, 3).SetValue(d.DaftarStase.Count > 0 ? string.Join(", ", d.DaftarStase) : "-");
            ws.Cell(row, 4).SetValue(d.KoordinatorStase.Count > 0 ? string.Join(", ", d.KoordinatorStase) : "-");
            row++;
        }

        StyleHeader(ws.Range(1, 1, 1, 4));
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public byte[] ExportMahasiswa(List<MahasiswaExportDto> data)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Data Mahasiswa");

        // Headers: langsung NIM, tidak menggunakan kolom No
        ws.Cell(1, 1).Value = "NIM";
        ws.Cell(1, 2).Value = "Nama Mahasiswa";
        ws.Cell(1, 3).Value = "Tahun Ajaran";
        ws.Cell(1, 4).Value = "Status T.A";
        ws.Cell(1, 5).Value = "Kelompok";

        ws.Column(1).Style.NumberFormat.Format = "@";
        ws.Column(2).Style.NumberFormat.Format = "@";

        int row = 2;
        for (int i = 0; i < data.Count; i++)
        {
            var m = data[i];
            ws.Cell(row, 1).SetValue(m.NIM);
            ws.Cell(row, 2).SetValue(m.Nama);
            ws.Cell(row, 3).SetValue(!string.IsNullOrEmpty(m.TahunAjaran) ? m.TahunAjaran : "-");
            ws.Cell(row, 4).SetValue(!string.IsNullOrEmpty(m.StatusTahunAjaran) ? m.StatusTahunAjaran : "-");
            ws.Cell(row, 5).SetValue(!string.IsNullOrEmpty(m.Kelompok) ? m.Kelompok : "Belum Ada Kelompok");
            row++;
        }

        StyleHeader(ws.Range(1, 1, 1, 5));
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public List<DosenImportRow> ParseDosen(Stream stream, out List<string> errors)
    {
        errors = [];
        var result = new List<DosenImportRow>();

        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheets.FirstOrDefault();
        if (ws == null)
        {
            errors.Add("File Excel tidak memiliki worksheet.");
            return result;
        }

        var headerRow = ws.FirstRowUsed();
        if (headerRow == null)
        {
            errors.Add("File Excel kosong atau tidak memiliki data.");
            return result;
        }

        int nipCol = -1;
        int namaCol = -1;
        int lastCol = ws.LastColumnUsed()?.ColumnNumber() ?? 10;

        for (int c = 1; c <= lastCol; c++)
        {
            var colHeader = headerRow.Cell(c).GetString()?.Trim().ToLowerInvariant() ?? string.Empty;
            if (colHeader.Contains("nip"))
            {
                nipCol = c;
            }
            else if (colHeader.Contains("nama"))
            {
                namaCol = c;
            }
        }

        // Jika header tidak terdeteksi otomatis kata NIP atau Nama
        if (nipCol == -1 || namaCol == -1)
        {
            var c1 = headerRow.Cell(1).GetString()?.Trim().ToLowerInvariant() ?? string.Empty;
            if (c1.StartsWith("no")) // Ada kolom 'No' / 'Nomor'
            {
                nipCol = 2;
                namaCol = 3;
            }
            else
            {
                nipCol = 1;
                namaCol = 2;
            }
        }

        var rows = ws.RangeUsed()?.RowsUsed()?.Skip(1); // Skip header row
        if (rows == null)
        {
            errors.Add("File Excel kosong atau tidak memiliki baris data.");
            return result;
        }

        int rowNum = 1;
        foreach (var r in rows)
        {
            rowNum++;
            var nip = r.Cell(nipCol).GetString()?.Trim() ?? string.Empty;
            var nama = r.Cell(namaCol).GetString()?.Trim() ?? string.Empty;

            // Fallback swap detection jika file memiliki kolom No tanpa header jelas
            if (nip.Length <= 4 && int.TryParse(nip, out _) && nama.Length >= 8 && nama.All(char.IsDigit))
            {
                var colNext = r.Cell(namaCol + 1).GetString()?.Trim();
                if (!string.IsNullOrWhiteSpace(colNext))
                {
                    nip = nama;
                    nama = colNext;
                }
            }

            // Abaikan baris jika benar-benar kosong
            if (string.IsNullOrWhiteSpace(nip) && string.IsNullOrWhiteSpace(nama))
                continue;

            if (string.IsNullOrWhiteSpace(nip))
            {
                errors.Add($"Baris {rowNum}: NIP tidak boleh kosong.");
                continue;
            }

            if (string.IsNullOrWhiteSpace(nama))
            {
                errors.Add($"Baris {rowNum}: Nama Lengkap tidak boleh kosong.");
                continue;
            }

            result.Add(new DosenImportRow
            {
                RowIndex = rowNum,
                NIP = nip,
                Nama = nama
            });
        }

        return result;
    }

    public List<MahasiswaImportRow> ParseMahasiswa(Stream stream, out List<string> errors)
    {
        errors = [];
        var result = new List<MahasiswaImportRow>();

        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheets.FirstOrDefault();
        if (ws == null)
        {
            errors.Add("File Excel tidak memiliki worksheet.");
            return result;
        }

        var headerRow = ws.FirstRowUsed();
        if (headerRow == null)
        {
            errors.Add("File Excel kosong atau tidak memiliki data.");
            return result;
        }

        int nimCol = -1;
        int namaCol = -1;
        int taCol = -1;
        int lastCol = ws.LastColumnUsed()?.ColumnNumber() ?? 10;

        for (int c = 1; c <= lastCol; c++)
        {
            var colHeader = headerRow.Cell(c).GetString()?.Trim().ToLowerInvariant() ?? string.Empty;
            if (colHeader.Contains("nim"))
            {
                nimCol = c;
            }
            else if (colHeader.Contains("nama"))
            {
                namaCol = c;
            }
            else if (colHeader.Contains("tahun") || colHeader.Contains("semester"))
            {
                taCol = c;
            }
        }

        // Fallback jika header tidak terdeteksi otomatis kata NIM atau Nama
        if (nimCol == -1 || namaCol == -1)
        {
            var c1 = headerRow.Cell(1).GetString()?.Trim().ToLowerInvariant() ?? string.Empty;
            if (c1.StartsWith("no")) // Ada kolom 'No' / 'Nomor'
            {
                nimCol = 2;
                namaCol = 3;
                taCol = 4;
            }
            else
            {
                nimCol = 1;
                namaCol = 2;
                taCol = 3;
            }
        }

        var rows = ws.RangeUsed()?.RowsUsed()?.Skip(1); // Skip header row
        if (rows == null)
        {
            errors.Add("File Excel kosong atau tidak memiliki data.");
            return result;
        }

        int rowNum = 1;
        foreach (var r in rows)
        {
            rowNum++;
            var nim = r.Cell(nimCol).GetString()?.Trim() ?? string.Empty;
            var nama = r.Cell(namaCol).GetString()?.Trim() ?? string.Empty;
            var tahunAjaran = taCol > 0 ? r.Cell(taCol).GetString()?.Trim() : null;

            // Fallback swap detection jika file memiliki kolom No tanpa header jelas
            if (nim.Length <= 4 && int.TryParse(nim, out _) && nama.Length >= 6 && nama.All(char.IsDigit))
            {
                var colNext = r.Cell(namaCol + 1).GetString()?.Trim();
                if (!string.IsNullOrWhiteSpace(colNext))
                {
                    nim = nama;
                    nama = colNext;
                    tahunAjaran = (taCol > 0 && taCol > namaCol + 1) ? r.Cell(taCol).GetString()?.Trim() : null;
                }
            }

            // Abaikan baris jika benar-benar kosong
            if (string.IsNullOrWhiteSpace(nim) && string.IsNullOrWhiteSpace(nama))
                continue;

            if (string.IsNullOrWhiteSpace(nim))
            {
                errors.Add($"Baris {rowNum}: NIM tidak boleh kosong.");
                continue;
            }

            if (string.IsNullOrWhiteSpace(nama))
            {
                errors.Add($"Baris {rowNum}: Nama Mahasiswa tidak boleh kosong.");
                continue;
            }

            result.Add(new MahasiswaImportRow
            {
                RowIndex = rowNum,
                NIM = nim,
                Nama = nama,
                TahunAjaran = string.IsNullOrWhiteSpace(tahunAjaran) ? null : tahunAjaran
            });
        }

        return result;
    }

    private static void StyleHeader(IXLRange headerRange)
    {
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Font.FontColor = HeaderTextColor;
        headerRange.Style.Fill.BackgroundColor = HeaderBgColor;
        headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        headerRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
    }
}
