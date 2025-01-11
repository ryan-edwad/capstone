﻿namespace HourMap.Dtos;

public class ProjectDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public bool Enabled { get; set; } = true;

}
