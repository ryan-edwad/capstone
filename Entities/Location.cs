namespace HourMap.Entities;

public class Location
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;

    // Foreign Key to organization
    public int OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
}
