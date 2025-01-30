using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HourMap.Migrations
{
    /// <inheritdoc />
    public partial class SyncDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 1, 3, 16, 1, 50, 120, DateTimeKind.Utc).AddTicks(7760));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 1, 3, 16, 0, 9, 358, DateTimeKind.Utc).AddTicks(3990));
        }
    }
}
