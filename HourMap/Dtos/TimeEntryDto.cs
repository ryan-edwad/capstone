namespace HourMap.Dtos;

public class TimeEntryDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = null!;
    public DateTime ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    public string? Duration { get; set; }
    public int? ProjectId { get; set; }
    public int? LocationId { get; set; }

}
