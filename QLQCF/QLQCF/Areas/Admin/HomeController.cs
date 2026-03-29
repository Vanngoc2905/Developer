using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQCF.Models;

namespace QLQCF.Areas.Admin
{
    [Area("Admin")]
    [Authorize(Roles = SD.Role_Admin)]

    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

    }
}
