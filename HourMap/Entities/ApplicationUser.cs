using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace HourMap.Entities;

public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? JobTitle { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PayRate { get; set; }
    public bool ManagesOrganization { get; set; } = false;

    // Navigation Properties
    public ICollection<UserProject> UserProjects { get; set; } = [];
    public ICollection<TimeEntry> TimeEntries { get; set; } = [];

    // Foreign Key
    public int? OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    // Additional Properties
    public bool LoginEnabled => !LockoutEnabled || (LockoutEnd.HasValue && LockoutEnd <= DateTimeOffset.Now);

    [NotMapped]
    public List<string> Roles { get; set; } = new List<string>();

}
