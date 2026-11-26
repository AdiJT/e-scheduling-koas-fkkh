using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahSumberTipeHariLibur : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Sumber",
                table: "HariLibur",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Manual");

            migrationBuilder.AddColumn<string>(
                name: "Tipe",
                table: "HariLibur",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Kampus");

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Nasional" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Cuti Bersama" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "Manual", "Kampus" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "Manual", "Kampus" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "Manual", "Kampus" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Nasional" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Nasional" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Cuti Bersama" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Nasional" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Cuti Bersama" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Nasional" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Nasional" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Nasional" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Nasional" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "API", "Nasional" });

            migrationBuilder.UpdateData(
                table: "HariLibur",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "Sumber", "Tipe" },
                values: new object[] { "Manual", "Kampus" });

            migrationBuilder.CreateIndex(
                name: "IX_HariLibur_Sumber",
                table: "HariLibur",
                column: "Sumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HariLibur_Sumber",
                table: "HariLibur");

            migrationBuilder.DropColumn(
                name: "Sumber",
                table: "HariLibur");

            migrationBuilder.DropColumn(
                name: "Tipe",
                table: "HariLibur");
        }
    }
}
