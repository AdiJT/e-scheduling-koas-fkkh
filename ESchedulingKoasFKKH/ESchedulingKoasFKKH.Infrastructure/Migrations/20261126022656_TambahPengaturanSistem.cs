using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahPengaturanSistem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FaqItem",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Pertanyaan = table.Column<string>(type: "text", nullable: false),
                    Jawaban = table.Column<string>(type: "text", nullable: false),
                    Urutan = table.Column<int>(type: "integer", nullable: false),
                    IsAktif = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FaqItem", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HariLibur",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TanggalMulai = table.Column<DateOnly>(type: "date", nullable: false),
                    TanggalSelesai = table.Column<DateOnly>(type: "date", nullable: false),
                    Nama = table.Column<string>(type: "text", nullable: false),
                    Keterangan = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HariLibur", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KontakSetting",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Judul = table.Column<string>(type: "text", nullable: false),
                    SubJudul = table.Column<string>(type: "text", nullable: false),
                    Lokasi = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Telepon = table.Column<string>(type: "text", nullable: true),
                    WhatsApp = table.Column<string>(type: "text", nullable: true),
                    JamPelayanan = table.Column<string>(type: "text", nullable: false),
                    Catatan = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KontakSetting", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "FaqItem",
                columns: new[] { "Id", "CreatedAt", "IsAktif", "Jawaban", "Pertanyaan", "UpdatedAt", "Urutan" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, "Anda wajib menggunakan akun Google dengan email yang sudah terhubung atau terdaftar pada profil akun SIADIKNONA Anda. Sistem akan mencocokkan email Google dengan data SIADIKNONA.", "Email Google apa yang dapat saya gunakan untuk masuk?", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 1 },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, "Silakan perbarui data email aktif Anda pada portal SIADIKNONA atau koordinasikan dengan bagian akademik/admin FKKH UNDANA agar data email Anda dapat disinkronkan ke dalam sistem penjadwalan.", "Bagaimana jika email saya belum terhubung ke SIADIKNONA?", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 2 },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, "Ya, Anda tetap dapat login secara manual. Cukup masukkan email terdaftar Anda dan password pada form input di bawah tombol Google.", "Apakah saya masih bisa login dengan email dan password manual?", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3 },
                    { 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, "Jika email Anda terdaftar di SIADIKNONA, Anda bisa langsung masuk menggunakan opsi \"Masuk dengan Google\". Atau, Anda dapat menghubungi Administrator FKKH UNDANA untuk bantuan reset password akun manual.", "Bagaimana jika saya lupa password akun manual saya?", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 4 },
                    { 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, "Pesan ini muncul jika email akun Google yang Anda pilih belum tercatat pada data SIADIKNONA di sistem penjadwalan. Pastikan Anda memilih akun Google yang benar sesuai email di SIADIKNONA.", "Muncul pesan \"Akun Belum Terdaftar\" saat login Google, apa penyebabnya?", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 5 }
                });

            migrationBuilder.InsertData(
                table: "HariLibur",
                columns: new[] { "Id", "CreatedAt", "Keterangan", "Nama", "TanggalMulai", "TanggalSelesai", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Isra Mikraj Muhammad SAW", new DateOnly(2026, 1, 16), new DateOnly(2026, 1, 16), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Cuti Bersama & Tahun Baru Imlek", new DateOnly(2026, 2, 16), new DateOnly(2026, 2, 17), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "1 Ramadhan", new DateOnly(2026, 2, 19), new DateOnly(2026, 2, 19), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Libur Ramadhan & Idul Fitri", new DateOnly(2026, 3, 16), new DateOnly(2026, 3, 30), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Libur Paskah", new DateOnly(2026, 4, 1), new DateOnly(2026, 4, 7), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Hari Buruh Internasional", new DateOnly(2026, 5, 1), new DateOnly(2026, 5, 1), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 7, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Kenaikan Isa Al Masih", new DateOnly(2026, 5, 14), new DateOnly(2026, 5, 14), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 8, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Cuti Bersama Kenaikan Isa Al Masih", new DateOnly(2026, 5, 15), new DateOnly(2026, 5, 15), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 9, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Hari Raya Idul Adha", new DateOnly(2026, 5, 27), new DateOnly(2026, 5, 27), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 10, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Cuti Bersama Idul Adha", new DateOnly(2026, 5, 28), new DateOnly(2026, 5, 28), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 11, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Hari Raya Waisak", new DateOnly(2026, 5, 31), new DateOnly(2026, 5, 31), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 12, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Hari Lahir Pancasila", new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 1), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 13, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "1 Muharam (Tahun Baru Islam)", new DateOnly(2026, 6, 16), new DateOnly(2026, 6, 16), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 14, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Hari Proklamasi Kemerdekaan RI", new DateOnly(2026, 8, 17), new DateOnly(2026, 8, 17), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 15, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Maulid Nabi Muhammad SAW", new DateOnly(2026, 8, 25), new DateOnly(2026, 8, 25), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 16, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Libur Natal dan Tahun Baru", new DateOnly(2026, 12, 22), new DateOnly(2027, 1, 2), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) }
                });

            migrationBuilder.InsertData(
                table: "KontakSetting",
                columns: new[] { "Id", "Catatan", "CreatedAt", "Email", "JamPelayanan", "Judul", "Lokasi", "SubJudul", "Telepon", "UpdatedAt", "WhatsApp" },
                values: new object[] { 1, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "fkkh@undana.ac.id", "Senin - Jumat, 08:00 - 16:00 WITA", "Kontak Administrator", "Gedung Dekanat FKKH Universitas Nusa Cendana", "Layanan Bantuan Sistem E-Scheduling KOAS FKKH UNDANA", null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.CreateIndex(
                name: "IX_FaqItem_Urutan",
                table: "FaqItem",
                column: "Urutan");

            migrationBuilder.CreateIndex(
                name: "IX_HariLibur_TanggalMulai_TanggalSelesai",
                table: "HariLibur",
                columns: new[] { "TanggalMulai", "TanggalSelesai" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FaqItem");

            migrationBuilder.DropTable(
                name: "HariLibur");

            migrationBuilder.DropTable(
                name: "KontakSetting");
        }
    }
}
