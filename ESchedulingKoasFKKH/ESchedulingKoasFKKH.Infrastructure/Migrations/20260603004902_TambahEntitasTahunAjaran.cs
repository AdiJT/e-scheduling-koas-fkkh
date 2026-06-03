using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahEntitasTahunAjaran : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TahunAjaranId",
                table: "Mahasiswa",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "TahunAjaran",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Tahun = table.Column<int>(type: "integer", nullable: false),
                    Semester = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TahunAjaran", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 1,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 2,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 3,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 4,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 5,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 6,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 7,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 8,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 9,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 10,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 11,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 12,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 13,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 14,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 15,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 16,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 17,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 18,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 19,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 20,
                column: "TahunAjaranId",
                value: 3);

            migrationBuilder.InsertData(
                table: "TahunAjaran",
                columns: new[] { "Id", "Semester", "Tahun" },
                values: new object[,]
                {
                    { 1, 1, 2025 },
                    { 2, 0, 2025 },
                    { 3, 1, 2026 },
                    { 4, 0, 2026 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Mahasiswa_TahunAjaranId",
                table: "Mahasiswa",
                column: "TahunAjaranId");

            migrationBuilder.CreateIndex(
                name: "IX_TahunAjaran_Tahun_Semester",
                table: "TahunAjaran",
                columns: new[] { "Tahun", "Semester" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Mahasiswa_TahunAjaran_TahunAjaranId",
                table: "Mahasiswa",
                column: "TahunAjaranId",
                principalTable: "TahunAjaran",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Mahasiswa_TahunAjaran_TahunAjaranId",
                table: "Mahasiswa");

            migrationBuilder.DropTable(
                name: "TahunAjaran");

            migrationBuilder.DropIndex(
                name: "IX_Mahasiswa_TahunAjaranId",
                table: "Mahasiswa");

            migrationBuilder.DropColumn(
                name: "TahunAjaranId",
                table: "Mahasiswa");
        }
    }
}
