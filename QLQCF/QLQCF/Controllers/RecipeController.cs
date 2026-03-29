using Microsoft.AspNetCore.Mvc;
using QLQCF.Models;
using QLQCF.Repositories;
using System;
using System.Threading.Tasks;

namespace QLQCF.Controllers
{
    public class RecipeController : Controller
    {
        private readonly IRecipeRepository _recipeRepository;
        private readonly IProductRepository _productRepository;
        private readonly IIngredientRepository _ingredientRepository;

        public RecipeController(
            IRecipeRepository recipeRepository,
            IProductRepository productRepository,
            IIngredientRepository ingredientRepository)
        {
            _recipeRepository = recipeRepository;
            _productRepository = productRepository;
            _ingredientRepository = ingredientRepository;
        }

        // Hiển thị danh sách công thức
        public async Task<IActionResult> Index()
        {
            var recipes = await _recipeRepository.GetAllAsync();
            return View(recipes);
        }

        // View thêm công thức
        public async Task<IActionResult> Add()
        {
            ViewBag.Products = await _productRepository.GetAllAsync();
            ViewBag.Ingredients = await _ingredientRepository.GetAllAsync();
            return View();
        }

        // Xử lý thêm công thức
        [HttpPost]
        public async Task<IActionResult> Add(Recipe recipe)
        {
            // Kiểm tra thủ công các trường bắt buộc
            if (recipe.ProductId == 0 || recipe.IngredientId == 0 || recipe.AmountNeeded <= 0)
            {
                ViewBag.ErrorMessage = "Vui lòng điền đầy đủ thông tin hợp lệ.";
                ViewBag.Products = await _productRepository.GetAllAsync();
                ViewBag.Ingredients = await _ingredientRepository.GetAllAsync();
                return View(recipe);
            }

            try
            {
                await _recipeRepository.AddAsync(recipe);
                TempData["Success"] = "Thêm công thức thành công!";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Lỗi khi thêm công thức: " + ex.Message;
            }

            ViewBag.Products = await _productRepository.GetAllAsync();
            ViewBag.Ingredients = await _ingredientRepository.GetAllAsync();
            return View(recipe);
        }


        // View cập nhật công thức
        [HttpGet]
        public async Task<IActionResult> Update(int id)
        {
            var recipe = await _recipeRepository.GetByIdAsync(id);
            if (recipe == null)
                return NotFound();

            var products = await _productRepository.GetAllAsync();
            var ingredients = await _ingredientRepository.GetAllAsync();

            ViewBag.Products = products;
            ViewBag.Ingredients = ingredients;

            return View(recipe);
        }


        // Xử lý cập nhật công thức

        [HttpPost]
        public async Task<IActionResult> Update(Recipe recipe)
        {
            // ✅ Kiểm tra dữ liệu đầu vào thủ công
            if (recipe.ProductId == 0 || recipe.IngredientId == 0 || recipe.AmountNeeded <= 0)
            {
                ViewBag.ErrorMessage = "Vui lòng điền đầy đủ thông tin hợp lệ.";
                ViewBag.Products = await _productRepository.GetAllAsync();
                ViewBag.Ingredients = await _ingredientRepository.GetAllAsync();
                return View(recipe);
            }

            // ✅ Lấy công thức cũ
            var existingRecipe = await _recipeRepository.GetByIdAsync(recipe.RecipeId);
            if (existingRecipe == null)
            {
                ViewBag.ErrorMessage = "Công thức không tồn tại.";
                ViewBag.Products = await _productRepository.GetAllAsync();
                ViewBag.Ingredients = await _ingredientRepository.GetAllAsync();
                return View(recipe);
            }

            // ✅ Cập nhật dữ liệu
            existingRecipe.ProductId = recipe.ProductId;
            existingRecipe.IngredientId = recipe.IngredientId;
            existingRecipe.AmountNeeded = recipe.AmountNeeded;

            try
            {
                await _recipeRepository.UpdateAsync(existingRecipe);
                TempData["Success"] = "Cập nhật công thức thành công!";
                return RedirectToAction("Index");
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Lỗi khi cập nhật: " + ex.Message;
            }

            ViewBag.Products = await _productRepository.GetAllAsync();
            ViewBag.Ingredients = await _ingredientRepository.GetAllAsync();
            return View(recipe);
        }


        // View xác nhận xóa
        public async Task<IActionResult> Delete(int id)
        {
            var recipe = await _recipeRepository.GetByIdAsync(id);
            if (recipe == null)
                return NotFound();

            return View(recipe);
        }

        [HttpPost]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var recipe = await _recipeRepository.GetByIdAsync(id);
            if (recipe == null)
            {
                TempData["Error"] = "Công thức không tồn tại.";
                return RedirectToAction("Index");
            }

            try
            {
                await _recipeRepository.DeleteAsync(recipe);
                TempData["Success"] = "Xóa công thức thành công!";
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Lỗi khi xoá công thức: " + ex.Message;
            }

            return RedirectToAction("Index");
        }
       

    }
}
