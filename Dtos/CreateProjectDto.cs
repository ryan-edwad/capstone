namespace HourMap.Dtos;

public class CreateProjectDto
{
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public int OrganizationId { get; set; }
    public bool Enabled { get; set; } = true;


}
