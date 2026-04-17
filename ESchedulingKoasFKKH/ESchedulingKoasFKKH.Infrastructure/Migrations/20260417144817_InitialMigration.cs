using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Pembimbing",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NIP = table.Column<string>(type: "text", nullable: false),
                    Nama = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pembimbing", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Stase",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nama = table.Column<string>(type: "text", nullable: false),
                    Waktu = table.Column<int>(type: "integer", nullable: false),
                    Jenis = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stase", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Kelompok",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nama = table.Column<string>(type: "text", nullable: false),
                    PembimbingId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kelompok", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Kelompok_Pembimbing_PembimbingId",
                        column: x => x.PembimbingId,
                        principalTable: "Pembimbing",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Jadwal",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TanggalMulai = table.Column<DateOnly>(type: "date", nullable: false),
                    TanggalSelesai = table.Column<DateOnly>(type: "date", nullable: false),
                    KelompokId = table.Column<int>(type: "integer", nullable: false),
                    StaseId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Jadwal", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Jadwal_Kelompok_KelompokId",
                        column: x => x.KelompokId,
                        principalTable: "Kelompok",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Jadwal_Stase_StaseId",
                        column: x => x.StaseId,
                        principalTable: "Stase",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Mahasiswa",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NIM = table.Column<string>(type: "text", nullable: false),
                    Nama = table.Column<string>(type: "text", nullable: false),
                    KelompokId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mahasiswa", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Mahasiswa_Kelompok_KelompokId",
                        column: x => x.KelompokId,
                        principalTable: "Kelompok",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Jadwal_KelompokId",
                table: "Jadwal",
                column: "KelompokId");

            migrationBuilder.CreateIndex(
                name: "IX_Jadwal_StaseId",
                table: "Jadwal",
                column: "StaseId");

            migrationBuilder.CreateIndex(
                name: "IX_Kelompok_PembimbingId",
                table: "Kelompok",
                column: "PembimbingId");

            migrationBuilder.CreateIndex(
                name: "IX_Mahasiswa_KelompokId",
                table: "Mahasiswa",
                column: "KelompokId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Jadwal");

            migrationBuilder.DropTable(
                name: "Mahasiswa");

            migrationBuilder.DropTable(
                name: "Stase");

            migrationBuilder.DropTable(
                name: "Kelompok");

            migrationBuilder.DropTable(
                name: "Pembimbing");
        }
    }
}
