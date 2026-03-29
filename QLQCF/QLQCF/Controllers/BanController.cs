using Microsoft.AspNetCore.Mvc;
using QLQCF.Models;
using QLQCF.Repositories;
using System.Drawing;
using System.Drawing.Imaging;
using QRCoder;


namespace QLQCF.Controllers
{
    public class BanController : Controller
    {
        private readonly IBan _banRepository;
        private readonly IProductRepository _productRepository;

        public BanController(IBan banRepository, IProductRepository productRepository)
        {
            _banRepository = banRepository;
            _productRepository = productRepository;
        }


        public async Task<IActionResult> Index()
        {
            var bans = await _banRepository.GetAllAsync();
            return View(bans);
        }

        public IActionResult Add()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Add(Ban ban)
        {
            await _banRepository.AddAsync(ban);
            return RedirectToAction(nameof(Index));
        }

        public async Task<IActionResult> Edit(int id)
        {
            var ban = await _banRepository.GetByIdAsync(id);
            if (ban == null) return NotFound();
            return View(ban);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Ban ban)
        {
            if (id != ban.Id) return NotFound();

            await _banRepository.UpdateAsync(ban);
            return RedirectToAction(nameof(Index));
        }

        public async Task<IActionResult> Details(int id)
        {
            var ban = await _banRepository.GetByIdAsync(id);
            if (ban == null) return NotFound();
            return View(ban); // ASP.NET sẽ tìm file Views/Ban/Details.cshtml
        }


        public async Task<IActionResult> Delete(int id)
        {
            var ban = await _banRepository.GetByIdAsync(id);
            if (ban == null) return NotFound();
            return View(ban);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            await _banRepository.DeleteAsync(id);
            return RedirectToAction(nameof(Index));
        }


        public async Task<IActionResult> ChonMon(int id)
        {
            // Lưu ID bàn vào session để dùng cho giỏ hàng hoặc order sau
            HttpContext.Session.SetInt32("BanId", id);

            // Lấy danh sách sản phẩm từ repository hoặc database
            var products = await _productRepository.GetAllAsync();

            // Truyền ID bàn sang View để giữ trạng thái
            ViewBag.BanId = id;

            return View("ChonMon", products);
        }




    }
}
