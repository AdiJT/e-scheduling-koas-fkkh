using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahRelasiStasePembimbing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PembimbingStase",
                columns: table => new
                {
                    DaftarPembimbingId = table.Column<int>(type: "integer", nullable: false),
                    DaftarStaseId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PembimbingStase", x => new { x.DaftarPembimbingId, x.DaftarStaseId });
                    table.ForeignKey(
                        name: "FK_PembimbingStase_Pembimbing_DaftarPembimbingId",
                        column: x => x.DaftarPembimbingId,
                        principalTable: "Pembimbing",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PembimbingStase_Stase_DaftarStaseId",
                        column: x => x.DaftarStaseId,
                        principalTable: "Stase",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PembimbingStase_DaftarStaseId",
                table: "PembimbingStase",
                column: "DaftarStaseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PembimbingStase");
        }
    }
}
