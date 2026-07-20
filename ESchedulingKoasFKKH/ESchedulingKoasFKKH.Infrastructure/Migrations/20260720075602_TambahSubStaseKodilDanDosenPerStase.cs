using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahSubStaseKodilDanDosenPerStase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PembimbingId",
                table: "Jadwal",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SubStase",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nama = table.Column<string>(type: "text", nullable: false),
                    Urutan = table.Column<int>(type: "integer", nullable: false),
                    StaseId = table.Column<int>(type: "integer", nullable: false),
                    DefaultPembimbingId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubStase", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubStase_Pembimbing_DefaultPembimbingId",
                        column: x => x.DefaultPembimbingId,
                        principalTable: "Pembimbing",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SubStase_Stase_StaseId",
                        column: x => x.StaseId,
                        principalTable: "Stase",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "JadwalSubStase",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    JadwalId = table.Column<int>(type: "integer", nullable: false),
                    SubStaseId = table.Column<int>(type: "integer", nullable: false),
                    PembimbingId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JadwalSubStase", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JadwalSubStase_Jadwal_JadwalId",
                        column: x => x.JadwalId,
                        principalTable: "Jadwal",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JadwalSubStase_Pembimbing_PembimbingId",
                        column: x => x.PembimbingId,
                        principalTable: "Pembimbing",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_JadwalSubStase_SubStase_SubStaseId",
                        column: x => x.SubStaseId,
                        principalTable: "SubStase",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "SubStase",
                columns: new[] { "Id", "DefaultPembimbingId", "Nama", "StaseId", "Urutan" },
                values: new object[,]
                {
                    { 1, null, "Patologi Klinik", 1, 1 },
                    { 2, null, "Patologi Veteriner", 1, 2 },
                    { 3, null, "Mikrobiologi (Bakteriologi)", 1, 3 },
                    { 4, null, "Virologi", 1, 4 },
                    { 5, null, "Parasitologi", 1, 5 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Jadwal_PembimbingId",
                table: "Jadwal",
                column: "PembimbingId");

            migrationBuilder.CreateIndex(
                name: "IX_JadwalSubStase_JadwalId",
                table: "JadwalSubStase",
                column: "JadwalId");

            migrationBuilder.CreateIndex(
                name: "IX_JadwalSubStase_PembimbingId",
                table: "JadwalSubStase",
                column: "PembimbingId");

            migrationBuilder.CreateIndex(
                name: "IX_JadwalSubStase_SubStaseId",
                table: "JadwalSubStase",
                column: "SubStaseId");

            migrationBuilder.CreateIndex(
                name: "IX_SubStase_DefaultPembimbingId",
                table: "SubStase",
                column: "DefaultPembimbingId");

            migrationBuilder.CreateIndex(
                name: "IX_SubStase_StaseId",
                table: "SubStase",
                column: "StaseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Jadwal_Pembimbing_PembimbingId",
                table: "Jadwal",
                column: "PembimbingId",
                principalTable: "Pembimbing",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Jadwal_Pembimbing_PembimbingId",
                table: "Jadwal");

            migrationBuilder.DropTable(
                name: "JadwalSubStase");

            migrationBuilder.DropTable(
                name: "SubStase");

            migrationBuilder.DropIndex(
                name: "IX_Jadwal_PembimbingId",
                table: "Jadwal");

            migrationBuilder.DropColumn(
                name: "PembimbingId",
                table: "Jadwal");
        }
    }
}
