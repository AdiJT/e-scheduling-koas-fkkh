using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SubStaseMultiDosen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JadwalSubStase_Pembimbing_PembimbingId",
                table: "JadwalSubStase");

            migrationBuilder.DropForeignKey(
                name: "FK_SubStase_Pembimbing_DefaultPembimbingId",
                table: "SubStase");

            migrationBuilder.DropIndex(
                name: "IX_SubStase_DefaultPembimbingId",
                table: "SubStase");

            migrationBuilder.DropIndex(
                name: "IX_JadwalSubStase_PembimbingId",
                table: "JadwalSubStase");

            migrationBuilder.DropColumn(
                name: "DefaultPembimbingId",
                table: "SubStase");

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

            migrationBuilder.CreateTable(
                name: "PembimbingSubStase",
                columns: table => new
                {
                    DaftarDefaultPembimbingId = table.Column<int>(type: "integer", nullable: false),
                    SubStaseId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PembimbingSubStase", x => new { x.DaftarDefaultPembimbingId, x.SubStaseId });
                    table.ForeignKey(
                        name: "FK_PembimbingSubStase_Pembimbing_DaftarDefaultPembimbingId",
                        column: x => x.DaftarDefaultPembimbingId,
                        principalTable: "Pembimbing",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PembimbingSubStase_SubStase_SubStaseId",
                        column: x => x.SubStaseId,
                        principalTable: "SubStase",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JadwalSubStasePembimbing_JadwalSubStaseId",
                table: "JadwalSubStasePembimbing",
                column: "JadwalSubStaseId");

            migrationBuilder.CreateIndex(
                name: "IX_PembimbingSubStase_SubStaseId",
                table: "PembimbingSubStase",
                column: "SubStaseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JadwalSubStasePembimbing");

            migrationBuilder.DropTable(
                name: "PembimbingSubStase");

            migrationBuilder.AddColumn<int>(
                name: "DefaultPembimbingId",
                table: "SubStase",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PembimbingId",
                table: "JadwalSubStase",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SubStase",
                keyColumn: "Id",
                keyValue: 1,
                column: "DefaultPembimbingId",
                value: null);

            migrationBuilder.UpdateData(
                table: "SubStase",
                keyColumn: "Id",
                keyValue: 2,
                column: "DefaultPembimbingId",
                value: null);

            migrationBuilder.UpdateData(
                table: "SubStase",
                keyColumn: "Id",
                keyValue: 3,
                column: "DefaultPembimbingId",
                value: null);

            migrationBuilder.UpdateData(
                table: "SubStase",
                keyColumn: "Id",
                keyValue: 4,
                column: "DefaultPembimbingId",
                value: null);

            migrationBuilder.UpdateData(
                table: "SubStase",
                keyColumn: "Id",
                keyValue: 5,
                column: "DefaultPembimbingId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_SubStase_DefaultPembimbingId",
                table: "SubStase",
                column: "DefaultPembimbingId");

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

            migrationBuilder.AddForeignKey(
                name: "FK_SubStase_Pembimbing_DefaultPembimbingId",
                table: "SubStase",
                column: "DefaultPembimbingId",
                principalTable: "Pembimbing",
                principalColumn: "Id");
        }
    }
}
