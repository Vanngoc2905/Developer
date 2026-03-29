using Microsoft.AspNetCore.Mvc;
using QLQCF.Models;
using QLQCF.Repositories;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Webnuochoa.Controllers
{
    public class InventoryController : Controller
    {
        private readonly IIngredientRepository _ingredientRepository;
        private readonly IRecipeRepository _recipeRepository;
        private readonly IProductRepository _productRepository;

        public InventoryController(IIngredientRepository ingredientRepository,
                                   IRecipeRepository recipeRepository,
                                   IProductRepository productRepository)
        {
            _ingredientRepository = ingredientRepository;
            _recipeRepository = recipeRepository;
            _productRepository = productRepository;
        }

        public async Task<IActionResult> Index()
        {
            var ingredients = await _ingredientRepository.GetAllAsync();
            return View(ingredients);
        }

        public IActionResult Add()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Add(Ingredient ingredient)
        {
            if (ingredient == null || string.IsNullOrEmpty(ingredient.Name) || ingredient.CurrentQuantity < 0)
            {
                TempData["Error"] = "Dữ liệu không hợp lệ! Vui lòng kiểm tra lại.";
                return View(ingredient);
            }

            try
            {
                await _ingredientRepository.AddAsync(ingredient);
                TempData["Success"] = "Thêm nguyên liệu thành công!";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Có lỗi xảy ra: " + ex.Message;
                return View(ingredient);
            }
        }

        public async Task<IActionResult> Update(int id)
        {
            var ingredient = await _ingredientRepository.GetByIdAsync(id);
            if (ingredient == null)
            {
                return NotFound();
            }
            return View(ingredient);
        }

        [HttpPost]
        public async Task<IActionResult> Update(int id, Ingredient ingredient)
        {
            if (id != ingredient.IngredientId)
            {
                TempData["Error"] = "ID không khớp!";
                return RedirectToAction(nameof(Index));
            }

            if (ingredient == null || string.IsNullOrEmpty(ingredient.Name) || ingredient.CurrentQuantity < 0)
            {
                TempData["Error"] = "Dữ liệu không hợp lệ! Vui lòng kiểm tra lại.";
                return View(ingredient);
            }

            try
            {
                await _ingredientRepository.UpdateAsync(ingredient);
                TempData["Success"] = "Cập nhật nguyên liệu thành công!";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Có lỗi xảy ra: " + ex.Message;
                return View(ingredient);
            }
        }

        public async Task<IActionResult> Delete(int id)
        {
            var ingredient = await _ingredientRepository.GetByIdAsync(id);
            if (ingredient == null)
            {
                TempData["Error"] = "Không tìm thấy nguyên liệu!";
                return RedirectToAction(nameof(Index));
            }
            return View(ingredient);
        }

        [HttpPost, ActionName("DeleteConfirmed")]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            try
            {
                var ingredient = await _ingredientRepository.GetByIdAsync(id);
                if (ingredient != null)
                {
                    await _ingredientRepository.DeleteAsync(id);
                    TempData["Success"] = "Xóa nguyên liệu thành công!";
                }
                else
                {
                    TempData["Error"] = "Không tìm thấy nguyên liệu cần xóa!";
                }
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Có lỗi xảy ra: " + ex.Message;
            }
            return RedirectToAction(nameof(Index));
        }

        //// ✅ Trừ nguyên liệu sau khi bán hàng
        //[HttpPost]
        //public async Task<IActionResult> DeductIngredientsWhenOrderPlaced(int productId, int quantitySold)

        //{
        //    if (productId <= 0 || quantitySold <= 0)
        //    {
        //        TempData["Error"] = "Dữ liệu đầu vào không hợp lệ.";
        //        return RedirectToAction(nameof(Index));
        //    }

        //    var recipes = await _recipeRepository.GetByProductIdAsync(productId);
        //    if (recipes == null || !recipes.Any())
        //    {
        //        TempData["Error"] = "Không tìm thấy công thức cho sản phẩm.";
        //        return RedirectToAction(nameof(Index));
        //    }

        //    foreach (var recipe in recipes)
        //    {
        //        var ingredient = await _ingredientRepository.GetByIdAsync(recipe.IngredientId);
        //        if (ingredient == null)
        //        {
        //            TempData["Error"] = $"Nguyên liệu ID {recipe.IngredientId} không tồn tại.";
        //            return RedirectToAction(nameof(Index));
        //        }

        //        double totalUsed = recipe.AmountNeeded * quantitySold;

        //        if (ingredient.CurrentQuantity < totalUsed)
        //        {
        //            TempData["Error"] = $"Không đủ nguyên liệu: {ingredient.Name}. Hiện còn {ingredient.CurrentQuantity}, cần {totalUsed}.";
        //            return RedirectToAction(nameof(Index));
        //        }

        //        ingredient.CurrentQuantity -= totalUsed;
        //        await _ingredientRepository.UpdateAsync(ingredient);
        //    }

        //    TempData["Success"] = "Đã cập nhật tồn kho sau khi bán hàng.";
        //    return RedirectToAction(nameof(Index));
        //}
    }
}
