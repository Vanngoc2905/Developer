using Microsoft.EntityFrameworkCore;
using QLQCF.Models;

namespace QLQCF.Repositories
{
    public class EFRecipeRepository : IRecipeRepository
    {
        private readonly ApplicationDbContext _context;

        public EFRecipeRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // Lấy tất cả công thức (kèm thông tin sản phẩm và nguyên liệu)
        public async Task<IEnumerable<Recipe>> GetAllAsync()
        {
            return await _context.Recipes
                .Include(r => r.Product)
                .Include(r => r.Ingredient)
                .ToListAsync();
        }

        // Lấy công thức theo ID (kèm thông tin sản phẩm và nguyên liệu)
        public async Task<Recipe?> GetByIdAsync(int id)
        {
            return await _context.Recipes
                .Include(r => r.Product)
                .Include(r => r.Ingredient)
                .FirstOrDefaultAsync(r => r.RecipeId == id);
        }

        // Lấy công thức theo ProductId (kèm thông tin nguyên liệu)
        public async Task<IEnumerable<Recipe>> GetByProductIdAsync(int productId)
        {
            return await _context.Recipes
                .Where(r => r.ProductId == productId)
                .Include(r => r.Ingredient)
                .Include(r => r.Product)
                .ToListAsync();
        }

        // Kiểm tra công thức theo ProductId và IngredientId
        public async Task<Recipe?> GetByProductAndIngredientAsync(int productId, int ingredientId)
        {
            return await _context.Recipes
                .FirstOrDefaultAsync(r => r.ProductId == productId && r.IngredientId == ingredientId);
        }

        // Thêm công thức mới
        public async Task AddAsync(Recipe recipe)
        {
            _context.Recipes.Add(recipe);
            await _context.SaveChangesAsync(); // <-- Cái này bắt buộc phải có
        }

        // Cập nhật công thức
        public async Task UpdateAsync(Recipe recipe)
        {
            _context.Attach(recipe);
            _context.Entry(recipe).State = EntityState.Modified;
            await _context.SaveChangesAsync(); // <-- Cái này bắt buộc phải có
        }


        // Xóa công thức
        public async Task DeleteAsync(Recipe recipe)
        {
            _context.Recipes.Remove(recipe);
            await _context.SaveChangesAsync();
        }
        // Triển khai phương thức GetByIngredientIdAsync để lấy danh sách công thức theo IngredientId
        public async Task<IEnumerable<Recipe>> GetByIngredientIdAsync(int ingredientId)
        {
            // Kiểm tra nếu ingredientId hợp lệ
            if (ingredientId <= 0)
            {
                throw new ArgumentException("IngredientId phải lớn hơn 0", nameof(ingredientId));
            }

            // Lấy danh sách công thức liên quan đến IngredientId
            var recipes = await _context.Recipes
                .Where(r => r.IngredientId == ingredientId)
                .ToListAsync();

            return recipes;
        }

        Task<IEnumerable<object>> IRecipeRepository.GetByIngredientIdAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task DeleteAsync(object id)
        {
            throw new NotImplementedException();
        }
    }
}
