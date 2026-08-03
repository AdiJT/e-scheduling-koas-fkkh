using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTahunAjaranToKelompok : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IdTahunAjaran",
                table: "Kelompok",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Kelompok_IdTahunAjaran",
                table: "Kelompok",
                column: "IdTahunAjaran");

            migrationBuilder.AddForeignKey(
                name: "FK_Kelompok_TahunAjaran_IdTahunAjaran",
                table: "Kelompok",
                column: "IdTahunAjaran",
                principalTable: "TahunAjaran",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Kelompok_TahunAjaran_IdTahunAjaran",
                table: "Kelompok");

            migrationBuilder.DropIndex(
                name: "IX_Kelompok_IdTahunAjaran",
                table: "Kelompok");

            migrationBuilder.DropColumn(
                name: "IdTahunAjaran",
                table: "Kelompok");
        }
    }
}
