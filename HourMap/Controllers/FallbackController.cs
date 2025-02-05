using Microsoft.AspNetCore.Mvc;

namespace HourMap.Controllers;

/// <summary>
/// Fallback controller to serve the index.html file
/// </summary>
public class FallbackController : Controller
{
    /// <summary>
    /// Serve the index.html file
    /// </summary>
    /// <returns>index.html</returns>
    public ActionResult Index()
    {
        return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "index.html"), "text/HTML");
    }

}
