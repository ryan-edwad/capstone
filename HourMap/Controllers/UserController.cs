﻿using System.Security.Claims;
using HourMap.Data;
using HourMap.Dtos;
using HourMap.Entities;
using HourMap.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HourMap.Controllers;

/// <summary>
/// Controller for managing users in the organization.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IJwtTokenGenerator _jwtTokenService;

    public UserController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IJwtTokenGenerator jwtTokenService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _jwtTokenService = jwtTokenService;
    }

    /// <summary>
    /// Get all users in an organization, only for managers and admins
    /// </summary>
    /// <returns>ActionResult(200, 404, 401, 400). List of ApplicationUserDto's</returns>
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
            PayRate = u.PayRate ?? 0,
            Roles = _userManager.GetRolesAsync(u).Result.ToList()
        });

        if (userDtos == null)
            return NotFound("No users found in the organization.");

        return Ok(userDtos);
    }

    /// <summary>
    /// Get a single user by id, only for managers with the same organization ID and admins
    /// </summary>
    /// <param name="id">The id of the user in question</param>
    /// <returns>ActionResult(401, 400, 404, 200) ApplicationUserDto</returns>
    [HttpGet("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager, Admin")]
    public async Task<IActionResult> GetUser(string id)
    {
        var organizationClaim = User.FindFirst("OrganizationId")?.Value;
        if (string.IsNullOrEmpty(organizationClaim))
            return Unauthorized("Access denied. OrganizationId is missing in the token.");
        if (!int.TryParse(organizationClaim, out var organizationId))
            return BadRequest("Invalid OrganizationId in token.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == organizationId);
        if (user == null)
            return NotFound("User not found in the organization.");

        var userDto = new ApplicationUserDto
        {
            Id = user.Id,
            FirstName = !string.IsNullOrWhiteSpace(user.FirstName) ? user.FirstName : string.Empty,
            LastName = !string.IsNullOrWhiteSpace(user.LastName) ? user.LastName : string.Empty,
            Email = !string.IsNullOrWhiteSpace(user.Email) ? user.Email : string.Empty,
            JobTitle = !string.IsNullOrWhiteSpace(user.JobTitle) ? user.JobTitle : string.Empty,
            PayRate = user.PayRate.HasValue ? user.PayRate.Value : 0,
            LoginEnabled = user.LoginEnabled
        };

        return Ok(userDto);
    }

    /// <summary>
    /// Edit a user profile as a manager, all fields enabled managers and admins
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="userDto">User DTO - first, last, email, job, payrate </param>
    /// <returns>ActionResult(401,400,404,200)</returns>
    [HttpPut("edit-by-manager/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager, Admin")]
    public async Task<IActionResult> EditUserByManager(string id, EditUserByManagerDto userDto)
    {
        var organizationClaim = User.FindFirst("OrganizationId")?.Value;
        if (string.IsNullOrEmpty(organizationClaim))
            return Unauthorized(new { message = "Access denied. OrganizationId is missing in the token." });
        if (!int.TryParse(organizationClaim, out var organizationId))
            return BadRequest(new { message = "Invalid OrganizationId in token." });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == organizationId);
        if (user == null)
            return NotFound(new { message = "User not found in the organization." });

        user.FirstName = userDto.FirstName;
        user.LastName = userDto.LastName;
        user.Email = userDto.Email;
        user.JobTitle = userDto.JobTitle;
        user.PayRate = userDto.PayRate;

        await _context.SaveChangesAsync();

        return Ok(new { message = "User profile updated successfully." });
    }

    /// <summary>
    /// Edit a user profile as the user, some fields not enabled (cannot change pay rate or job title)
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="userDto">EditUserProfileDto, has some fields removed from the EditByManagerDto</param>
    /// <returns>ActionResult(404,401,200). A new token to refresh the user data immediately.</returns>
    [HttpPut("edit-my-profile/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin,Manager,Employee")]
    public async Task<IActionResult> EditMyProfile(string id, EditUserProfileDto userDto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound("User not found.");

        if (user.Id != id)
            return Unauthorized("Access denied. You can only edit your own profile.");

        user.FirstName = userDto.FirstName;
        user.LastName = userDto.LastName;
        user.Email = userDto.Email;

        await _context.SaveChangesAsync();

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtTokenService.GenerateToken(user, roles);

        return Ok(new { message = "User profile updated successfully.", token });
    }

    /// <summary>
    /// Assign a project to a user, only for managers and admins
    /// </summary>
    /// <param name="userId">User ID to assignt the project to</param>
    /// <param name="projectDto">The project to assign to the user</param>
    /// <returns>ActionResult(401,400,404,200)</returns>
    [HttpPost("assign-project/{userId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager, Admin")]
    public async Task<IActionResult> AssignProjectToUser(string userId, ProjectDto projectDto)
    {
        var organizationClaim = User.FindFirst("OrganizationId")?.Value;
        if (string.IsNullOrEmpty(organizationClaim))
            return Unauthorized("Access denied. OrganizationId is missing in the token.");
        if (!int.TryParse(organizationClaim, out var organizationId))
            return BadRequest("Invalid OrganizationId in token.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == organizationId);
        if (user == null)
            return NotFound("User not found in the organization.");

        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectDto.Id && p.OrganizationId == organizationId);
        if (project == null)
            return NotFound("Project not found in the organization.");

        var userProject = new UserProject
        {
            UserId = userId,
            ProjectId = projectDto.Id
        };

        await _context.UserProjects.AddAsync(userProject);
        await _context.SaveChangesAsync();

        return Ok("Project assigned to user successfully.");
    }

    /// <summary>
    /// Remove a project from a user
    /// </summary>
    /// <param name="userId">User to remove project from</param>
    /// <param name="projectId">Project to remove from that user</param>
    /// <returns>ActionResult(401, 400, 404, 200)</returns>
    [HttpDelete("remove-project/{userId}/{projectId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager, Admin")]
    public async Task<IActionResult> RemoveProjectFromUser(string userId, int projectId)
    {
        var organizationClaim = User.FindFirst("OrganizationId")?.Value;
        if (string.IsNullOrEmpty(organizationClaim))
            return Unauthorized("Access denied. OrganizationId is missing in the token.");
        if (!int.TryParse(organizationClaim, out var organizationId))
            return BadRequest("Invalid OrganizationId in token.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == organizationId);
        if (user == null)
            return NotFound("User not found in the organization.");

        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId && p.OrganizationId == organizationId);
        if (project == null)
            return NotFound("Project not found in the organization.");

        var userProject = await _context.UserProjects.FirstOrDefaultAsync(up => up.UserId == userId && up.ProjectId == projectId);
        if (userProject == null)
            return NotFound("Project not assigned to user.");

        _context.UserProjects.Remove(userProject);
        await _context.SaveChangesAsync();

        return Ok("Project removed from user successfully.");
    }

    /// <summary>
    /// Get all projects for a user
    /// </summary>
    /// <param name="userId">User to get projects for</param>
    /// <returns>ActionResult(401,400,404,200) List of ProjectDtos</returns>
    [HttpGet("projects/{userId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager, Admin")]
    public async Task<IActionResult> GetProjectsForUser(string userId)
    {
        var organizationClaim = User.FindFirst("OrganizationId")?.Value;
        if (string.IsNullOrEmpty(organizationClaim))
            return Unauthorized("Access denied. OrganizationId is missing in the token.");
        if (!int.TryParse(organizationClaim, out var organizationId))
            return BadRequest("Invalid OrganizationId in token.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == organizationId);
        if (user == null)
            return NotFound("User not found in the organization.");

        var userProjects = await _context.UserProjects.Where(up => up.UserId == userId).ToListAsync();
        if (userProjects == null)
            return NotFound("No projects found for the user.");

        var projectDtos = userProjects.Select(up => new ProjectDto
        {
            Id = up.ProjectId,
            Name = up.Project.Name,
            Description = up.Project.Description
        });

        return Ok(projectDtos);
    }

    /// <summary>
    /// Promote user to manager
    /// </summary>
    /// <param name="userId">UserId to promote to manager</param>
    /// <returns>ActionResult(401,400,404,200)</returns>
    [HttpPost("add-manager-role/{userId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager, Admin")]
    public async Task<IActionResult> AddManagerRole(string userId)
    {
        var organizationClaim = User.FindFirst("OrganizationId")?.Value;
        if (string.IsNullOrEmpty(organizationClaim))
            return Unauthorized("Access denied. OrganizationId is missing in the token.");
        if (!int.TryParse(organizationClaim, out var organizationId))
            return BadRequest("Invalid OrganizationId in token.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == organizationId);
        if (user == null)
            return NotFound("User not found in the organization.");

        if (await _userManager.IsInRoleAsync(user, "Manager"))
            return BadRequest("User is already a manager.");

        // Remove employee role, swap to manager role here...
        if (await _userManager.IsInRoleAsync(user, "Employee"))
        {
            var removeResult = await _userManager.RemoveFromRoleAsync(user, "Employee");
            if (!removeResult.Succeeded)
            {
                return BadRequest(new { message = "Failed to remove employee role from user." });
            }
            else
            {
                var addResult = await _userManager.AddToRoleAsync(user, "Manager");
                if (!addResult.Succeeded)
                    return BadRequest(new { message = "Failed to add manager role to user." });
            }

        }
        user.ManagesOrganization = true;
        await UpdateRoleClaimsAsync(user, "Manager");

        await _context.SaveChangesAsync();

        return Ok(new { message = "Manager role added to user successfully." });
    }

    /// <summary>
    /// Remove manager role from a user
    /// </summary>
    /// <param name="userId">UserId to remove the manager role from</param>
    /// <returns>ActionResult(401,400,404,200)</returns>
    [HttpPost("remove-manager-role/{userId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager, Admin")]
    public async Task<IActionResult> RemoveManagerRole(string userId)
    {
        var organizationClaim = User.FindFirst("OrganizationId")?.Value;
        if (string.IsNullOrEmpty(organizationClaim))
            return Unauthorized("Access denied. OrganizationId is missing in the token.");
        if (!int.TryParse(organizationClaim, out var organizationId))
            return BadRequest("Invalid OrganizationId in token.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == organizationId);
        if (user == null)
            return NotFound("User not found in the organization.");

        if (await _userManager.IsInRoleAsync(user, "Manager"))
        {
            var removeResult = await _userManager.RemoveFromRoleAsync(user, "Manager");
            if (!removeResult.Succeeded)
            {
                return BadRequest(new { message = "Failed to remove manager role from user." });
            }
            else
            {
                var addResult = await _userManager.AddToRoleAsync(user, "Employee");
                if (!addResult.Succeeded)
                    return BadRequest(new { message = "Failed to add employee role to user." });
            }
        }
        await UpdateRoleClaimsAsync(user, "Employee");
        user.ManagesOrganization = false;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Manager role removed from user successfully." });
    }

    /// <summary>
    /// Disable sign in for a user
    /// </summary>
    /// <param name="userId">UserId of the user to be disabled</param>
    /// <returns>ActionResult(401,400,404,200)</returns>
    [HttpPut("disable-sign-in/{userId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager, Admin")]
    public async Task<IActionResult> DisableSignInForUser(string userId)
    {
        var organizationClaim = User.FindFirst("OrganizationId")?.Value;
        if (string.IsNullOrEmpty(organizationClaim))
            return Unauthorized("Access denied. OrganizationId is missing in the token.");
        if (!int.TryParse(organizationClaim, out var organizationId))
            return BadRequest("Invalid OrganizationId in token.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == organizationId);
        if (user == null)
            return NotFound(new { message = "User not found in the organization." });

        if (user.LockoutEnd == null || user.LockoutEnd < DateTimeOffset.UtcNow)
        {
            user.LockoutEnabled = true;
            user.LockoutEnd = DateTimeOffset.UtcNow.AddYears(100);
        }
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to disable sign in for user." });

        return Ok(new { message = "User sign in disabled successfully." });
    }

    /// <summary>
    /// Enable sign in for a user
    /// </summary>
    /// <param name="userId">UserId of the user to be enabled</param>
    /// <returns>ActionResult(401,400,404,200)</returns>
    [HttpPut("enable-sign-in/{userId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager, Admin")]
    public async Task<IActionResult> EnableSignInForUser(string userId)
    {
        var organizationClaim = User.FindFirst("OrganizationId")?.Value;
        if (string.IsNullOrEmpty(organizationClaim))
            return Unauthorized("Access denied. OrganizationId is missing in the token.");
        if (!int.TryParse(organizationClaim, out var organizationId))
            return BadRequest("Invalid OrganizationId in token.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == organizationId);
        if (user == null)
            return NotFound("User not found in the organization.");

        user.LockoutEnabled = false;
        user.LockoutEnd = null;
        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to disable sign in for user." });

        return Ok(new { message = "User sign in enabled successfully." });
    }

    /// <summary>
    /// Update the claims associated with a user's role
    /// </summary>
    /// <param name="user">The user being updated</param>
    /// <param name="newRole">The new role to add to claims</param>
    /// <returns>Only returns if the new role is invalid</returns>
    private async Task UpdateRoleClaimsAsync(ApplicationUser user, string newRole)
    {
        if (string.IsNullOrWhiteSpace(newRole))
            return;

        // Remove existing claims for roles
        var claims = await _userManager.GetClaimsAsync(user);
        foreach (var claim in claims.Where(c => c.Type == ClaimTypes.Role))
        {
            await _userManager.RemoveClaimAsync(user, claim);
        }

        // Add claims associated with the new role
        if (await _roleManager.RoleExistsAsync(newRole))
        {
            var role = await _roleManager.FindByNameAsync(newRole);
            if (role == null)
                return;
            var roleClaims = await _roleManager.GetClaimsAsync(role);
            foreach (var claim in roleClaims)
            {
                await _userManager.AddClaimAsync(user, claim);
            }
        }
    }

}
