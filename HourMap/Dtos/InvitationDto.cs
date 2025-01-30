namespace HourMap.Dtos;

public class InvitationDto
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public int OrganizationId { get; set; }
    public string Token { get; set; } = null!;
    public DateTime ExpirationDate { get; set; }

}
