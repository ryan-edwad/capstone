namespace HourMap.Entities;


/// <summary>
/// Represents a location where work can be done.
/// </summary>
public class Location
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string City { get; set; } = null!;
    public string State { get; set; } = null!;
    public string Description { get; set; } = null!;

    // Foreign Key to organization
    public int OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
}
