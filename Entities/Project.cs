namespace HourMap.Entities;

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public bool Enabled { get; set; } = true;

    // Foreign Key to organization
    public int OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    // Relationships
    public ICollection<UserProject> UserProjects { get; set; } = [];
}
