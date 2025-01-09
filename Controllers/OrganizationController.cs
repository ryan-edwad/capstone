using System.Security.Claims;
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
public class OrganizationController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public OrganizationController(ApplicationDbContext context)
    {
        _context = context;
    }

    // Create Organization, authorized by new Manager accounts only, who don't already belong to an organization, and by admins
    [HttpPost("create")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager")]
    public async Task<IActionResult> CreateOrganization(CreateOrganizationDto createOrganizationDto)
    {
        // Get the user's ID
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized("Invalid user id");

        // Add the user to the organization as a manager
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return BadRequest(new { message = "User not found", userId });

        // Check if the user is already a manager of an organization and is not an admin
        var isAdmin = User.IsInRole("Admin");

        // var organization = await _context.Organizations.FirstOrDefaultAsync(o => o.CreatedBy == userId);
        // if (organization != null || !isAdmin) return BadRequest("User is already a manager of an organization");

        // Create a new organization
        var newOrganization = new Organization
        {
            Name = createOrganizationDto.Name,
        };
        await _context.Organizations.AddAsync(newOrganization);
        await _context.SaveChangesAsync();


        user.OrganizationId = newOrganization.Id;
        user.ManagesOrganization = true;
        await _context.SaveChangesAsync();

        var organizationDto = new OrganizationDto
        {
            Id = newOrganization.Id,
            Name = newOrganization.Name,
            // CreatedBy = newOrganization.CreatedBy,
            CreatedAt = newOrganization.CreatedAt.ToLocalTime()
        };

        return CreatedAtAction(nameof(GetOrganization), new { id = newOrganization.Id }, organizationDto);
    }

    // Get Organization by ID, authorized for Admins, and Managers/Users with the same Organization ID
    [HttpGet("get/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager,Admin")]
    public async Task<IActionResult> GetOrganization(int id)
    {
        var organization = await _context.Organizations.Include(o => o.Users).FirstOrDefaultAsync(o => o.Id == id);
        if (organization == null) return NotFound(new { message = "Organization not found", id });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return BadRequest(new { message = "User not authenticated" });

        if (user.OrganizationId != organization.Id && !isAdmin) return Unauthorized("Unauthorized to view this organization");

        var organizationDto = new OrganizationDto
        {
            Id = organization.Id,
            Name = organization.Name,
            // CreatedBy = organization.CreatedBy is null ? "None" : organization.CreatedBy,
            CreatedAt = organization.CreatedAt.ToLocalTime(),
            Users = organization.Users.Select(u => new ApplicationUserDto
            {
                Id = u.Id,
                FirstName = u.FirstName ?? string.Empty,
                LastName = u.LastName ?? string.Empty,
                Email = u.Email ?? string.Empty,
                JobTitle = u.JobTitle ?? string.Empty,
                PayRate = u.PayRate ?? 0
            }).ToList()
        };

        return Ok(organizationDto);
    }

    // Update Organization by ID, authorized by Admins and the manager who created the organization/ManageOrganization == true
    [HttpPut("update/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<IActionResult> UpdateOrganization(int id, string name)
    {
        var organization = await _context.Organizations.FindAsync(id);
        if (organization == null) return NotFound(new { message = "Organization not found", id });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return BadRequest(new { message = "User not authenticated" });
        var organizationManager = user.ManagesOrganization;

        // if (organization.CreatedBy != userId && !organizationManager || !isAdmin) return Unauthorized("Unauthorized to update this organization");

        organization.Name = name;
        await _context.SaveChangesAsync();

        var organizationDto = new OrganizationDto
        {
            Id = organization.Id,
            Name = organization.Name,
            // CreatedBy = organization.CreatedBy is null ? "None" : organization.CreatedBy,
            CreatedAt = organization.CreatedAt.ToLocalTime()
        };

        return Ok(new { message = "Organization updated successfully!", organizationDto });
    }

    // Delete Organization by ID, authorized by Admins and the manager who created the Organization/ManageOrganization == true
    [HttpDelete("delete/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<IActionResult> DeleteOrganization(int id)
    {
        var organization = await _context.Organizations.FindAsync(id);
        if (organization == null) return NotFound(new { message = "Organization not found", id });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return BadRequest(new { message = "User not authenticated" });
        var organizationManager = user.ManagesOrganization;

        if (!organizationManager || !isAdmin) return Unauthorized("Unauthorized to delete this organization");

        _context.Organizations.Remove(organization);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Organization deleted successfully! :(" });
    }

    // Get all organizations, authorized by admins only
    [HttpGet("list")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> GetOrganizations()
    {
        var organizationDtos = await _context.Organizations.Select(o => new OrganizationDto
        {
            Id = o.Id,
            Name = o.Name,
            // CreatedBy = o.CreatedBy ?? "None",
            CreatedAt = o.CreatedAt.ToLocalTime()
        }).ToListAsync();


        return Ok(organizationDtos);
    }




}
