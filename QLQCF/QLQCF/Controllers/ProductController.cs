using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using QLQCF.Models;
using QLQCF.Repositories;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;

namespace QLQCF.Controllers
{

    public class ProductController : Controller
    {
        private readonly IProductRepository _productRepository;
        private readonly ICategoryDetailRepository _categoryDetailRepository;
        private readonly ApplicationDbContext _context;

        public ProductController(IProductRepository productRepository, ICategoryDetailRepository categoryDetailRepository, ApplicationDbContext context)
        {
            _productRepository = productRepository;
            _categoryDetailRepository = categoryDetailRepository;
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var products = await _productRepository.GetAllAsync();
            ViewBag.CategoryDetails = await _context.CategoryDetails.ToListAsync();
            return View(products);
        }
     
        public async Task<IActionResult> Add()
        {
            await PopulateCategoryDetails();
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Add(Product product, IFormFile image)
        {
            if (product.CategoryDetailId == 0)
            {
                ModelState.AddModelError("CategoryDetailId", "Vui lòng chọn danh mục.");
                await PopulateCategoryDetails();
                return View(product);
            }

            if (image != null && image.Length > 0)
            {
                product.ImageUrl = await SaveImage(image);
            }

            await _productRepository.AddAsync(product);
            TempData["Success"] = "Sản phẩm đã được thêm thành công!";
            return RedirectToAction(nameof(Index));
        }

        private async Task<string> SaveImage(IFormFile image)
        {
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
            var filePath = Path.Combine("wwwroot/images", fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            return "/images/" + fileName;
        }
        [HttpGet]
        public IActionResult Display(int id)
        {
            var product = _context.Products.FirstOrDefault(p => p.Id == id);
            if (product == null)
            {
                return NotFound(); // Trả về lỗi 404 nếu không tìm thấy sản phẩm
            }
            return View(product);
        }
        public async Task<IActionResult> Update(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return NotFound();
            
            await PopulateCategoryDetails(product.CategoryDetailId);
            return View(product);
        }

        [HttpPost]
        public async Task<IActionResult> Update(int id, Product product, IFormFile image)
        {
            if (id != product.Id) return NotFound();
            ModelState.Remove("ImageUrl");
            
            if (!ModelState.IsValid)
            {
                await PopulateCategoryDetails(product.CategoryDetailId);
                return View(product);
            }
            
            var existingProduct = await _productRepository.GetByIdAsync(id);
            product.ImageUrl = image == null ? existingProduct.ImageUrl : await SaveImage(image);

            await _productRepository.UpdateAsync(product);
            TempData["Success"] = "Cập nhật sản phẩm thành công!";
            return RedirectToAction(nameof(Index));
        }

        public async Task<IActionResult> Delete(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return NotFound();
            return View(product);
        }

        [HttpPost, ActionName("DeleteConfirmed")]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            await _productRepository.DeleteAsync(id);
            TempData["Success"] = "Xóa sản phẩm thành công!";
            return RedirectToAction(nameof(Index));
        }

        private async Task PopulateCategoryDetails(int? selectedId = null)
        {
            var categories = await _categoryDetailRepository.GetAllAsync();
            ViewBag.CategoryDetails = new SelectList(categories, "Id", "DetailName", selectedId);
        }
        public async Task<IActionResult> CategoryDetail(string category, string detail = null)
        {
            ViewBag.Categories = await _context.Categories.ToListAsync();

            if (string.IsNullOrEmpty(category))
            {
                return BadRequest("Danh mục không hợp lệ.");
            }

            // Fix the query to use a translatable comparison
            var categoryLower = category.ToLower();
            var categoryEntity = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == categoryLower);

            if (categoryEntity == null)
            {
                return NotFound("Danh mục không tồn tại.");
            }

            // Lấy danh sách chi tiết danh mục từ CategoryDetail
            var categoryDetails = await _context.CategoryDetails
                .Where(cd => cd.CategoryId == categoryEntity.Id)
                .ToListAsync();

            // Lấy danh sách tên các chi tiết danh mục để hiển thị nút
            ViewBag.DetailNames = categoryDetails.Select(cd => cd.DetailName).ToList();
            ViewBag.CategoryName = categoryEntity.Name;

            // Lấy sản phẩm dựa trên category và detail (nếu có)
            IQueryable<Product> productsQuery = _context.Products
                .Where(p => categoryDetails.Select(cd => cd.Id).Contains(p.CategoryDetailId));

            // Nếu đã chọn một loại chi tiết, lọc theo loại đó
            if (!string.IsNullOrEmpty(detail))
            {
                // Use FirstOrDefault on the already fetched categoryDetails list
                var detailLower = detail.ToLower();
                var selectedDetail = categoryDetails
                    .FirstOrDefault(cd => cd.DetailName.ToLower() == detailLower);

                if (selectedDetail != null)
                {
                    productsQuery = productsQuery.Where(p => p.CategoryDetailId == selectedDetail.Id);
                }
            }

            // Lấy danh sách sản phẩm từ query
            var products = await productsQuery.ToListAsync();

            return View(products);
        }
    

    }
}