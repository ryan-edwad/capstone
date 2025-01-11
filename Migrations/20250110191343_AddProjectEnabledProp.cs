
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HourMap.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectEnabledProp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Enabled",
                table: "Projects",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 1, 10, 19, 13, 43, 134, DateTimeKind.Utc).AddTicks(7090));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Enabled",
                table: "Projects");

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 1, 3, 16, 1, 50, 120, DateTimeKind.Utc).AddTicks(7760));
        }
    }
}
