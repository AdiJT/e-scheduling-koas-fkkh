using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahEmailMahasiswa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Mahasiswa",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 1,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 2,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 3,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 4,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 5,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 6,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 7,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 8,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 9,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 10,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 11,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 12,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 13,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 14,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 15,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 16,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 17,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 18,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 19,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 20,
                column: "Email",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "Mahasiswa");
        }
    }
}
