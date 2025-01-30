using HourMap.Entities;

namespace HourMap.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(ApplicationUser user, IList<string> roles);

}
