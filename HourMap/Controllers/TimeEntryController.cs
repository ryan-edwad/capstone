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

/// <summary>
/// A controller for managing time entries.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TimeEntryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TimeEntryController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Clocks in a user.
    /// </summary>
    /// <param name="clockInDto">Project ID, Location ID (optional)</param>
    /// <returns>ActionResult (200, 401), TimeEntryDto</returns>
    [HttpPost("clock-in")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager")]
    public async Task<IActionResult> ClockIn([FromBody] ClockInDto clockInDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized("Invalid user id");
        var organizationId = User.FindFirstValue("OrganizationId");
        if (organizationId is null) return Unauthorized("Invalid organization id");

        var timeEntry = new TimeEntry
        {
            UserId = userId,
            ClockIn = DateTime.UtcNow,
            ProjectId = clockInDto.ProjectId,
            LocationId = clockInDto.LocationId,
            OrganizationId = int.Parse(organizationId)
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

    /// <summary>
    /// Clocks out a user.
    /// </summary>
    /// <param name="timeEntryId">Id of an existing time entry</param>
    /// <returns>ActionResult(200, 404, 401), updated TimeEntry</returns>
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

    /// <summary>
    /// Updates a time entry.
    /// </summary>
    /// <param name="timeEntry">Existing TimeEntry</param>
    /// <returns>ActionResult(200, 404, 401), updated TimeEntryDto</returns>
    [HttpPut("update")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager")]
    public async Task<IActionResult> UpdateTimeEntry(TimeEntryDto timeEntry)
    {
        var query = _context.TimeEntries.Where(te => te.Id == timeEntry.Id);
        var result = await query.FirstOrDefaultAsync();
        var timeChanged = false;

        if (result == null)
        {
            return NotFound(new { message = "Invalid time entry Id", timeEntry.Id });
        }

        if (timeEntry.ClockIn != result.ClockIn)
        {
            result.ClockIn = timeEntry.ClockIn.ToUniversalTime();
            timeChanged = true;

        }
        if (timeEntry.ClockOut.HasValue && timeEntry.ClockOut != result.ClockOut)
        {
            result.ClockOut = timeEntry.ClockOut.Value.ToUniversalTime();
            timeChanged = true;
        }
        if (timeEntry.ProjectId.HasValue && timeEntry.ProjectId != result.ProjectId)
        {
            result.ProjectId = timeEntry.ProjectId;
            timeChanged = true;
        }
        if (timeEntry.LocationId.HasValue && timeEntry.LocationId != result.LocationId)
        {
            result.LocationId = timeEntry.LocationId;
            timeChanged = true;
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
                return BadRequest(new { message = "Clock out time cannot be earlier than clock in time", result.ClockIn, result.ClockOut });
            }
            var isoDuration = XmlConvert.ToString(duration.Value);
            result.Duration = isoDuration;
        }

        var updateResult = _context.TimeEntries.Update(result);
        if (updateResult == null)
        {
            return BadRequest(new { message = "Failed to update time entry. Result is null.", timeEntry.Id });
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

    /// <summary>
    /// Deletes a time entry.
    /// </summary>
    /// <param name="id">Id of existing time entry</param>
    /// <returns>ActionResult(404, 200)</returns>
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

    /// <summary>
    /// Gets a single time entry by Id.
    /// </summary>
    /// <param name="id">Id of existing time entry</param>
    /// <returns>A single time entry.</returns>
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

    /// <summary>
    /// Gets all time entries for a user within a date range.
    /// </summary>
    /// <param name="userId">User Id that time entries are being requested from</param>
    /// <param name="startDate">Time frame where the time entries start(optional)</param>
    /// <param name="endDate">Time frame where the time entries end(optional)</param>
    /// <returns>ActionResult(403, 404, 200) A list of TimeEntryDtos belong to that user and timeframe</returns>
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

    /// <summary>
    /// Gets the most recent time entry for a logged in user
    /// </summary>
    /// <returns>ActionResult(404, 401, 200). The most recent entry</returns>
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

    /// <summary>
    /// Gets all time entries for a currently LOGGED IN USER for a given date range.
    /// </summary>
    /// <param name="startDate"></param>
    /// <param name="endDate"></param>
    /// <returns>ActionResult(401, 404, 200). List of TimeEntryDtos</returns>
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
            return NotFound(new { message = "No time entries found for date range", userId, startDate, endDate });
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


    /// <summary>
    /// Gets payroll report for an organization within a date range.
    /// </summary>
    /// <param name="startDate">Start date of given pay period</param>
    /// <param name="endDate">End date of given pay period</param>
    /// <returns>ActionResult(400,403, 200) A list of PayrollReportDto's</returns>
    [HttpGet("payroll-report")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<IActionResult> GetPayrollReport(DateTime startDate, DateTime endDate)
    {
        if (startDate > endDate)
        {
            return BadRequest("Start date cannot be later than end date");
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || user.OrganizationId == null)
        {
            return Unauthorized("User is not associated with an organization");
        }

        var organizationId = user.OrganizationId.Value;

        var timeEntries = await _context.TimeEntries
            .Where(te => te.OrganizationId == organizationId
            && te.ClockIn >= startDate
            && te.ClockOut <= endDate)
            .Include(te => te.User)
            .ToListAsync();

        var payrollData = timeEntries
            .GroupBy(te => te.UserId)
            .Select(g => new PayRollReportDto
            {
                UserId = g.Key,
                UserName = g.First().User.Email ?? "Unknown",
                TotalHours = g.Sum(te => (te.ClockOut - te.ClockIn)?.TotalHours ?? 0),
                PayRate = g.First().User.PayRate ?? 0
            }).ToList();

        return Ok(payrollData);
    }

    /// <summary>
    /// Gets all time entries for a user within a date range. This one is another duplicate?? Why do I do this?
    /// </summary>
    /// <param name="userId">Specific user ID for time entries</param>
    /// <param name="startDate">Start date</param>
    /// <param name="endDate">End end</param>
    /// <returns>ActionResult(401, 200). TimeEntryDto list.</returns>
    [HttpGet("entries-by-uid-and-dates/{userId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<IActionResult> GetEntriesByUserIdAndDates(string userId, DateTime startDate, DateTime endDate)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || user.OrganizationId == null)
        {
            return Unauthorized("User is not associated with an organization");
        }

        var organizationId = user.OrganizationId.Value;

        var timeEntries = await _context.TimeEntries
            .Where(te => te.OrganizationId == organizationId
            && te.UserId == userId
            && te.ClockIn >= startDate
            && (te.ClockOut <= endDate || te.ClockOut == null))
            .Include(te => te.User)
            .ToListAsync();

        var timeEntryDtos = timeEntries.Select(te => new TimeEntryDto
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

    /// <summary>
    /// Returns a project report, including users and their hours worked towards a project.
    /// </summary>
    /// <param name="projectId">The ID of the project in question.</param>
    /// <param name="startDate">Start date</param>
    /// <param name="endDate">End date</param>
    /// <returns>ActionResult(404, 200, 401) PayrollReportDto list.</returns>
    [HttpGet("project-report/{projectId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<IActionResult> GetProjectReport(int projectId, DateTime startDate, DateTime endDate)
    {
        var organizationId = User.FindFirstValue("OrganizationId");
        if (string.IsNullOrEmpty(organizationId))
        {
            return Unauthorized("User is not part of an organization.");
        }

        var timeEntries = await _context.TimeEntries
            .Where(te => te.ProjectId == projectId
                         && te.OrganizationId == int.Parse(organizationId)
                         && te.ClockIn >= startDate
                         && te.ClockOut <= endDate)
            .Include(te => te.User)
            .ToListAsync();

        if (timeEntries.Count == 0)
        {
            return NotFound("No time entries found for the specified project and date range.");
        }

        var reportData = timeEntries
            .GroupBy(te => te.UserId)
            .ToList();

        var results = reportData
            .Select(g => new PayRollReportDto
            {
                UserId = g.Key,
                UserName = g.FirstOrDefault()?.User?.Email ?? "Unknown",
                TotalHours = g.Sum(te => te.ClockOut.HasValue
                                        ? (te.ClockOut.Value - te.ClockIn).TotalHours : 0),
                PayRate = g.FirstOrDefault()?.User?.PayRate ?? 0
            }).ToList();

        return Ok(results);

    }
}