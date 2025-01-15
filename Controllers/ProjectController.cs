using HourMap.Data;
using HourMap.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HourMap.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;

namespace HourMap.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public ProjectController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("get-projects")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager,Admin")]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjects()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized("Invalid user.");
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return Unauthorized("User not found.");
        }

        var organizationId = user.OrganizationId;
        if (organizationId == null)
        {
            return BadRequest("User is not associated with an organization.");
        }

        var projects = await _dbContext.Projects
            .Where(p => p.OrganizationId == organizationId) // Optional: Filter only "enabled" projects
            .ToListAsync();

        return Ok(projects);
    }

    [HttpGet("get/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager,Admin")]
    public async Task<ActionResult<ProjectDto>> GetProject(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized("Invalid user.");
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return Unauthorized("User not found.");
        }

        var organizationId = user.OrganizationId;
        if (organizationId == null)
        {
            return BadRequest("User is not associated with an organization.");
        }

        var project = await _dbContext.Projects
            .Where(p => p.OrganizationId == organizationId)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (project == null) return NotFound();
        return Ok(project);
    }

    [HttpPost("create")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectDto createProjectDto)
    {
        var project = new Project
        {
            Name = createProjectDto.Name,
            Description = createProjectDto.Description,
            OrganizationId = createProjectDto.OrganizationId,
            Enabled = createProjectDto.Enabled
        };
        await _dbContext.Projects.AddAsync(project);
        await _dbContext.SaveChangesAsync();
        var newProject = new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Enabled = project.Enabled
        };
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, newProject);
    }

    [HttpPut("update")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<ActionResult<ProjectDto>> UpdateProject(ProjectDto projectDto)
    {
        var project = await _dbContext.Projects.FindAsync(projectDto.Id);
        if (project == null) return NotFound();

        project.Name = projectDto.Name;
        project.Description = projectDto.Description;
        project.Enabled = projectDto.Enabled;

        await _dbContext.SaveChangesAsync();
        return Ok(projectDto);
    }

    [HttpDelete("delete")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<ActionResult> DeleteProject(ProjectDto projectDto)
    {
        var project = await _dbContext.Projects.FindAsync(projectDto.Id);
        if (project == null) return NotFound();

        _dbContext.Projects.Remove(project);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/assigned-users")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<ActionResult<IEnumerable<ApplicationUserDto>>> GetAssignedUsers(int id)
    {
        var project = await _dbContext.Projects.Include(p => p.UserProjects)
                                               .ThenInclude(up => up.User)
                                               .FirstOrDefaultAsync(p => p.Id == id);
        if (project == null) return NotFound();

        var assignedUsers = project.UserProjects.Select(up => new ApplicationUserDto
        {
            Id = up.User.Id,
            FirstName = up.User.FirstName ?? "",
            LastName = up.User.LastName ?? "",
            Email = up.User.Email ?? "",
            JobTitle = up.User.JobTitle ?? "",
            PayRate = up.User.PayRate ?? 0

        }).ToList();

        if (assignedUsers.Count == 0)
        {
            return Ok(new List<ApplicationUserDto>());
        }

        return Ok(assignedUsers);
    }

    [HttpPost("{id}/update-users")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<IActionResult> UpdateProjectUsers(int id, List<string> userIds)
    {
        // Load the project along with its related user-project associations
        var project = await _dbContext.Projects
            .Include(p => p.UserProjects)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
            return NotFound(new { message = $"Project with ID {id} not found." });

        // Validate that all userIds exist in the database
        var validUserIds = await _dbContext.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync();

        if (validUserIds.Count != userIds.Count)
        {
            var invalidUserIds = userIds.Except(validUserIds).ToList();
            return BadRequest(new
            {
                message = "Some user IDs are invalid.",
                invalidUserIds
            });
        }

        // Clear the existing user-project stuff out. 
        _dbContext.UserProjects.RemoveRange(project.UserProjects);

        var newAssignments = validUserIds.Select(userId => new UserProject
        {
            UserId = userId,
            ProjectId = id,
            OrganizationId = project.OrganizationId
        });

        foreach (var entry in newAssignments)
        {
            Console.WriteLine($"Assigning UserId {entry.UserId} to ProjectId {entry.ProjectId}");
        }


        await _dbContext.UserProjects.AddRangeAsync(newAssignments);
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Users assigned to project." });
    }
}

