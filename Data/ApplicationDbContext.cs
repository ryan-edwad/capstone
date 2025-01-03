using HourMap.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HourMap.Data;


public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Organization> Organizations { get; set; } = null!;
    public DbSet<Project> Projects { get; set; } = null!;
    public DbSet<Location> Locations { get; set; } = null!;
    public DbSet<TimeEntry> TimeEntries { get; set; } = null!;
    public DbSet<Invitation> Invitations { get; set; } = null!;
    public DbSet<UserProject> UserProjects { get; set; } = null!;


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Default organization
        modelBuilder.Entity<Organization>().HasData(new Organization { Id = 1, Name = "Default" });

        // ApplicationUser - Organization relationship (explicit)
        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Organization)
            .WithMany(o => o.Users)
            .HasForeignKey(u => u.OrganizationId)
            .IsRequired(false);

        modelBuilder.Entity<Organization>().HasMany(o => o.Users).WithOne(u => u.Organization).HasForeignKey(u => u.OrganizationId).IsRequired(false);

        // Organization - Projects relationship
        modelBuilder.Entity<Project>()
            .HasOne(p => p.Organization)
            .WithMany(o => o.Projects)
            .HasForeignKey(p => p.OrganizationId)
            .IsRequired();

        // Organization - Locations relationship
        modelBuilder.Entity<Location>()
            .HasOne(l => l.Organization)
            .WithMany(o => o.Locations)
            .HasForeignKey(l => l.OrganizationId)
            .IsRequired();

        // UserProject join table
        modelBuilder.Entity<UserProject>()
            .HasKey(up => new { up.UserId, up.ProjectId });
        modelBuilder.Entity<UserProject>()
            .HasOne(up => up.User)
            .WithMany(u => u.UserProjects)
            .HasForeignKey(up => up.UserId)
            .IsRequired();
        modelBuilder.Entity<UserProject>()
            .HasOne(up => up.Project)
            .WithMany(p => p.UserProjects)
            .HasForeignKey(up => up.ProjectId)
            .IsRequired();
        modelBuilder.Entity<UserProject>()
            .Property(up => up.OrganizationId)
            .IsRequired();

        // TimeEntry - ApplicationUser relationship
        modelBuilder.Entity<TimeEntry>()
            .HasOne(t => t.User)
            .WithMany(u => u.TimeEntries)
            .HasForeignKey(t => t.UserId)
            .IsRequired();

        // Organization - Invitations relationship
        modelBuilder.Entity<Invitation>()
            .HasOne(i => i.Organization)
            .WithMany(o => o.Invitations)
            .HasForeignKey(i => i.OrganizationId)
            .IsRequired();
    }


}
