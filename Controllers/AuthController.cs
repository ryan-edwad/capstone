using System.Security.Claims;
using HourMap.Data;
using HourMap.Dtos;
using HourMap.Entities;
using HourMap.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HourMap.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ApplicationDbContext _context;

    public AuthController(UserManager<ApplicationUser> userManager, IJwtTokenGenerator jwtTokenGenerator, ApplicationDbContext context)
    {
        _userManager = userManager;
        _jwtTokenGenerator = jwtTokenGenerator;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserDto registerUserDto)
    {

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            Console.WriteLine("Validation Errors: " + string.Join(", ", errors));
            return BadRequest(ModelState);
        }

        var user = new ApplicationUser
        {
            UserName = registerUserDto.Email,
            Email = registerUserDto.Email,
            FirstName = registerUserDto.FirstName,
            LastName = registerUserDto.LastName
        };

        var result = await _userManager.CreateAsync(user, registerUserDto.Password);
        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(user, "Manager");
            return Ok(new { message = "User created successfully!" });
        }

        return BadRequest(result.Errors);

    }

    [HttpPost("register/invite")]
    public async Task<IActionResult> RegisterInvitedUser(RegisterInvitedUserDto registerInvitedUserDto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            Console.WriteLine("Validation Errors: " + string.Join(", ", errors));
            return BadRequest(ModelState);
        }

        var invitation = await _context.Invitations.FirstOrDefaultAsync(i => i.Token == registerInvitedUserDto.Token);
        if (invitation == null || invitation.ExpirationDate < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Invalid or expired invitation token." });
        }

        var user = new ApplicationUser
        {
            UserName = invitation.Email,
            Email = invitation.Email,
            FirstName = registerInvitedUserDto.FirstName,
            LastName = registerInvitedUserDto.LastName,
            OrganizationId = invitation.OrganizationId
        };

        var result = await _userManager.CreateAsync(user, registerInvitedUserDto.Password);
        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(user, "Employee");
            _context.Invitations.Remove(invitation);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User created successfully!" });
        }

        return BadRequest(result.Errors);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginUserDto loginUserDto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _userManager.FindByNameAsync(loginUserDto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, loginUserDto.Password))
        {
            return Unauthorized(new { message = "Invalid username or password" });
        }

        if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
        {
            return Unauthorized(new { message = "User is locked out. Please contact your administrator." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtTokenGenerator.GenerateToken(user, roles);

        var authResponse = new
        {
            token,
            userId = user.Id,
            email = user.Email,
            organizationId = user.OrganizationId?.ToString(),
            roles
        };

        return Ok(authResponse);

    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken()
    {
        var token = Request.Headers["Authorization"];
        Console.WriteLine("Authorization Header: " + token);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            Console.WriteLine("No User ID in token.");
            return Unauthorized("Invalid token: User ID not found.");
        }

        var user = await _userManager.FindByIdAsync(userId);
        Console.WriteLine("User: " + user);
        if (user == null)
        {
            Console.WriteLine($"User not found: {userId}");
            return Unauthorized("Invalid token: User does not exist.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var newToken = _jwtTokenGenerator.GenerateToken(user, roles);

        return Ok(new { token = newToken });
    }

}
