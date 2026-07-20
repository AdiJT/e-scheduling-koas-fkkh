using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdjustJadwalSubStaseSinglePembimbing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JadwalSubStasePembimbing");

            migrationBuilder.AddColumn<int>(
                name: "PembimbingId",
                table: "JadwalSubStase",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JadwalSubStase_PembimbingId",
                table: "JadwalSubStase",
                column: "PembimbingId");

            migrationBuilder.AddForeignKey(
                name: "FK_JadwalSubStase_Pembimbing_PembimbingId",
                table: "JadwalSubStase",
                column: "PembimbingId",
                principalTable: "Pembimbing",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JadwalSubStase_Pembimbing_PembimbingId",
                table: "JadwalSubStase");

            migrationBuilder.DropIndex(
                name: "IX_JadwalSubStase_PembimbingId",
                table: "JadwalSubStase");

            migrationBuilder.DropColumn(
                name: "PembimbingId",
                table: "JadwalSubStase");

            migrationBuilder.CreateTable(
                name: "JadwalSubStasePembimbing",
                columns: table => new
                {
                    DaftarPembimbingId = table.Column<int>(type: "integer", nullable: false),
                    JadwalSubStaseId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JadwalSubStasePembimbing", x => new { x.DaftarPembimbingId, x.JadwalSubStaseId });
                    table.ForeignKey(
                        name: "FK_JadwalSubStasePembimbing_JadwalSubStase_JadwalSubStaseId",
                        column: x => x.JadwalSubStaseId,
                        principalTable: "JadwalSubStase",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JadwalSubStasePembimbing_Pembimbing_DaftarPembimbingId",
                        column: x => x.DaftarPembimbingId,
                        principalTable: "Pembimbing",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JadwalSubStasePembimbing_JadwalSubStaseId",
                table: "JadwalSubStasePembimbing",
                column: "JadwalSubStaseId");
        }
    }
}
