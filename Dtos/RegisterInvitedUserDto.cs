namespace HourMap.Dtos;

public class RegisterInvitedUserDto
{
    public required string UserName { get; set; }
    public required string Password { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Token { get; set; }
    public int? OrganizationId { get; set; }
}
