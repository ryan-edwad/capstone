﻿namespace HourMap.Dtos;

public class OrganizationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public List<ApplicationUserDto> Users { get; set; } = new List<ApplicationUserDto>();
    public List<ProjectDto> Projects { get; set; } = new List<ProjectDto>();
    public List<LocationDto> Locations { get; set; } = new List<LocationDto>();
    public List<InvitationDto> Invitations { get; set; } = new List<InvitationDto>();

}
