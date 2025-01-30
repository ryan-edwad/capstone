namespace HourMap.Entities;

public class UserProject
{
    public string UserId { get; set; } = null!;
    public int ProjectId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public Project Project { get; set; } = null!;

    // Future implementation of job roles for each project?
    public string? Role { get; set; } = null!;

    // Limiting this to a single organization
    public int OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
}
