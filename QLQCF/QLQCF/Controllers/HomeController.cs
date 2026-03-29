using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using QLQCF.Models;
using QLQCF.Repositories;

namespace QLQCF.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IProductRepository _productRepository;

        private readonly ApplicationDbContext _context;


        public HomeController(ILogger<HomeController> logger, IProductRepository productRepository, ApplicationDbContext context)
        {
            _logger = logger;
            _productRepository = productRepository;
            _context = context;
        }

        // Hi?n th? danh sách s?n ph?m trên trang ch?
        public async Task<IActionResult> Index()
        {

            var products = await _productRepository.GetAllAsync();
            return View(products); // Truy?n tr?c ti?p model sang view
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
        public IActionResult Search(string searchTerm)
        {
            var products = _context.Products
                .Where(p => p.Name.Contains(searchTerm) || p.Description.Contains(searchTerm))
                .ToList();

            return View("SearchResults", products);
        }



    }
    


    }
