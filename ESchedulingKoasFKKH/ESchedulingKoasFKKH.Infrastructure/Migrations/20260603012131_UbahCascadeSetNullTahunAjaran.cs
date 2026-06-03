using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UbahCascadeSetNullTahunAjaran : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Mahasiswa_TahunAjaran_TahunAjaranId",
                table: "Mahasiswa");

            migrationBuilder.AlterColumn<int>(
                name: "TahunAjaranId",
                table: "Mahasiswa",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_Mahasiswa_TahunAjaran_TahunAjaranId",
                table: "Mahasiswa",
                column: "TahunAjaranId",
                principalTable: "TahunAjaran",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Mahasiswa_TahunAjaran_TahunAjaranId",
                table: "Mahasiswa");

            migrationBuilder.AlterColumn<int>(
                name: "TahunAjaranId",
                table: "Mahasiswa",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Mahasiswa_TahunAjaran_TahunAjaranId",
                table: "Mahasiswa",
                column: "TahunAjaranId",
                principalTable: "TahunAjaran",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
