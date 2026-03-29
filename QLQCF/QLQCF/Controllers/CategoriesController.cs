using Microsoft.AspNetCore.Mvc;
using QLQCF.Models;
using QLQCF.Repositories;
using System;
using System.Threading.Tasks;

namespace QLQCF.Controllers
{
    public class CategoriesController : Controller
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly ICategoryDetailRepository _categoryDetailRepository;

        public CategoriesController(ICategoryRepository categoryRepository, ICategoryDetailRepository categoryDetailRepository)
        {
            _categoryRepository = categoryRepository;
            _categoryDetailRepository = categoryDetailRepository;
        }

        // Hiển thị danh sách danh mục
        public async Task<IActionResult> Index()
        {
            var categories = await _categoryRepository.GetAllAsync();
            return View(categories);
        }

        // View Thêm danh mục
        public IActionResult Add()
        {
            return View();
        }

        // Xử lý Thêm danh mục
        [HttpPost]
        public async Task<IActionResult> Add(Category category)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    await _categoryRepository.AddAsync(category);
                    TempData["Success"] = "Thêm danh mục thành công!";
                    return RedirectToAction(nameof(Index));
                }
                catch (Exception ex)
                {
                    ModelState.AddModelError("", "Có lỗi xảy ra: " + ex.Message);
                }
            }
            return View(category);
        }

        // View Cập nhật danh mục
        public async Task<IActionResult> Update(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
            {
                return NotFound();
            }
            return View(category);
        }

        // Xử lý Cập nhật danh mục
        [HttpPost]
        public async Task<IActionResult> Update(int id, Category category)
        {
            if (id != category.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    await _categoryRepository.UpdateAsync(category);
                    TempData["Success"] = "Cập nhật danh mục thành công!";
                    return RedirectToAction(nameof(Index));
                }
                catch (Exception ex)
                {
                    ModelState.AddModelError("", "Có lỗi xảy ra: " + ex.Message);
                }
            }

            return View(category);
        }

        // View Xác nhận Xóa danh mục
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            return View(category);
        }

        // Xử lý Xóa danh mục
        [HttpPost, ActionName("DeleteConfirmed")]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            try
            {
                var category = await _categoryRepository.GetByIdAsync(id);
                if (category != null)
                {
                    // Lấy tất cả CategoryDetail thuộc CategoryId
                    var categoryDetails = await _categoryDetailRepository.GetByCategoryIdAsync(id);

                    if (categoryDetails.Any())
                    {
                        foreach (var detail in categoryDetails)
                        {
                            await _categoryDetailRepository.DeleteAsync(detail.Id);
                        }
                    }

                    // Xóa danh mục sau khi xóa hết các chi tiết liên quan
                    await _categoryRepository.DeleteAsync(id);
                    TempData["Success"] = "Xóa danh mục thành công!";
                }
                else
                {
                    TempData["Error"] = "Không tìm thấy danh mục cần xóa!";
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