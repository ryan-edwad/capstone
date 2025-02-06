namespace HourMap;

/**
 * Data transfer object for the PayRollReport entity.
 * B. ENCAPSULATION
 */

public class PayRollReportDto
{
    public string UserId { get; set; } = null!;
    public string UserName { get; set; } = null!;
    public double TotalHours { get; set; }
    public decimal PayRate { get; set; }

}
