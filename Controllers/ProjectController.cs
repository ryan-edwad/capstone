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
}
