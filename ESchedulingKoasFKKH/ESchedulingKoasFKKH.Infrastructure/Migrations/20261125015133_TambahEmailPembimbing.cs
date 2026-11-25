using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahEmailPembimbing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Pembimbing",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 1,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 2,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 3,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 4,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 5,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 6,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 7,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 8,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 9,
                column: "Email",
                value: null);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 10,
                column: "Email",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "Pembimbing");
        }
    }
}
