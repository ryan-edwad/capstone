﻿using System.Security.Claims;
using HourMap.Data;
using HourMap.Dtos;
using HourMap.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HourMap.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public LocationController(ApplicationDbContext context)
    {
        _context = context;
    }

    // Create new location
    [HttpPost("create")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager")]
    public async Task<IActionResult> CreateLocation(LocationDto locationDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var organizationClaim = User.FindFirst("OrganizationId")?.Value;
        if (string.IsNullOrEmpty(organizationClaim))
            return Unauthorized("Access denied. OrganizationId is missing in the token.");

        if (!int.TryParse(organizationClaim, out var organizationId))
            return BadRequest("Invalid OrganizationId in token.");

        var location = new Location
        {
            Name = locationDto.Name,
            Address = locationDto.Address,
            City = locationDto.City,
            State = locationDto.State,
            Description = locationDto.Description,
            OrganizationId = organizationId
        };

        await _context.Locations.AddAsync(location);
        await _context.SaveChangesAsync();

        var newLocationDto = new LocationDto
        {
            Name = location.Name,
            Address = location.Address,
            City = location.City,
            State = location.State,
            Description = location.Description
        };

        return CreatedAtAction(nameof(GetLocation), new { id = location.Id }, new { message = "Location created successfully!", newLocationDto });
    }

    // Get individual location by ID
    [HttpGet("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager")]
    public async Task<IActionResult> GetLocation(int id)
    {
        var location = await _context.Locations.FindAsync(id);
        if (location == null) return NotFound("Location not found");

        var locationDto = new LocationDto
        {
            Name = location.Name,
            Address = location.Address,
            City = location.City,
            State = location.State,
            Description = location.Description
        };

        return Ok(locationDto);
    }

    // Get all locations for an organization
    [HttpGet("locations")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Employee,Manager")]
    public async Task<IActionResult> GetLocations()
    {
        var organizationClaim = User.FindFirst("OrganizationId");
        if (organizationClaim == null || string.IsNullOrEmpty(organizationClaim.Value)) return Unauthorized("User does not belong to an organization");
        var organizationId = int.Parse(organizationClaim.Value);

        var locations = await _context.Locations.Where(l => l.OrganizationId == organizationId).ToListAsync();
        if (locations == null || locations.Count == 0) return NotFound("No locations found for this organization");

        var locationDtos = locations.Select(l => new LocationDto
        {
            Name = l.Name,
            Address = l.Address,
            City = l.City,
            State = l.State,
            Description = l.Description
        });

        return Ok(locationDtos);
    }

    // Update location by ID, admins and ManagesOrganization == true only
    [HttpPut("update/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<IActionResult> UpdateLocation(int id, string? name, string? address, string? city, string? state, string? description)
    {
        var location = await _context.Locations.FindAsync(id);
        if (location == null) return NotFound("Location not found");

        location.Name = !string.IsNullOrWhiteSpace(name) ? name : location.Name;
        location.Address = !string.IsNullOrWhiteSpace(address) ? address : location.Address;
        location.City = !string.IsNullOrWhiteSpace(city) ? city : location.City;
        location.State = !string.IsNullOrWhiteSpace(state) ? state : location.State;
        location.Description = !string.IsNullOrWhiteSpace(description) ? description : location.Description;

        _context.Locations.Update(location);
        await _context.SaveChangesAsync();

        var locationDto = new LocationDto
        {
            Name = location.Name,
            Address = location.Address,
            City = location.City,
            State = location.State,
            Description = location.Description
        };

        return Ok(new { message = "Location updated successfully!", locationDto });
    }

    // Delete location by ID, admins and managers who has ManageOrganization == true only
    [HttpDelete("delete/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Manager,Admin")]
    public async Task<IActionResult> DeleteLocation(int id)
    {
        var location = await _context.Locations.FindAsync(id);
        if (location == null) return NotFound("Location not found");

        _context.Locations.Remove(location);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Location deleted successfully!" });
    }
}
