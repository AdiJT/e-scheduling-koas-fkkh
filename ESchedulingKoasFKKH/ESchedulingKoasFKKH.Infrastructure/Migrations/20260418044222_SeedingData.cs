using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedingData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Mahasiswa",
                columns: new[] { "Id", "KelompokId", "NIM", "Nama" },
                values: new object[,]
                {
                    { 1, null, "2201001", "Ahmad Fauzi" },
                    { 2, null, "2201002", "Siti Nurhaliza" },
                    { 3, null, "2201003", "Muhammad Rizky" },
                    { 4, null, "2201004", "Dewi Anggraini" },
                    { 5, null, "2201005", "Budi Santoso" },
                    { 6, null, "2201006", "Putri Rahayu" },
                    { 7, null, "2201007", "Andi Pratama" },
                    { 8, null, "2201008", "Rina Wati" },
                    { 9, null, "2201009", "Fajar Nugroho" },
                    { 10, null, "2201010", "Lestari Dewi" },
                    { 11, null, "2201011", "Hendra Gunawan" },
                    { 12, null, "2201012", "Indah Permata" },
                    { 13, null, "2201013", "Yoga Aditya" },
                    { 14, null, "2201014", "Nadia Safitri" },
                    { 15, null, "2201015", "Rizal Ramadhan" },
                    { 16, null, "2201016", "Fitri Handayani" },
                    { 17, null, "2201017", "Dimas Ardiansyah" },
                    { 18, null, "2201018", "Sari Mulyani" },
                    { 19, null, "2201019", "Agus Setiawan" },
                    { 20, null, "2201020", "Maya Puspita" }
                });

            migrationBuilder.InsertData(
                table: "Pembimbing",
                columns: new[] { "Id", "NIP", "Nama" },
                values: new object[,]
                {
                    { 1, "198501012010011001", "Drg. Adi Wijaya, Sp.KG" },
                    { 2, "198602022011012002", "Drg. Sinta Maharani, M.Kes" },
                    { 3, "197803032009011003", "Drg. Bambang Hermanto, Sp.BM" },
                    { 4, "198204042012012004", "Drg. Ratna Sari, Sp.Perio" },
                    { 5, "197905052010011005", "Drg. Hasan Basri, Sp.Ort" },
                    { 6, "198306062013012006", "Drg. Anita Kusuma, Sp.PM" },
                    { 7, "197607072008011007", "Drg. Taufik Hidayat, Sp.Pros" },
                    { 8, "198408082014012008", "Drg. Wulandari, M.Sc" },
                    { 9, "197709092007011009", "Drg. Surya Darma, Sp.RKG" },
                    { 10, "198510102015012010", "Drg. Lina Marlina, Sp.KGA" }
                });

            migrationBuilder.InsertData(
                table: "Stase",
                columns: new[] { "Id", "Jenis", "Nama", "Waktu" },
                values: new object[,]
                {
                    { 1, 0, "KODIL", 7 },
                    { 2, 0, "PDHK", 6 },
                    { 3, 0, "PDHB", 6 },
                    { 4, 0, "Bedah dan Teknik Pencitraan Radiologi", 6 },
                    { 5, 0, "Kesmavet dan Epidemiologi", 4 },
                    { 6, 0, "Kedinasan dan Karantina", 2 },
                    { 7, 0, "Seminar", 1 },
                    { 8, 1, "Magang Profesi", 4 },
                    { 9, 1, "Magang Babi", 2 },
                    { 10, 1, "Magang Sapi", 2 },
                    { 11, 1, "Magang Satwa Liar", 2 },
                    { 12, 1, "Magang Kuda", 2 },
                    { 13, 0, "Ujian Komprehensip", 1 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 13);
        }
    }
}
