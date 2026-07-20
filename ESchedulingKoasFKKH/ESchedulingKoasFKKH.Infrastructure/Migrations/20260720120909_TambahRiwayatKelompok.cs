using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahRiwayatKelompok : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RiwayatKelompok",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdJadwalAsal = table.Column<int>(type: "integer", nullable: false),
                    NamaKelompok = table.Column<string>(type: "text", nullable: false),
                    TahunAjaran = table.Column<string>(type: "text", nullable: false),
                    NamaStase = table.Column<string>(type: "text", nullable: false),
                    TanggalMulai = table.Column<DateOnly>(type: "date", nullable: false),
                    TanggalSelesai = table.Column<DateOnly>(type: "date", nullable: false),
                    NamaPembimbing = table.Column<string>(type: "text", nullable: true),
                    NipPembimbing = table.Column<string>(type: "text", nullable: true),
                    DaftarMahasiswaJson = table.Column<string>(type: "text", nullable: false),
                    DaftarSubStaseJson = table.Column<string>(type: "text", nullable: false),
                    TanggalDiarsipkan = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiwayatKelompok", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RiwayatKelompok");
        }
    }
}
