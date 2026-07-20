using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahKoordinatorStase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "KoordinatorId",
                table: "Stase",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 1,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 2,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 3,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 4,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 5,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 6,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 7,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 8,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 9,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 10,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 11,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 12,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 13,
                column: "KoordinatorId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Stase_KoordinatorId",
                table: "Stase",
                column: "KoordinatorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Stase_Pembimbing_KoordinatorId",
                table: "Stase",
                column: "KoordinatorId",
                principalTable: "Pembimbing",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Stase_Pembimbing_KoordinatorId",
                table: "Stase");

            migrationBuilder.DropIndex(
                name: "IX_Stase_KoordinatorId",
                table: "Stase");

            migrationBuilder.DropColumn(
                name: "KoordinatorId",
                table: "Stase");
        }
    }
}
