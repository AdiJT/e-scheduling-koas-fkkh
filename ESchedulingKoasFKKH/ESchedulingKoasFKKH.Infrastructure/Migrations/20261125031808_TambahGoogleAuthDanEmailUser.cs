using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahGoogleAuthDanEmailUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "User",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "User",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleId",
                table: "User",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 22,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 23,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 24,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 25,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 26,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 27,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 28,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 29,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 30,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 31,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 32,
                columns: new[] { "AvatarUrl", "Email", "GoogleId" },
                values: new object[] { null, null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "User");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "User");

            migrationBuilder.DropColumn(
                name: "GoogleId",
                table: "User");
        }
    }
}
