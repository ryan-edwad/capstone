using HourMap.Data;
using HourMap.Dtos;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HourMap.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UserController(ApplicationDbContext context)
    {
        _context = context;
    }
    // TODO: Get all users in an organization, only for managers and admins
    [HttpGet]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager")]
    public async Task<IActionResult> GetUsers()
    {
        var organizationClaim = User.FindFirst("OrganizationId")?.Value;
        if (string.IsNullOrEmpty(organizationClaim))
            return Unauthorized("Access denied. OrganizationId is missing in the token.");
        if (!int.TryParse(organizationClaim, out var organizationId))
            return BadRequest("Invalid OrganizationId in token.");
        var users = await _context.Users.Where(u => u.OrganizationId == organizationId).ToListAsync();

        var userDtos = users.Select(u => new ApplicationUserDto
        {
            Id = u.Id,
            FirstName = !string.IsNullOrWhiteSpace(u.FirstName) ? u.FirstName : string.Empty,
            LastName = !string.IsNullOrWhiteSpace(u.LastName) ? u.LastName : string.Empty,
            Email = !string.IsNullOrWhiteSpace(u.Email) ? u.Email : string.Empty,
            JobTitle = !string.IsNullOrWhiteSpace(u.JobTitle) ? u.JobTitle : string.Empty,
            PayRate = u.PayRate.HasValue ? u.PayRate.Value : 0,
        });

        if (userDtos == null)
            return NotFound("No users found in the organization.");

        return Ok(userDtos);
    }

    // TODO: Get a single user by id, only for managers and admins

    // TODO: Edit a user profile as a manager, all fields enabled managers and admins

    // TODO: Edit a user profile as the user, some fields not enabled (cannot change pay rate or job title)

    // TODO: Assign a project to a user, only for managers and admins

    // TODO: Remove a project from a user, only for managers and admins

    // TODO: Get all projects for a user

    // TODO: Add role to a user, only for admins/managers with ManageOrganization == true

    // TODO: Remove role from a user, only for admins/managers with ManageOrganization == true

    // TODO: Disable sign in for a user, only for admins/managers with ManageOrganization == true

    // TODO: Delete a user, only for managers and admins. MAKE SURE THIS DOES NOT DELETE TIME ENTRIES.

}
