using System.Security.Claims;
using System.Text;
using HourMap.Entities;
using HourMap.Interfaces;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace HourMap.Services;

/// <summary>
/// Generates a JWT token for a user, implements the interface IJwtTokenGenerator.
/// </summary>
/// <param name="configuration">Access to Appsettings.json, env variables, etc.</param>
public class JwtTokenGenerator(IConfiguration configuration) : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration = configuration;

    /// <summary>
    /// Generates a JWT token for a user with the given roles.
    /// </summary>
    /// <param name="user">The user we're generating a token for</param>
    /// <param name="roles">The roles we're assigning the user</param>
    /// <returns></returns>
    /// <exception cref="ArgumentNullException"></exception>
    /// <exception cref="ArgumentException"></exception>
    public string GenerateToken(ApplicationUser user, IList<string> roles)
    {
        if (user is null)
        {
            throw new ArgumentNullException(nameof(user));
        }

        if (roles is null)
        {
            throw new ArgumentNullException(nameof(roles));
        }

        // Define the tokens claims, or properties from the user to include in the token
        var claims = new List<Claim>{
            new Claim(JwtRegisteredClaimNames.Sub, user.Id ?? throw new ArgumentNullException(nameof(user.Id))),
            new Claim(JwtRegisteredClaimNames.Name, user.UserName ?? throw new ArgumentNullException(nameof(user.UserName))),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? throw new ArgumentNullException(nameof(user.Email))),
            new Claim(JwtRegisteredClaimNames.GivenName, user.FirstName ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.FamilyName, user.LastName ?? string.Empty),
            new Claim("OrganizationId", user.OrganizationId?.ToString() ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Add roles
        if (roles == null) throw new ArgumentNullException(nameof(roles));
        foreach (var role in roles)
        {
            if (string.IsNullOrWhiteSpace(role)) throw new ArgumentException("Role cannot be null or empty.", nameof(roles));
            claims.Add(new Claim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", role));
        }

        // Sign it
        var jwtKey = _configuration["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey)) throw new ArgumentNullException(nameof(jwtKey), "JWT key cannot be null or empty");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Define token descriptor
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(6),
            SigningCredentials = creds
        };

        // Create that token!
        var tokenHandler = new JsonWebTokenHandler();
        return tokenHandler.CreateToken(tokenDescriptor);
    }
}
