using Microsoft.AspNetCore.Mvc;
using QLQCF.Models;
using QLQCF.Repositories;
using System;
using System.Threading.Tasks;

namespace QLQCF.Controllers
{
    public class CategoryDetailController : Controller
    {
        private readonly ICategoryDetailRepository _categoryDetailRepository;
        private readonly ICategoryRepository _categoryRepository;

        public CategoryDetailController(ICategoryDetailRepository categoryDetailRepository, ICategoryRepository categoryRepository)
        {
            _categoryDetailRepository = categoryDetailRepository;
            _categoryRepository = categoryRepository;
        }

        // Hiển thị danh sách chi tiết danh mục
        public async Task<IActionResult> Index()
        {
            var categoryDetails = await _categoryDetailRepository.GetAllAsync();
            return View(categoryDetails);
        }

        // View Thêm chi tiết danh mục
        public async Task<IActionResult> Add()
        {
            ViewBag.Categories = await _categoryRepository.GetAllAsync();
            return View();
        }

        // Xử lý Thêm chi tiết danh mục
        [HttpPost]
        public async Task<IActionResult> Add(CategoryDetail categoryDetail)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    await _categoryDetailRepository.AddAsync(categoryDetail);
                    TempData["Success"] = "Thêm chi tiết danh mục thành công!";
                    return RedirectToAction(nameof(Index));
                }
                catch (Exception ex)
                {
                    ModelState.AddModelError("", "Có lỗi xảy ra: " + ex.Message);
                }
            }
            ViewBag.Categories = await _categoryRepository.GetAllAsync();
            return View(categoryDetail);
        }

        // View Cập nhật chi tiết danh mục
        public async Task<IActionResult> Update(int id)
        {
            var categoryDetail = await _categoryDetailRepository.GetByIdAsync(id);
            if (categoryDetail == null)
            {
                return NotFound();
            }
            ViewBag.Categories = await _categoryRepository.GetAllAsync();
            return View(categoryDetail);
        }

        // Xử lý Cập nhật chi tiết danh mục
        [HttpPost]
        public async Task<IActionResult> Update(int id, CategoryDetail categoryDetail)
        {
            if (id != categoryDetail.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    await _categoryDetailRepository.UpdateAsync(categoryDetail);
                    TempData["Success"] = "Cập nhật chi tiết danh mục thành công!";
                    return RedirectToAction(nameof(Index));
                }
                catch (Exception ex)
                {
                    ModelState.AddModelError("", "Có lỗi xảy ra: " + ex.Message);
                }
            }
            ViewBag.Categories = await _categoryRepository.GetAllAsync();
            return View(categoryDetail);
        }

        // View Xác nhận Xóa chi tiết danh mục
        public async Task<IActionResult> Delete(int id)
        {
            var categoryDetail = await _categoryDetailRepository.GetByIdAsync(id);
            if (categoryDetail == null)
            {
                return NotFound();
            }
            return View(categoryDetail);
        }

        // Xử lý Xóa chi tiết danh mục
        [HttpPost, ActionName("DeleteConfirmed")]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            try
            {
                var categoryDetail = await _categoryDetailRepository.GetByIdAsync(id);
                if (categoryDetail != null)
                {
                    await _categoryDetailRepository.DeleteAsync(id);
                    TempData["Success"] = "Xóa chi tiết danh mục thành công!";
                }
                else
                {
                    TempData["Error"] = "Không tìm thấy chi tiết danh mục cần xóa!";
                }
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Lỗi khi xóa: " + ex.Message;
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
