using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdopsiPolaSapaBroadcastNotifikasiDibaca : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Broadcast",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "NotifikasiDibaca",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BroadcastId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    TanggalDibaca = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotifikasiDibaca", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotifikasiDibaca_Broadcast_BroadcastId",
                        column: x => x.BroadcastId,
                        principalTable: "Broadcast",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NotifikasiDibaca_User_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NotifikasiDibaca_BroadcastId_UserId",
                table: "NotifikasiDibaca",
                columns: new[] { "BroadcastId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotifikasiDibaca_UserId",
                table: "NotifikasiDibaca",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NotifikasiDibaca");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Broadcast");
        }
    }
}
