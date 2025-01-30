using HourMap.Entities;
using Microsoft.AspNetCore.Identity;

namespace HourMap.Data;

public static class DatabaseSeeder
{
    public static async Task SeedRoles(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var roles = new List<IdentityRole>
        {
            new() { Name = "Admin" },
            new() { Name = "Manager" },
            new() { Name = "Employee" }
        };

        foreach (var role in roles)
        {
            if (role.Name != null && await roleManager.RoleExistsAsync(role.Name) == false)
            {
                await roleManager.CreateAsync(role);
            }
        }
    }

    public static async Task SeedAdminUser(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var adminEmail = "admin@example.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = "admin",
                Email = adminEmail,
                FirstName = "Admin",
                LastName = "User",
                EmailConfirmed = true,
                OrganizationId = 1
            };

            var result = await userManager.CreateAsync(adminUser, "Admin@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

    }

}
