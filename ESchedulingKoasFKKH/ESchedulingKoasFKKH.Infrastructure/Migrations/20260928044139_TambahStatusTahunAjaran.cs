using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahStatusTahunAjaran : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "TahunAjaran",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.CreateTable(
                name: "Broadcast",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Judul = table.Column<string>(type: "text", nullable: false),
                    Pesan = table.Column<string>(type: "text", nullable: false),
                    Tipe = table.Column<string>(type: "text", nullable: false),
                    Prioritas = table.Column<string>(type: "text", nullable: false),
                    TargetRole = table.Column<string>(type: "text", nullable: false),
                    TargetKelompokId = table.Column<int>(type: "integer", nullable: true),
                    TargetKelompokNama = table.Column<string>(type: "text", nullable: true),
                    Tautan = table.Column<string>(type: "text", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedByName = table.Column<string>(type: "text", nullable: false),
                    JumlahPenerima = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Broadcast", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notifikasi",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Judul = table.Column<string>(type: "text", nullable: false),
                    Pesan = table.Column<string>(type: "text", nullable: false),
                    Tipe = table.Column<string>(type: "text", nullable: false),
                    Kategori = table.Column<string>(type: "text", nullable: true),
                    Tautan = table.Column<string>(type: "text", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MetadataKey = table.Column<string>(type: "text", nullable: true),
                    BroadcastId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifikasi", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifikasi_Broadcast_BroadcastId",
                        column: x => x.BroadcastId,
                        principalTable: "Broadcast",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Notifikasi_User_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "TahunAjaran",
                keyColumn: "Id",
                keyValue: 1,
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "TahunAjaran",
                keyColumn: "Id",
                keyValue: 2,
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "TahunAjaran",
                keyColumn: "Id",
                keyValue: 3,
                column: "Status",
                value: 2);

            migrationBuilder.UpdateData(
                table: "TahunAjaran",
                keyColumn: "Id",
                keyValue: 4,
                column: "Status",
                value: 3);

            migrationBuilder.CreateIndex(
                name: "IX_Broadcast_CreatedAt",
                table: "Broadcast",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikasi_BroadcastId",
                table: "Notifikasi",
                column: "BroadcastId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikasi_IsRead",
                table: "Notifikasi",
                column: "IsRead");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikasi_UserId",
                table: "Notifikasi",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikasi_UserId_MetadataKey",
                table: "Notifikasi",
                columns: new[] { "UserId", "MetadataKey" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Notifikasi");

            migrationBuilder.DropTable(
                name: "Broadcast");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "TahunAjaran");
        }
    }
}
