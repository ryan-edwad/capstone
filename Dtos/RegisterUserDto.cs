using System.ComponentModel.DataAnnotations;

namespace HourMap.Dtos;

public class RegisterUserDto
{
    [EmailAddress]
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
}
