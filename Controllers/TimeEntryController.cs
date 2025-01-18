using System.Security.Claims;
using System.Xml;
using HourMap.Data;
using HourMap.Dtos;
using HourMap.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HourMap.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimeEntryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TimeEntryController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("clock-in")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager")]
    public async Task<IActionResult> ClockIn(int? projectId, int? locationId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized("Invalid user id");
        var timeEntry = new TimeEntry
        {
            UserId = userId,
            ClockIn = DateTime.UtcNow,
            ProjectId = projectId.HasValue ? projectId : null,
            LocationId = locationId.HasValue ? locationId : null
        };
        var result = await _context.TimeEntries.AddAsync(timeEntry);
        if (result == null)
        {
            return BadRequest("Failed to clock in. Result is null.");
        }

        await _context.SaveChangesAsync();

        var timeEntryDto = new TimeEntryDto
        {
            Id = timeEntry.Id,
            UserId = timeEntry.UserId,
            ClockIn = timeEntry.ClockIn,
            ClockOut = timeEntry.ClockOut,
            Duration = timeEntry.Duration,
            ProjectId = timeEntry.ProjectId,
            LocationId = timeEntry.LocationId
        };

        return Ok(new { message = "Clocked in successfully", timeEntryDto });
    }

    [HttpPut("clock-out/{timeEntryId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager")]
    public async Task<IActionResult> ClockOut(int timeEntryId)
    {
        var timeEntry = await _context.TimeEntries.FirstOrDefaultAsync(te => te.Id == timeEntryId);

        if (timeEntry == null)
        {
            return NotFound(new { message = "Time entry not found, invalid id", timeEntryId });
        }

        if (timeEntry.ClockOut != null)
        {
            return BadRequest(new { message = "Time entry already clocked out", timeEntry });
        }

        timeEntry.ClockOut = DateTime.UtcNow;
        var duration = timeEntry.ClockOut - timeEntry.ClockIn;
        var isoDuration = XmlConvert.ToString(duration.Value);
        timeEntry.Duration = isoDuration;

        var result = _context.TimeEntries.Update(timeEntry);
        if (result == null)
        {
            return BadRequest("Failed to clock out. Result is null");
        }
        await _context.SaveChangesAsync();
        return Ok(new { message = "Clocked out successfully", timeEntry });

    }

    [HttpPut("update/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager")]
    public async Task<IActionResult> UpdateTimeEntry(int id, DateTime? clockIn, DateTime? clockOut, int? projectId, int? locationId)
    {
        var query = _context.TimeEntries.Where(te => te.Id == id);
        var result = await query.FirstOrDefaultAsync();
        var timeChanged = false;

        if (result == null)
        {
            return NotFound(new { message = "Invalid time entry Id", id });
        }
        if (clockIn.HasValue)
        {
            result.ClockIn = clockIn.Value.ToUniversalTime();
            timeChanged = true;
        }
        if (clockOut.HasValue)
        {
            result.ClockOut = clockOut.Value.ToUniversalTime();
            timeChanged = true;
        }
        if (projectId.HasValue)
        {
            result.ProjectId = projectId;
        }
        if (locationId.HasValue)
        {
            result.LocationId = locationId;
        }

        if (timeChanged)
        {
            var duration = result.ClockOut - result.ClockIn;
            if (duration == null)
            {
                return BadRequest("Clock in/out time is required");
            }
            if (duration.Value.TotalSeconds < 0)
            {
                return BadRequest(new { message = "Clock out time cannot be earlier than clock in time", clockIn, clockOut });
            }
            var isoDuration = XmlConvert.ToString(duration.Value);
            result.Duration = isoDuration;
        }

        var updateResult = _context.TimeEntries.Update(result);
        if (updateResult == null)
        {
            return BadRequest(new { message = "Failed to update time entry. Result is null.", id });
        }
        await _context.SaveChangesAsync();

        var timeEntryDto = new TimeEntryDto
        {
            Id = result.Id,
            UserId = result.UserId,
            ClockIn = result.ClockIn,
            ClockOut = result.ClockOut,
            Duration = result.Duration,
            ProjectId = result.ProjectId,
            LocationId = result.LocationId
        };

        return Ok(new { message = "Time entry updated successfully", timeEntryDto });

    }

    [HttpDelete("delete/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager")]
    public async Task<IActionResult> DeleteTimeEntry(int id)
    {
        var query = _context.TimeEntries.Where(te => te.Id == id);
        var result = await query.FirstOrDefaultAsync();
        if (result == null)
        {
            return NotFound(new { message = "Invalid time entry Id", id });
        }

        _context.TimeEntries.Remove(result);

        await _context.SaveChangesAsync();

        return Ok("Time entry deleted successfully");


    }

    [HttpGet("get/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager")]
    public async Task<IActionResult> GetSingleTimeEntryById(int id)
    {
        var query = _context.TimeEntries.Where(te => te.Id == id);
        var result = await query.FirstOrDefaultAsync();
        if (result == null)
        {
            return NotFound(new { message = "Invalid time entry Id", id });
        }
        return Ok(result);
    }

    [HttpGet("get-all/{userId?}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager")]
    public async Task<IActionResult> GetAllTimeEntriesByUserIdAndDate([FromRoute] string? userId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList();

        if (string.IsNullOrEmpty(userId))
        {
            userId = currentUserId;
        }
        else if (!roles.Contains("Manager") && userId != currentUserId)
        {
            return Forbid("You do not have permission to access these time entries");
        }

        var query = _context.TimeEntries.Where(te => te.UserId == userId);

        if (startDate.HasValue)
            query = query.Where(te => te.ClockIn >= startDate.Value.ToUniversalTime());
        if (endDate.HasValue)
            query = query.Where(te => te.ClockIn <= endDate.Value.ToUniversalTime());

        var results = await query.ToListAsync();
        if (results.Count == 0)
        {
            return NotFound(new { message = "No time entries found for the given user id and date range", userId, startDate, endDate });
        }

        var timeEntryDtos = results.Select(te => new TimeEntryDto
        {
            Id = te.Id,
            UserId = te.UserId,
            ClockIn = te.ClockIn,
            ClockOut = te.ClockOut,
            Duration = te.Duration,
            ProjectId = te.ProjectId,
            LocationId = te.LocationId
        });

        return Ok(timeEntryDtos);
    }

    [HttpGet("recent-entry")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager")]
    public async Task<IActionResult> GetRecentEntry()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized("Invalid user id");

        var recentEntry = await _context.TimeEntries
            .Where(te => te.UserId == userId)
            .OrderByDescending(te => te.ClockIn)
            .FirstOrDefaultAsync();

        if (recentEntry == null) return NotFound("No recent time entry found");

        var timeEntryDto = new TimeEntryDto
        {
            Id = recentEntry.Id,
            UserId = recentEntry.UserId,
            ClockIn = recentEntry.ClockIn,
            ClockOut = recentEntry.ClockOut,
            Duration = recentEntry.Duration,
            ProjectId = recentEntry.ProjectId,
            LocationId = recentEntry.LocationId
        };

        return Ok(timeEntryDto);
    }

    [HttpGet("get-user-entries-by-dates")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager,Admin")]
    public async Task<IActionResult> GetUserEntriesByDates([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized("Invalid user id");

        var query = _context.TimeEntries.Where(te => te.UserId == userId);

        query = query.Where(te => te.ClockIn >= startDate.ToUniversalTime() && te.ClockIn <= endDate.ToUniversalTime());

        var results = await query.ToListAsync();
        if (results.Count == 0)
        {
            return NotFound(new { message = "No time entries found for the given user id and date range", userId, startDate, endDate });
        }

        var timeEntryDtos = results.Select(te => new TimeEntryDto
        {
            Id = te.Id,
            UserId = te.UserId,
            ClockIn = te.ClockIn,
            ClockOut = te.ClockOut,
            Duration = te.Duration,
            ProjectId = te.ProjectId,
            LocationId = te.LocationId
        });

        return Ok(timeEntryDtos);
    }

}
