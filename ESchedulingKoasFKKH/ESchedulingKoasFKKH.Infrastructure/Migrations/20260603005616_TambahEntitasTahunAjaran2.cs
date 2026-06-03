using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahEntitasTahunAjaran2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "TahunAjaran",
                keyColumn: "Id",
                keyValue: 2,
                column: "Semester",
                value: 2);

            migrationBuilder.UpdateData(
                table: "TahunAjaran",
                keyColumn: "Id",
                keyValue: 4,
                column: "Semester",
                value: 2);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "TahunAjaran",
                keyColumn: "Id",
                keyValue: 2,
                column: "Semester",
                value: 0);

            migrationBuilder.UpdateData(
                table: "TahunAjaran",
                keyColumn: "Id",
                keyValue: 4,
                column: "Semester",
                value: 0);
        }
    }
}
