﻿using Microsoft.AspNetCore.Mvc;

namespace HourMap.Controllers;

public class FallbackController : Controller
{
    public ActionResult Index()
    {
        return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "index.html"), "text/HTML");
    }

}
