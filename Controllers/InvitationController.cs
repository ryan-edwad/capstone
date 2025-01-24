using System.Security.Claims;
using HourMap.Data;
using HourMap.Dtos;
using HourMap.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HourMap.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvitationController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    public InvitationController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("invitations")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager")]
    public async Task<IActionResult> GetInvitations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized(new { message = "Invalid user." });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Unauthorized(new { message = "User not found." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var isManager = roles.Contains("Manager");
        var isAdmin = roles.Contains("Admin");

        var invitations = await _context.Invitations
            .Where(i => i.OrganizationId == user.OrganizationId && i.ExpirationDate > DateTime.UtcNow)
            .Select(i => new InvitationDto
            {
                Id = i.Id,
                Email = i.Email,
                OrganizationId = i.OrganizationId,
                Token = i.Token,
                ExpirationDate = i.ExpirationDate
            }).ToListAsync();

        return Ok(invitations);
    }

    [HttpPost("invite")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager")]
    public async Task<IActionResult> InviteUser(InviteUserDto inviteUserDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized(new { message = "Invalid user." });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Unauthorized(new { message = "User not found." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var isManager = roles.Contains("Manager");
        var isAdmin = roles.Contains("Admin");

        if (isManager && !isAdmin && user.OrganizationId != inviteUserDto.OrganizationId)
        {
            return Forbid("Managers can only invite users to their own organization.");
        }

        var token = Guid.NewGuid().ToString();

        var userExists = await _userManager.FindByEmailAsync(inviteUserDto.Email);
        if (userExists != null)
        {
            return BadRequest(new { message = "User already exists." });
        }

        var invitationExists = await _context.Invitations.AnyAsync(i => i.Email == inviteUserDto.Email && i.OrganizationId == inviteUserDto.OrganizationId && i.ExpirationDate > DateTime.UtcNow);
        if (invitationExists)
        {
            return BadRequest(new { message = "Invitation already exists.", invitationExists });
        }

        var invitation = new Invitation
        {
            Email = inviteUserDto.Email,
            OrganizationId = inviteUserDto.OrganizationId,
            Token = token,
            ExpirationDate = DateTime.UtcNow.AddDays(7)
        };

        _context.Invitations.Add(invitation);
        await _context.SaveChangesAsync();

        var registrationLink = $"{Request.Scheme}://{Request.Host}/register?token={token}";

        // TO DO - Send email with token to new user
        // await _emailService.SendInvitationEmail(inviteUserDto.Email, token);
        /*
        Workflow: Relying on the User's Email Provider
        1. Manager Creates an Invitation
        The manager generates an invitation using the web application.
            The invitation contains:
                The invitee's email.
                A unique token or URL that allows the invitee to register.
        2. Application Provides a Sharable Link
            Instead of sending the email directly, the application generates:
                A pre-filled mailto link or
                A copyable link for the manager to share manually.
        3. Manager Sends the Invitation
            The manager opens their default email client via the mailto link, which pre-fills:
                Recipient (invitee's email address).
                Subject line (e.g., "You've Been Invited to Join HourMap").
                Email body containing the registration link.
        4. Invitee Registers
            The invitee clicks the link and completes registration.
            The token in the URL ensures that the invite is valid and tied to the correct organization.
        */

        return Ok(new { registrationLink });
    }

    // TODO cancel/delete an invitation
    [HttpDelete("cancel/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager")]
    public async Task<IActionResult> CancelInvitation(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized(new { message = "Invalid user." });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Unauthorized(new { message = "User not found." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var isManager = roles.Contains("Manager");
        var isAdmin = roles.Contains("Admin");

        var invitation = await _context.Invitations.FindAsync(id);
        if (invitation == null)
        {
            return NotFound(new { message = "Invitation not found." });
        }

        if (isManager && !isAdmin && user.OrganizationId != invitation.OrganizationId)
        {
            return Forbid("Managers can only cancel invitations from their own organization.");
        }

        _context.Invitations.Remove(invitation);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Invitation canceled." });
    }

}
