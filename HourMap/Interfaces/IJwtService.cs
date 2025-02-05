using HourMap.Entities;

namespace HourMap.Interfaces;

/// <summary>
/// Interface for JwtService
/// </summary>
public interface IJwtTokenGenerator
{
    string GenerateToken(ApplicationUser user, IList<string> roles);

}
