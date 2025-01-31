using HourMap.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace HourMap.Data
{
    public static class DatabaseSeeder
    {
        public static async Task Seed(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            try
            {
                Console.WriteLine("Starting database migration...");
                await context.Database.MigrateAsync();
                Console.WriteLine("Database migration completed.");

                await SeedRoles(roleManager);
                await SeedOrganization(context);
                await SeedUsers(context, userManager);
                await SeedProjects(context);
                await SeedUserProjects(context);
                await SeedTimeEntries(context);

            }
            catch (SqlException ex)
            {
                Console.WriteLine($"[ERROR] Database connection failed: {ex.Message}");
                Console.WriteLine("Skipping database seeding. The application will continue running.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Unexpected error during seeding: {ex.Message}");
            }




        }

        private static async Task SeedRoles(RoleManager<IdentityRole> roleManager)
        {
            try
            {
                var roles = new[] { "Admin", "Manager", "Employee" };
                foreach (var role in roles)
                {
                    if (!await roleManager.RoleExistsAsync(role))
                    {
                        await roleManager.CreateAsync(new IdentityRole(role));
                    }
                }

            }
            catch (SqlException ex)
            {
                Console.WriteLine($"[ERROR] Failed to seed roles: {ex.Message}");
            }


        }

        private static async Task SeedOrganization(ApplicationDbContext context)
        {
            try
            {
                if (!context.Organizations.Any())
                {
                    context.Organizations.Add(new Organization { Name = "Demo Organization", CreatedAt = DateTime.UtcNow });
                    await context.SaveChangesAsync();
                }

            }
            catch (SqlException ex)
            {
                Console.WriteLine($"[ERROR] Failed to seed organization: {ex.Message}");
            }


        }

        private static async Task SeedUsers(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            try
            {
                if (!context.Users.Any())
                {
                    var manager = new ApplicationUser
                    {
                        UserName = "manager@demo.com",
                        Email = "manager@demo.com",
                        FirstName = "Manager",
                        LastName = "User",
                        OrganizationId = 1,
                        EmailConfirmed = true
                    };
                    await userManager.CreateAsync(manager, "DemoPass@123");
                    await userManager.AddToRoleAsync(manager, "Manager");

                    for (int i = 1; i <= 12; i++)
                    {
                        var employee = new ApplicationUser
                        {
                            UserName = $"employee{i}@demo.com",
                            Email = $"employee{i}@demo.com",
                            FirstName = $"Employee{i}",
                            LastName = "Demo",
                            OrganizationId = 1,
                            EmailConfirmed = true
                        };
                        await userManager.CreateAsync(employee, "DemoPass@123");
                        await userManager.AddToRoleAsync(employee, "Employee");
                    }
                }

            }
            catch (SqlException ex)
            {
                Console.WriteLine($"[ERROR] Failed to seed users: {ex.Message}");
            }


        }

        private static async Task SeedProjects(ApplicationDbContext context)
        {
            try
            {
                if (!context.Projects.Any())
                {
                    var projects = new[] { "Project A", "Project B", "Project C", "Project D" };
                    foreach (var name in projects)
                    {
                        context.Projects.Add(new Project { Name = name, Description = "Default Project Description", OrganizationId = 1 });
                    }
                    await context.SaveChangesAsync();
                }

            }
            catch (SqlException ex)
            {
                Console.WriteLine($"[ERROR] Failed to seed projects: {ex.Message}");
            }


        }

        private static async Task SeedUserProjects(ApplicationDbContext context)
        {
            try
            {
                if (!context.UserProjects.Any())
                {
                    var users = context.Users.ToList();
                    var projects = context.Projects.ToList();
                    var rand = new Random();

                    foreach (var user in users)
                    {
                        var project = projects[rand.Next(projects.Count)];
                        context.UserProjects.Add(new UserProject { UserId = user.Id, ProjectId = project.Id, OrganizationId = 1 });
                    }
                    await context.SaveChangesAsync();
                }

            }
            catch (SqlException ex)
            {
                Console.WriteLine($"[ERROR] Failed to seed user projects: {ex.Message}");
            }


        }

        private static async Task SeedTimeEntries(ApplicationDbContext context)
        {
            try
            {
                context.TimeEntries.RemoveRange(context.TimeEntries); // Clear existing time entries so we can keep it current
                await context.SaveChangesAsync();

                var users = context.Users.Where(u => u.Email!.StartsWith("employee")).ToList();
                var projects = context.Projects.ToList();
                var today = DateTime.UtcNow;
                var startPeriod = today.AddDays(-15);
                var rand = new Random();

                foreach (var user in users)
                {
                    for (int i = 0; i < 15; i++)
                    {
                        var workDate = startPeriod.AddDays(i);
                        var clockIn = workDate.Date.AddHours(rand.Next(8, 10));
                        var clockOut = clockIn.AddHours(rand.Next(6, 8));
                        var project = projects[rand.Next(projects.Count)];

                        context.TimeEntries.Add(new TimeEntry
                        {
                            UserId = user.Id,
                            OrganizationId = 1,
                            ProjectId = project.Id,
                            ClockIn = clockIn,
                            ClockOut = clockOut
                        });
                    }
                }
                await context.SaveChangesAsync();
            }
            catch (SqlException ex)
            {
                Console.WriteLine($"[ERROR] Failed to seed time entries: {ex.Message}");

            }


        }
    }
}
