using HourMap.Data;
using HourMap.Dtos;
using HourMap.Entities;
using HourMap.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HourMap.Controllers;

/// <summary>
/// Auth Controller is responsible for handling user authentication and authorization.
/// B. INHERITANCE
/// </summary>
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

    /// <summary>
    /// Register a new user.
    /// </summary>
    /// <param name="registerUserDto">A DTO representing a minified ApplicationUser object. Including username, email, first and last name. </param>
    /// <returns>Status code depending on the result (400, 200)</returns>
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserDto registerUserDto)
    {
        /// B. VALIDATION FUNCTIONALITY
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
    /// <summary>
    /// Register a new user using an invitation token.
    /// </summary>
    /// <param name="registerInvitedUserDto">Similar to registerUserDto, includes the OrgId registered to.</param>
    /// <returns>Status code depending on result (400, 200)</returns>
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

    /// <summary>
    /// Login a user.
    /// </summary>
    /// <param name="loginUserDto">Email/Password</param>
    /// <returns>Status Code (200, 401), as well as an authResponse with the user's otoken and info.</returns>
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

}
