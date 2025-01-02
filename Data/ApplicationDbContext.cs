using HourMap.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HourMap.Data;


public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Organization> Organizations { get; set; } = null!;
    public DbSet<Project> Projects { get; set; } = null!;
    public DbSet<TimeEntry> TimeEntries { get; set; } = null!;
    public DbSet<Invitation> Invitations { get; set; } = null!;


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Create a default organization
        modelBuilder.Entity<Organization>().HasData(new Organization { Id = 1, Name = "Default" });

        // Relationships
        // Organization has many users
        modelBuilder.Entity<Organization>().HasMany(o => o.Users).WithOne(u => u.Organization).HasForeignKey(u => u.OrganizationId).IsRequired(false);

        // Organization has one creator
        modelBuilder.Entity<Organization>()
            .HasOne(o => o.Creator)
            .WithMany()
            .HasForeignKey(o => o.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // Project has one organization, orgniazation has many projects
        modelBuilder.Entity<Project>().HasOne(p => p.Organization).WithMany(o => o.Projects).HasForeignKey(p => p.OrganizationId).IsRequired();

        // Join table for projects/users
        modelBuilder.Entity<UserProject>().HasKey(up => new { up.UserId, up.ProjectId });
        modelBuilder.Entity<UserProject>().HasOne(up => up.User).WithMany(u => u.UserProjects).HasForeignKey(up => up.UserId).IsRequired();
        modelBuilder.Entity<UserProject>().HasOne(up => up.Project).WithMany(p => p.UserProjects).HasForeignKey(up => up.ProjectId).IsRequired();
        modelBuilder.Entity<UserProject>().Property(up => up.OrganizationId).IsRequired();

        // Time entries have one user with many time entries
        modelBuilder.Entity<TimeEntry>().HasOne(t => t.User).WithMany(u => u.TimeEntries).HasForeignKey(t => t.UserId).IsRequired();

        // Invitations have one organization
        modelBuilder.Entity<Invitation>().HasOne(i => i.Organization).WithMany(o => o.Invitations).HasForeignKey(i => i.OrganizationId).IsRequired();

    }

}
