namespace HourMap.Dtos;

public class OrganizationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

}
