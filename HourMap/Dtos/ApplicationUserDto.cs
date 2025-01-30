namespace HourMap.Dtos;

public class ApplicationUserDto
{
    public required string Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public required string Email { get; set; }
    public string JobTitle { get; set; } = null!;
    public decimal PayRate { get; set; }
    public bool LoginEnabled { get; set; }
    public List<string> Roles { get; set; } = new();

}
