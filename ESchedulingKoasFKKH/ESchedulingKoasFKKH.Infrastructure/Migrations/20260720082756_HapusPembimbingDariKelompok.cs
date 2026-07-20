using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HapusPembimbingDariKelompok : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Kelompok_Pembimbing_PembimbingId",
                table: "Kelompok");

            migrationBuilder.DropIndex(
                name: "IX_Kelompok_PembimbingId",
                table: "Kelompok");

            migrationBuilder.DropColumn(
                name: "PembimbingId",
                table: "Kelompok");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PembimbingId",
                table: "Kelompok",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Kelompok_PembimbingId",
                table: "Kelompok",
                column: "PembimbingId");

            migrationBuilder.AddForeignKey(
                name: "FK_Kelompok_Pembimbing_PembimbingId",
                table: "Kelompok",
                column: "PembimbingId",
                principalTable: "Pembimbing",
                principalColumn: "Id");
        }
    }
}
