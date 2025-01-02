using HourMap.Data;
using HourMap.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using HourMap.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace HourMap.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IMapper _mapper;

    public ProjectController(ApplicationDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    [HttpGet]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager,Admin")]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjects()
    {
        var projects = await _dbContext.Projects.ToListAsync();
        return Ok(_mapper.Map<IEnumerable<ProjectDto>>(projects));
    }

    [HttpGet("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager,Admin")]
    public async Task<ActionResult<ProjectDto>> GetProject(int id)
    {
        var project = await _dbContext.Projects.FindAsync(id);
        if (project == null) return NotFound();
        return Ok(_mapper.Map<ProjectDto>(project));
    }

    [HttpPost]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<ActionResult<ProjectDto>> CreateProject(ProjectDto projectDto)
    {
        var project = _mapper.Map<Project>(projectDto);
        await _dbContext.Projects.AddAsync(project);
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, _mapper.Map<ProjectDto>(project));
    }

    [HttpPut("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<ActionResult<ProjectDto>> UpdateProject(int id, ProjectDto projectDto)
    {
        var project = await _dbContext.Projects.FindAsync(id);
        if (project == null) return NotFound();
        _mapper.Map(projectDto, project);
        await _dbContext.SaveChangesAsync();
        return Ok(_mapper.Map<ProjectDto>(project));
    }

    [HttpDelete("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<ActionResult> DeleteProject(int id)
    {
        var project = await _dbContext.Projects.FindAsync(id);
        if (project == null) return NotFound();

        _dbContext.Projects.Remove(project);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}
