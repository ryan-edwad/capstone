﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HourMap.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTimeEntryEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Duration",
                table: "TimeEntries",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Duration",
                table: "TimeEntries");
        }
    }
}
