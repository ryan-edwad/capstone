using Microsoft.AspNetCore.Identity;

namespace HourMap.Entities;

public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? JobTitle { get; set; }
    public decimal? PayRate { get; set; }
    public bool ManagesOrganization { get; set; } = false;

    // Navigation Properties
    public ICollection<UserProject> UserProjects { get; set; } = [];
    public ICollection<TimeEntry> TimeEntries { get; set; } = [];

    // Foreign Key
    public int? OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

}
