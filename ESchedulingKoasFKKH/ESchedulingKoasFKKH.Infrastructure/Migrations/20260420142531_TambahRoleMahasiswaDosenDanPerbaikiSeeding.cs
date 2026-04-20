using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ESchedulingKoasFKKH.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TambahRoleMahasiswaDosenDanPerbaikiSeeding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Pembimbing",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Mahasiswa",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 1,
                column: "UserId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 2,
                column: "UserId",
                value: 4);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 3,
                column: "UserId",
                value: 5);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 4,
                column: "UserId",
                value: 6);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 5,
                column: "UserId",
                value: 7);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 6,
                column: "UserId",
                value: 8);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 7,
                column: "UserId",
                value: 9);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 8,
                column: "UserId",
                value: 10);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 9,
                column: "UserId",
                value: 11);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 10,
                column: "UserId",
                value: 12);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 11,
                column: "UserId",
                value: 13);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 12,
                column: "UserId",
                value: 14);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 13,
                column: "UserId",
                value: 15);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 14,
                column: "UserId",
                value: 16);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 15,
                column: "UserId",
                value: 17);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 16,
                column: "UserId",
                value: 18);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 17,
                column: "UserId",
                value: 19);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 18,
                column: "UserId",
                value: 20);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 19,
                column: "UserId",
                value: 21);

            migrationBuilder.UpdateData(
                table: "Mahasiswa",
                keyColumn: "Id",
                keyValue: 20,
                column: "UserId",
                value: 22);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 1,
                column: "UserId",
                value: 23);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 2,
                column: "UserId",
                value: 24);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 3,
                column: "UserId",
                value: 25);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 4,
                column: "UserId",
                value: 26);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 5,
                column: "UserId",
                value: 27);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 6,
                column: "UserId",
                value: 28);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 7,
                column: "UserId",
                value: 29);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 8,
                column: "UserId",
                value: 30);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 9,
                column: "UserId",
                value: 31);

            migrationBuilder.UpdateData(
                table: "Pembimbing",
                keyColumn: "Id",
                keyValue: 10,
                column: "UserId",
                value: 32);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 7,
                column: "Jenis",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 13,
                column: "Jenis",
                value: 3);

            migrationBuilder.InsertData(
                table: "User",
                columns: new[] { "Id", "Name", "PasswordHash", "Role" },
                values: new object[,]
                {
                    { 3, "2201001", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 4, "2201002", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 5, "2201003", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 6, "2201004", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 7, "2201005", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 8, "2201006", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 9, "2201007", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 10, "2201008", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 11, "2201009", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 12, "2201010", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 13, "2201011", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 14, "2201012", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 15, "2201013", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 16, "2201014", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 17, "2201015", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 18, "2201016", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 19, "2201017", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 20, "2201018", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 21, "2201019", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 22, "2201020", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "mahasiswa" },
                    { 23, "198501012010011001", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "dosen" },
                    { 24, "198602022011012002", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "dosen" },
                    { 25, "197803032009011003", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "dosen" },
                    { 26, "198204042012012004", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "dosen" },
                    { 27, "197905052010011005", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "dosen" },
                    { 28, "198306062013012006", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "dosen" },
                    { 29, "197607072008011007", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "dosen" },
                    { 30, "198408082014012008", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "dosen" },
                    { 31, "197709092007011009", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "dosen" },
                    { 32, "198510102015012010", "AQAAAAIAAYagAAAAEKXsR8woVHO5DgmyBgmfe5b4I7jeJZYtk71JFY4HkDSCsimeHtIwzOueTyHo8gBH/A==", "dosen" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pembimbing_UserId",
                table: "Pembimbing",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Mahasiswa_UserId",
                table: "Mahasiswa",
                column: "UserId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Mahasiswa_User_UserId",
                table: "Mahasiswa",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Pembimbing_User_UserId",
                table: "Pembimbing",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Mahasiswa_User_UserId",
                table: "Mahasiswa");

            migrationBuilder.DropForeignKey(
                name: "FK_Pembimbing_User_UserId",
                table: "Pembimbing");

            migrationBuilder.DropIndex(
                name: "IX_Pembimbing_UserId",
                table: "Pembimbing");

            migrationBuilder.DropIndex(
                name: "IX_Mahasiswa_UserId",
                table: "Mahasiswa");

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 32);

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Pembimbing");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Mahasiswa");

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 7,
                column: "Jenis",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Stase",
                keyColumn: "Id",
                keyValue: 13,
                column: "Jenis",
                value: 0);
        }
    }
}
