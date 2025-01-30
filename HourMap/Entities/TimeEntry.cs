namespace HourMap.Entities;

public class TimeEntry
{
    public int Id { get; set; }
    public string UserId { get; set; } = null!;
    public DateTime ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    public int? ProjectId { get; set; }
    public int? LocationId { get; set; }
    public string? Duration { get; set; }
    public int OrganizationId { get; set; }

    // Navigation Properties
    public ApplicationUser User { get; set; } = null!;
    public Organization Organization { get; set; } = null!;
}
