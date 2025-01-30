namespace HourMap;

public class PayRollReportDto
{
    public string UserId { get; set; } = null!;
    public string UserName { get; set; } = null!;
    public double TotalHours { get; set; }
    public decimal PayRate { get; set; }

}
