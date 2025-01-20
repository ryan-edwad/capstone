using System.ComponentModel.DataAnnotations.Schema;

namespace HourMap.Entities;

public class Organization
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign Key for the user who created it
    // public string? CreatedBy { get; set; }
    // public ApplicationUser? Creator { get; set; }

    // Relationships
    public ICollection<ApplicationUser> Users { get; set; } = [];
    public ICollection<Project> Projects { get; set; } = [];
    public ICollection<Location> Locations { get; set; } = [];
    public ICollection<Invitation> Invitations { get; set; } = [];
    public ICollection<TimeEntry> TimeEntries { get; set; } = [];

    [NotMapped]
    public IEnumerable<ApplicationUser> Managers =>
        Users?.Where(u => u.ManagesOrganization) ?? [];

}
