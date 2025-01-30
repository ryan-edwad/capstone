namespace HourMap.Dtos;

public class EditUserByManagerDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string JobTitle { get; set; } = null!;
    public decimal PayRate { get; set; }

}
